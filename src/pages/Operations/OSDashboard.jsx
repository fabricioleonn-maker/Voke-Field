import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { 
  ClipboardList, Clock, Play, CheckCircle, 
  UserCheck, FileText, CreditCard, Lock,
  ArrowRight
} from 'lucide-react';

export default function OSDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const phases = [
    { id: 'Criação', icon: <ClipboardList />, color: '#94a3b8' },
    { id: 'Agendado', icon: <Clock />, color: '#f59e0b' },
    { id: 'Em Execução', icon: <Play />, color: '#3b82f6' },
    { id: 'Concluído', icon: <CheckCircle />, color: '#06b6d4' },
    { id: 'Aprovação', icon: <UserCheck />, color: '#10b981' },
    { id: 'Gerar NF', icon: <FileText />, color: '#8b5cf6' },
    { id: 'Efetuar Pagamento', icon: <CreditCard />, color: '#ef4444' },
    { id: 'Encerrado', icon: <Lock />, color: '#475569' }
  ];

  const loadStats = async () => {
    setLoading(true);
    const orders = await api.os.list();
    
    const counts = {};
    phases.forEach(p => counts[p.id] = 0);
    
    orders.forEach(os => {
      if (counts[os.status] !== undefined) {
        counts[os.status]++;
      } else {
        counts['Criação']++; // Default
      }
    });

    setStats(counts);
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-muted">Carregando métricas...</div>;

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Dashboard de Operações</h1>
          <p className="text-muted">Visão em tempo real das fases das Ordens de Serviço.</p>
        </div>
      </div>

      {/* Funil de Fases */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {phases.map((phase, idx) => (
          <div key={phase.id} className="card shadow-sm" style={{ borderTop: `4px solid ${phase.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ color: phase.color }}>{phase.icon}</div>
              <span className="text-h2" style={{ color: phase.color }}>{stats[phase.id] || 0}</span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{phase.id}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
               <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-main)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, width: `${total ? (stats[phase.id]/total)*100 : 0}%`, backgroundColor: phase.color, borderRadius: '3px' }}></div>
               </div>
               <span className="text-xs text-muted" style={{ marginLeft: '0.75rem' }}>{total ? Math.round((stats[phase.id]/total)*100) : 0}%</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1.5rem' }}>Gargalos Atuais</h3>
          {total === 0 ? <p className="text-muted">Sem dados para análise.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {phases.filter(p => stats[p.id] > 0 && p.id !== 'Encerrado').map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: p.color }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.id}</div>
                    <div className="text-xs text-muted">{stats[p.id]} OS aguardando ação nesta fase.</div>
                  </div>
                  <ArrowRight size={18} className="text-muted" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ background: 'var(--primary-gradient)', color: 'white' }}>
          <h3 className="text-h3" style={{ color: 'white', marginBottom: '1.5rem' }}>Resumo de Fluxo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div className="text-sm opacity-80">OS em Campo (Execução)</div>
              <div className="text-h1">{stats['Em Execução'] || 0}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">Aguardando Avaliação</div>
              <div className="text-h1">{stats['Aprovação'] || 0}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">Total Não Encerradas</div>
              <div className="text-h1">{total - (stats['Encerrado'] || 0)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
