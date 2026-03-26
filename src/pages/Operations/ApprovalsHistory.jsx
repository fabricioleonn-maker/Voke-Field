import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { CheckCircle, History, XCircle, AlertTriangle, FileText, CreditCard } from 'lucide-react';

export default function ApprovalsHistory() {
  const [loading, setLoading] = useState(false);
  const [osHistory, setOsHistory] = useState([]);
  const [closingHistory, setClosingHistory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [activeTab, setActiveTab] = useState('os'); // 'os' ou 'fechamentos'

  const loadData = async () => {
    setLoading(true);
    const [osData, closingData, projData, colabData] = await Promise.all([
      api.os.list(),
      api.closings?.list() || Promise.resolve([]),
      api.projects.list(),
      api.collaborators.list()
    ]);
    
    // Filtra ordens que já saíram da criação/agendamento (já tiveram alguma ação operacional)
    const filteredOS = osData.filter(o => 
      ['Concluído', 'Aprovação', 'Gerar NF', 'Aprovar NF', 'Pagamento', 'Encerrado', 'Cancelado'].includes(o.status)
    ).sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date));

    // Filtra fechamentos que já foram processados ou estão em andamento pós-geração
    const filteredClosings = closingData.sort((a,b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date));

    setOsHistory(filteredOS);
    setClosingHistory(filteredClosings);
    setProjects(projData);
    setCollaborators(colabData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProjectName = (id) => projects.find(p => p.id === id)?.nome || projects.find(p => p.id === id)?.name || 'Desconhecido';
  const getColabName = (id) => collaborators.find(c => c.id === id)?.nome || collaborators.find(c => c.id === id)?.name || 'Desconhecido';

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Concluído': return 'badge-info';
      case 'Aprovação': return 'badge-success';
      case 'Pago': return 'badge-success';
      case 'Encerrado': return 'badge-success';
      case 'Cancelado': return 'badge-danger';
      case 'Gerar NF': return 'badge-secondary';
      case 'Aprovar NF': return 'badge-warning';
      case 'Pagamento': return 'badge-danger';
      case 'A Pagar': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="text-h3">Histórico de Movimentações</h2>
        <p className="text-muted">Acompanhe todas as aprovações, recusas e pagamentos realizados no sistema.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button 
            onClick={() => setActiveTab('os')}
            style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', borderBottom: activeTab === 'os' ? '3px solid var(--primary)' : 'none', fontWeight: activeTab === 'os' ? 700 : 500, color: activeTab === 'os' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer' }}
        >
            Ordens de Serviço
        </button>
        <button 
            onClick={() => setActiveTab('fechamentos')}
            style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', borderBottom: activeTab === 'fechamentos' ? '3px solid var(--primary)' : 'none', fontWeight: activeTab === 'fechamentos' ? 700 : 500, color: activeTab === 'fechamentos' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer' }}
        >
            Fechamentos (NF/Pagto)
        </button>
      </div>

      {loading ? <p className="text-muted" style={{ padding: '2rem' }}>Sincronizando registros...</p> : (
        activeTab === 'os' ? (
          osHistory.length === 0 ? (
            <div className="page-placeholder" style={{ padding: '4rem 2rem' }}>
              <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Nenhuma movimentação de OS registrada ainda.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>OS / Código</th>
                    <th>Projeto / Local</th>
                    <th>Técnico</th>
                    <th>Valor</th>
                    <th>Status / Histórico</th>
                  </tr>
                </thead>
                <tbody>
                  {osHistory.map(os => (
                    <tr key={os.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{os.code || os.id.substring(0,6).toUpperCase()}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{formatDate(os.date)}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{getProjectName(os.project_id)}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{os.client || os.serviceId || 'Serviço Padrão'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>{getColabName(os.collaborator_id)}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{formatCurrency(os.total_value)}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${getStatusBadge(os.status)}`}>{os.status}</span>
                        {os.rejectionReason && (
                          <div style={{ marginTop: '0.5rem', color: 'var(--danger)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             <AlertTriangle size={12} /> Recusada: {os.rejectionReason}
                          </div>
                        )}
                        {os.isApproved && <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '4px' }}><CheckCircle size={10} style={{ display: 'inline', marginRight: '2px' }}/> Aprovado Operações</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          closingHistory.length === 0 ? (
            <div className="page-placeholder" style={{ padding: '4rem 2rem' }}>
              <CreditCard size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Nenhum fechamento processado ainda.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Prestador / Colab.</th>
                    <th>Valor Líquido</th>
                    <th>Nota Fiscal</th>
                    <th>Status / Ocorrências</th>
                  </tr>
                </thead>
                <tbody>
                  {closingHistory.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{c.period || `${c.month}/${c.year}`}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Gerado em: {formatDate(c.date)}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{c.provider || c.collaborator_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Ref: {c.os_ids?.length || 0} OSs</div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(c.total)}</td>
                      <td style={{ padding: '1rem' }}>
                        {c.nf_url ? (
                          <span style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> NF Anexada
                          </span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Sem NF</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span>
                        {c.rejectionReason && (
                          <div style={{ marginTop: '0.5rem', color: 'var(--danger)', fontSize: '0.75rem', padding: '0.25rem', backgroundColor: 'rgba(var(--danger-rgb), 0.05)', borderRadius: '4px' }}>
                             <strong>Motivo Recusa:</strong> {c.rejectionReason}
                             <div className="text-muted" style={{ fontSize: '0.7rem' }}>Por: {c.rejectedBy} em {formatDate(c.rejectedAt)}</div>
                          </div>
                        )}
                        {c.paidAt && <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px', fontWeight: 600 }}>Pago em {formatDate(c.paidAt)}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )
      )}
    </div>
  );
}
