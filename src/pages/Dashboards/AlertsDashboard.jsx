import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Calendar, Shield, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { api } from '../../store/db';
import { getBrasiliaDate } from '../../utils/time';

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState({
    critical: [],
    warning: [],
    info: [],
    stats: { expired: 0, upcoming: 0, pending: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [colabs, os] = await Promise.all([
        api.collaborators.list(),
        api.os.list()
      ]);

      const critical = [];
      const warning = [];
      const info = [];

      // Check for CNH expirations (Mocking some)
      colabs.forEach(c => {
        if (!c.vencimentoCnh) return;
        const expiry = getBrasiliaDate(new Date(c.vencimentoCnh));
        const today = getBrasiliaDate();
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          critical.push({ type: 'CNH Vencida', target: c.nome, date: c.vencimentoCnh });
        } else if (diffDays < 30) {
          warning.push({ type: 'CNH a Vencer', target: c.nome, date: c.vencimentoCnh });
        }
      });

      // Check for OS pending for long time
      os.filter(o => o.status === 'Agendado').forEach(o => {
        const orderDate = getBrasiliaDate(new Date(o.date));
        const today = getBrasiliaDate();
        const diffDays = Math.ceil((today - orderDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 7) {
          warning.push({ type: 'OS Atrasada', target: `OS ${o.description}`, date: o.date });
        }
      });

      setAlerts({
        critical,
        warning,
        info,
        stats: {
          expired: critical.length,
          upcoming: warning.length,
          pending: os.filter(o => o.status === 'Pendente' || o.status === 'Aguardando NF').length
        }
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="page-placeholder"><RefreshCw className="animate-spin" /> Carregando Alertas...</div>;

  return (
    <div className="dashboard-alerts">
      <div className="page-header">
        <div>
          <h1 className="text-h2">Dashboard de Alertas e Compliance</h1>
          <p className="text-muted">Monitoramento de riscos e pendências de conformidade.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-label">Alertas Críticos</div>
          <div className="stat-value text-danger">{alerts.stats.expired}</div>
          <p className="text-xs text-muted">Ação imediata recomendada</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-label">A Vencer (30 dias)</div>
          <div className="stat-value text-warning">{alerts.stats.upcoming}</div>
          <p className="text-xs text-muted">Ações preventivas</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-label">Pendências Administrativas</div>
          <div className="stat-value text-primary">{alerts.stats.pending}</div>
          <p className="text-xs text-muted">Aguardando aprovação/NF</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">Score de Compliance</div>
          <div className="stat-value text-success">92%</div>
          <p className="text-xs text-muted">Meta: &gt; 95%</p>
        </div>
      </div>

      <div className="responsive-grid grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle size={20} /> Bloqueios e Críticos
          </h3>
          {alerts.critical.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <CheckCircle size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
              <p>Nenhum alerta crítico encontrado.</p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.critical.map((a, i) => (
                <div key={i} className="alert-item critical">
                  <div className="alert-content">
                    <span className="alert-type">{a.type}</span>
                    <span className="alert-target">{a.target}</span>
                  </div>
                  <span className="alert-date">Vencido {a.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1.5rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} /> Atenção / Próximos
          </h3>
          {alerts.warning.length === 0 ? (
            <p className="text-muted">Nenhum alerta de atenção para o período.</p>
          ) : (
            <div className="alerts-list">
              {alerts.warning.map((a, i) => (
                <div key={i} className="alert-item warning">
                  <div className="alert-content">
                    <span className="alert-type">{a.type}</span>
                    <span className="alert-target">{a.target}</span>
                  </div>
                  <span className="alert-date">Vence em {a.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .alert-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          background: var(--bg-main);
          border-left: 4px solid #ccc;
        }
        .alert-item.critical { border-left-color: #ef4444; }
        .alert-item.critical .alert-type { color: #ef4444; font-weight: 700; }
        .alert-item.warning { border-left-color: #f59e0b; }
        .alert-item.warning .alert-type { color: #d97706; font-weight: 700; }
        
        .alert-content {
          display: flex;
          flex-direction: column;
        }
        .alert-type {
          font-size: 0.75rem;
          text-transform: uppercase;
        }
        .alert-target {
          font-size: 0.875rem;
          font-weight: 600;
        }
        .alert-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
