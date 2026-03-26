import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { Search, FileText, CheckCircle, AlertCircle, Printer } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { getBrasiliaDate, getBrasiliaISO } from '../../utils/time';

export default function GenerateClosing() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState('mensal'); // 'mensal' ou 'customizado'
  const [month, setMonth] = useState(getBrasiliaDate().getMonth() + 1);
  const [year, setYear] = useState(getBrasiliaDate().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [closings, setClosings] = useState([]);
  
  const [data, setData] = useState({
    orders: [],
    collaborators: [],
    providers: [],
    adjustments: []
  });

  const loadBaseData = async () => {
    const [orders, colabs, provs, adjs] = await Promise.all([
      api.os.list(),
      api.collaborators.list(),
      api.providers.list(),
      api.adjustments?.list() || Promise.resolve([])
    ]);
    setData({ orders, collaborators: colabs, providers: provs, adjustments: adjs });
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  const getProviderByColabId = (colabId) => {
    const colab = data.collaborators.find(c => c.id === colabId);
    if (!colab) return 'Unknown';
    if (colab.providerId) {
      const provider = data.providers.find(p => p.id === colab.providerId);
      return provider ? provider.razaoSocial : 'Unknown Provider';
    }
    return colab.nome; // Independent collaborator
  };

  const handleGenerate = async () => {
    if (closings.length === 0) return toast.info("Nenhuma OS disponível para fechamento neste período.");
    
    setLoading(true);
    try {
      for (const group of closings) {
        const newClosing = {
          month: periodType === 'mensal' ? month : null,
          year: periodType === 'mensal' ? year : null,
          startDate: periodType === 'custom' ? startDate : null,
          endDate: periodType === 'custom' ? endDate : null,
          provider: group.name,
          providerId: group.isCompany ? group.id : null,
          collaboratorId: group.collaboratorId || null,
          total: group.totalValue,
          status: 'Pendente',
          date: getBrasiliaISO()
        };
        
        const savedClosing = await api.closings.create(newClosing);
        
        // Vincular OS ao fechamento e mudar status para "Gerar NF"
        for (const os of group.orders) {
          await api.os.update(os.id, { 
            closing_id: savedClosing.id, 
            status: 'Gerar NF' 
          });
        }

        // Vincular Ajustes ao fechamento
        for (const adj of group.adjustments) {
          await api.adjustments.update(adj.id, {
            closing_id: savedClosing.id,
            status: 'Compensado'
          });
        }
      }

      toast.success("Fechamentos gerados com sucesso! As ordens agora aguardam emissão de NF.");
      loadBaseData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar fechamento.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    // Regra: Somente OS 'Concluído' (finalizadas pelo técnico) entram em novos fechamentos
    // e que ainda não tenham um closing_id vinculado
    let filtered = data.orders.filter(os => os.status === 'Concluído' && !os.closing_id);
    
    if (periodType === 'mensal') {
      filtered = filtered.filter(os => {
        const d = getBrasiliaDate(new Date(os.date + 'T12:00:00'));
        return (d.getMonth() + 1) === Number(month) && d.getFullYear() === Number(year);
      });
    } else if (startDate && endDate) {
      filtered = filtered.filter(os => os.date >= startDate && os.date <= endDate);
    }
    
    return filtered;
  };

  const calculateClosings = () => {
    const filteredOrders = getFilteredOrders();
    // Filtrar ajustes pendentes (status 'Pendente' e sem closing_id)
    const pendingAdjs = data.adjustments.filter(a => a.status !== 'Compensado' && !a.closing_id);
    const groups = {};

    filteredOrders.forEach(os => {
      const techId = os.technician_id || os.collaborator_id;
      const colab = data.collaborators.find(c => c.id === techId);
      if (!colab) return;

      const key = colab.providerId || `tech_${colab.id}`;
      if (!groups[key]) {
        const provider = colab.providerId ? data.providers.find(p => p.id === colab.providerId) : null;
        groups[key] = {
          id: key,
          name: provider ? provider.razaoSocial : colab.nome,
          isCompany: !!colab.providerId,
          collaboratorId: colab.providerId ? null : colab.id,
          orders: [],
          adjustments: [],
          totalValue: 0,
          collaborators: new Set()
        };
      }

      groups[key].orders.push(os);
      groups[key].totalValue += (os.total_value || 0);
      groups[key].collaborators.add(colab.nome);
    });

    // Adicionar Ajustes aos grupos
    pendingAdjs.forEach(adj => {
       const colab = data.collaborators.find(c => c.id === adj.collaborator_id);
       if (!colab) return;
       const key = colab.providerId || `tech_${colab.id}`;
       if (groups[key]) {
         groups[key].adjustments.push(adj);
         const val = Number(adj.value || 0);
         groups[key].totalValue += (adj.type === 'Adicional' ? val : -val);
       }
    });

    setClosings(Object.values(groups));
  };

  useEffect(() => {
    calculateClosings();
  }, [month, year, startDate, endDate, periodType, data]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Gerar Fechamento de Prestadores</h1>
          <p className="text-muted">Consolidação de Ordens de Serviço aprovadas para pagamento.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary">
            <Printer size={18} />
            Relatório Geral
          </button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            <CheckCircle size={18} />
            {loading ? 'Processando...' : 'Confirmar Fechamento Mensal'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Tipo de Período</label>
            <select className="input-field" value={periodType} onChange={e => setPeriodType(e.target.value)}>
              <option value="mensal">Mensal</option>
              <option value="custom">Customizado</option>
            </select>
          </div>

          {periodType === 'mensal' ? (
            <>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Mês</label>
                <select className="input-field" value={month} onChange={e => setMonth(e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Ano</label>
                <input type="number" className="input-field" value={year} onChange={e => setYear(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Data Início</label>
                <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Data Fim</label>
                <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </>
          )}

          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>Total Geral do Período</div>
            <div className="text-h3 text-primary">{formatCurrency(closings.reduce((acc, c) => acc + c.totalValue, 0))}</div>
          </div>
        </div>
      </div>

      <div className="card">
        {closings.length === 0 ? (
          <div className="page-placeholder">
            <AlertCircle size={48} />
            <h2>Nenhum fechamento pendente</h2>
            <p>Não há Ordens de Serviço **Aprovadas** para este período.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prestador (Empresa ou Ind.)</th>
                  <th>Colaboradores Atendendo</th>
                  <th>Total OS</th>
                  <th>Valor Bruto</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {closings.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {item.isCompany ? 'Empresa PJ' : 'Prestador Independente'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {Array.from(item.collaborators).join(', ')}
                      </div>
                    </td>
                    <td><span className="badge badge-neutral">{item.orders.length} OS</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--success-text)' }}>{formatCurrency(item.totalValue)}</td>
                    <td className="actions">
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>Ver Detalhes</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
