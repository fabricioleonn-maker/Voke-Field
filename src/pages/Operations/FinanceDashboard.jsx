import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { DollarSign, FileText, TrendingUp, AlertCircle, ShoppingCart, Users } from 'lucide-react';

export default function FinanceDashboard() {
  const [stats, setStats] = useState({
    totalOsApproved: 0,
    totalOsPending: 0,
    totalAdjustments: 0,
    countOs: 0,
    countCollaborators: 0,
    countProjects: 0
  });

  const loadStats = async () => {
    const [orders, adj, colabs, projects] = await Promise.all([
      api.os.list(),
      api.adjustments?.list() || Promise.resolve([]),
      api.collaborators.list(),
      api.projects.list()
    ]);

    const closingStatuses = ['Gerar NF', 'Efetuar Pagamento', 'Encerrado'];
    const approved = orders.filter(os => closingStatuses.includes(os.status)).reduce((acc, os) => acc + (os.total_value || 0), 0);
    const pending = orders.filter(os => !closingStatuses.includes(os.status)).reduce((acc, os) => acc + (os.total_value || 0), 0);
    const adjustments = adj.reduce((acc, a) => acc + (a.type === 'Adicional' ? a.value : -a.value), 0);

    setStats({
      totalOsApproved: approved,
      totalOsPending: pending,
      totalAdjustments: adjustments,
      countOs: orders.length,
      countCollaborators: colabs.length,
      countProjects: projects.length
    });
  };

  useEffect(() => { loadStats(); }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Dashboard Operações</h1>
          <p className="text-muted">Indicadores financeiros e operacionais do mês vigente.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Custo OS Aprovadas</div>
          <div className="stat-value">{formatCurrency(stats.totalOsApproved)}</div>
          <div className="stat-trend text-success"><TrendingUp size={14}/> +0% este mês</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendentes de Aprovação</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{formatCurrency(stats.totalOsPending)}</div>
          <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>{stats.countOs} ordens registradas</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ajustes (Bônus/Desc.)</div>
          <div className="stat-value" style={{ color: stats.totalAdjustments >= 0 ? 'var(--success-text)' : 'var(--danger)' }}>
            {formatCurrency(stats.totalAdjustments)}
          </div>
          <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Impacto líquido no fechamento</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total a Pagar (Est.)</div>
          <div className="stat-value text-primary">{formatCurrency(stats.totalOsApproved + stats.totalAdjustments)}</div>
          <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Exclui OS pendentes</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} /> Resumo Operacional
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span className="text-muted">Projetos Ativos</span>
            <span style={{ fontWeight: 600 }}>{stats.countProjects}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span className="text-muted">Colaboradores Alocados</span>
            <span style={{ fontWeight: 600 }}>{stats.countCollaborators}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0' }}>
            <span className="text-muted">Ticket Médio por OS</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(stats.totalOsApproved / (stats.countOs || 1))}</span>
          </div>
        </div>

        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} /> Alertas Críticos
          </h3>
          <div style={{ padding: '1rem', backgroundColor: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning)', display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <AlertCircle color="var(--warning)" size={24} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--warning-text)' }}>OS Sem Aprovação</div>
              <div className="text-sm" style={{ color: 'var(--warning-text)' }}>Existem R$ {formatCurrency(stats.totalOsPending)} em serviços que ainda não foram aprovados.</div>
            </div>
          </div>
          <p className="text-muted text-center" style={{ padding: '1rem' }}>Sincronizado com base local em tempo real.</p>
        </div>
      </div>
    </div>
  );
}
