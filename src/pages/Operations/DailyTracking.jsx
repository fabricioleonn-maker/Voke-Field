import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { CalendarDays, Clock, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBrasiliaDate, getBrasiliaTodayStr } from '../../utils/time';

export default function DailyTracking() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  // Focamos nas fases puramente operacionais para o tracking diário
  const columns = ['Criação', 'Agendado', 'Em Execução', 'Em Atraso', 'Concluído', 'Aprovação'];
  const [selectedOS, setSelectedOS] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [osData, projData, colabData] = await Promise.all([
      api.os.list(),
      api.projects.list(),
      api.collaborators.list()
    ]);
    
    // Sort orders by datetime, oldest first inside each column
    const sorted = osData.sort((a,b) => new Date(a.date) - new Date(b.date));
    setOrders(sorted);
    setProjects(projData);
    setCollaborators(colabData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProjectName = (id) => projects.find(p => p.id === id)?.nome || projects.find(p => p.id === id)?.name || 'Desconhecido';
  const getColabName = (id) => collaborators.find(c => c.id === id)?.nome || collaborators.find(c => c.id === id)?.name || 'Sem Técnico';

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  const groupedOrders = columns.reduce((acc, col) => {
    if (col === 'Em Atraso') {
      const now = getBrasiliaDate();
      const todayStr = getBrasiliaTodayStr(now);
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

      acc[col] = orders.filter(o => {
        // Apenas OS que ainda estão em campo (Agendado ou Execução) podem estar "Em Atraso"
        if (!['Agendado', 'Em Execução'].includes(o.status)) return false;

        const isPastDate = o.date < todayStr;
        const isTodayButPastTime = o.date === todayStr && o.scheduledTime && o.scheduledTime < currentTime;
        
        return isPastDate || isTodayButPastTime;
      });
    } else {
      acc[col] = orders.filter(o => {
        // Se está em atraso, removemos da coluna original (ex: Agendado) para não duplicar no Kanban
        if (o.status === col) {
           const now = getBrasiliaDate();
           const todayStr = getBrasiliaTodayStr(now);
           const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            const isDelayed = ['Agendado', 'Em Execução'].includes(o.status) && (o.date < todayStr || (o.date === todayStr && o.scheduledTime && o.scheduledTime < currentTime));
           return !isDelayed;
        }
        return false;
      });
    }
    return acc;
  }, {});

  const getColumnColor = (col) => {
    switch(col) {
      case 'Criação': return 'var(--text-muted)';
      case 'Agendado': return 'var(--warning)';
      case 'Em Execução': return 'var(--primary)';
      case 'Em Atraso': return 'var(--danger)';
      case 'Concluído': return 'var(--info)';
      case 'Aprovação': return 'var(--success)';
      default: return 'var(--border-color)';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Criação': return 'badge-neutral';
      case 'Agendado': return 'badge-warning';
      case 'Em Execução': return 'badge-primary';
      case 'Concluído': return 'badge-info';
      case 'Aprovação': return 'badge-success';
      case 'Gerar NF': return 'badge-secondary';
      case 'Aprovar NF': return 'badge-warning';
      case 'Pagamento': return 'badge-danger';
      case 'Encerrado': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Mapeando OS do dia...</div>;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <h1 className="text-h2">Acompanhamento Diário</h1>
          <p className="text-muted">Gestão visual do funil operacional das ordens de serviço (Kanban).</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/operacoes/os')}>
          Ver Lista Completa
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', flex: 1 }}>
        {columns.map(col => (
          <div key={col} style={{ 
            minWidth: '320px', 
            maxWidth: '320px', 
            backgroundColor: 'var(--bg-main)', 
            borderRadius: 'var(--radius-md)', 
            display: 'flex', 
            flexDirection: 'column',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '1rem', 
              fontWeight: 600, 
              borderBottom: `3px solid ${getColumnColor(col)}`, 
              display: 'flex', 
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-card)'
            }}>
              <span>{col}</span>
              <span className="badge" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                {groupedOrders[col]?.length || 0}
              </span>
            </div>
            
            <div style={{ padding: '0.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {groupedOrders[col]?.map(os => (
                <div key={os.id} className="card shadow-sm hover-scale" style={{ padding: '1rem', cursor: 'pointer', borderLeft: col === 'Em Atraso' ? '4px solid var(--danger)' : 'none' }} onClick={() => setSelectedOS(os)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{os.code || os.id.substring(0,6).toUpperCase()}</span>
                    {(os.status === 'Agendado' || os.status === 'Em Execução') && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {os.status === 'Agendado' ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#92400e' }}>
                             Aguardando Check-in
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.7rem', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                             Aguardando Check-out
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{getProjectName(os.project_id)}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{os.serviceId || 'Serviço s/ Especificação'}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <User size={14}/> {getColabName(os.collaborator_id)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <CalendarDays size={14}/> {formatDate(os.date)} {os.scheduledTime && `às ${os.scheduledTime}`}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!groupedOrders[col] || groupedOrders[col].length === 0) && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', opacity: 0.6 }}>
                  Nenhuma OS nesta coluna
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedOS && (
        <div className="modal-overlay" onClick={() => setSelectedOS(null)}>
          <div className="card modal-card" style={{ maxWidth: '600px', width: '95%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedOS(null)}><ChevronRight size={24} style={{ transform: 'rotate(90deg)' }}/></button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>{selectedOS.code || selectedOS.id.substring(0,6).toUpperCase()}</span>
                <h2 className="text-h3" style={{ margin: 0 }}>{getProjectName(selectedOS.project_id)}</h2>
              </div>
              <span className={`badge ${getStatusBadge(selectedOS.status)}`}>{selectedOS.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h4 className="text-xs text-muted" style={{ textTransform: 'uppercase', marginBottom: '0.5rem' }}>Informações do Atendimento</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <User size={16} className="text-muted"/> <strong>Técnico:</strong> {getColabName(selectedOS.collaborator_id)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <CalendarDays size={16} className="text-muted"/> <strong>Data:</strong> {formatDate(selectedOS.date)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <Clock size={16} className="text-muted"/> <strong>Horário:</strong> {selectedOS.scheduledTime || 'Não definido'}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs text-muted" style={{ textTransform: 'uppercase', marginBottom: '0.5rem' }}>Detalhes Operacionais</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <div style={{ fontSize: '0.9rem' }}><strong>Serviço:</strong> {selectedOS.serviceId || 'Padrão'}</div>
                   <div style={{ fontSize: '0.9rem' }}><strong>Local:</strong> {selectedOS.client || 'Não informado'}</div>
                   {selectedOS.completionDate && (
                     <div style={{ fontSize: '0.9rem', color: 'var(--success-text)' }}>
                       <strong>Concluído em:</strong> {formatDate(selectedOS.completionDate)} {selectedOS.completionTime}
                     </div>
                   )}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h4 className="text-xs text-muted" style={{ textTransform: 'uppercase', marginBottom: '0.5rem' }}>Descrição da Atividade</h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>{selectedOS.description || 'Nenhuma descrição fornecida.'}</p>
            </div>

            {selectedOS.history && selectedOS.history.length > 0 && (
              <div>
                <h4 className="text-xs text-muted" style={{ textTransform: 'uppercase', marginBottom: '0.75rem' }}>Linha do Tempo</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedOS.history.slice(-3).reverse().map((h, i) => (
                    <div key={i} style={{ padding: '0.5rem', borderLeft: '2px solid var(--border-color)', marginLeft: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{h.action} - {new Date(h.timestamp).toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOS(null)}>Fechar</button>
              <button className="btn btn-primary" onClick={() => navigate('/operacoes/os')}>Ir para Gestão de OS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
