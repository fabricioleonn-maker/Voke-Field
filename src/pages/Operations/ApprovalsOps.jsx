import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { Check, X, FileText, Eye } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function ApprovalsOps() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  const loadData = async () => {
    setLoading(true);
    const [osData, projData, colabData] = await Promise.all([
      api.os.list(),
      api.projects.list(),
      api.collaborators.list()
    ]);
    
    // Filtra apenas as que estão aguardando aprovação operacional (técnico marcou como Concluído ou já estão em Aprovação)
    setOrders(osData.filter(o => o.status === 'Concluído' || o.status === 'Aprovação').sort((a,b) => new Date(b.date) - new Date(a.date)));
    setProjects(projData);
    setCollaborators(colabData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (os) => {
    if (!await toast.confirm(`Confirmar a validação do serviço executado por ${getColabName(os.collaborator_id)}? A OS irá para faturamento.`, 'Aprovar OS')) return;
    
    await api.os.update(os.id, { ...os, status: 'Gerar NF', isApproved: true });
    await api.notifications.notifyUser(os.collaborator_id, `Serviço Aprovado! Por favor, anexe a Nota Fiscal referente à OS: ${os.code || os.id.substring(0,6).toUpperCase()}.`, '/os');
    
    toast.success('Serviço aprovado com sucesso!');
    loadData();
  };

  const handleReject = async (os) => {
    if (!await toast.confirm(`Rejeitar entrega? A OS vai voltar para "Em Execução".`, 'Devolver OS', 'danger')) return;
    
    await api.os.update(os.id, { ...os, status: 'Em Execução', isApproved: false });
    await api.notifications.notifyUser(os.collaborator_id, `Serviço rejeitado pelo gestor (OS: ${os.code || os.id.substring(0,6).toUpperCase()}). Favor verificar pendências.`, '/os');
    
    toast.success('Ordem devolvida para o técnico.');
    loadData();
  };

  const getProjectName = (id) => projects.find(p => p.id === id)?.nome || projects.find(p => p.id === id)?.name || 'Desconhecido';
  const getColabName = (id) => collaborators.find(c => c.id === id)?.nome || collaborators.find(c => c.id === id)?.name || 'Desconhecido';

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  return (
    <div>
      {loading ? <p className="text-muted" style={{ padding: '2rem' }}>Carregando pendências...</p> : orders.length === 0 ? (
        <div className="page-placeholder" style={{ margin: 0, padding: '4rem 2rem' }}>
          <Check size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem' }}>Tudo Limpo!</h2>
          <p>Nenhuma ordem aguardando aprovação dos gestores operacionais.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>OS / Data</th>
                <th>Projeto</th>
                <th>Técnico</th>
                <th>Valor Custo</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(os => (
                <tr key={os.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{os.code || os.id.substring(0,6).toUpperCase()}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>{formatDate(os.date)}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{getProjectName(os.project_id)}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>{os.serviceId || 'Serviço Padrão'}</div>
                  </td>
                  <td>{getColabName(os.collaborator_id)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--danger-text)' }}>{formatCurrency(os.total_value)}</td>
                  <td className="actions">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleApprove(os)}>
                        <Check size={16} style={{ marginRight: '0.25rem' }}/> Aprovar
                      </button>
                      <button className="btn btn-secondary text-danger hover-danger" style={{ padding: '0.4rem' }} onClick={() => handleReject(os)} title="Rejeitar">
                        <X size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
