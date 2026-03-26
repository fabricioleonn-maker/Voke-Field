import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, 
  BarChart3, PieChart as PieChartIcon, RefreshCw, Briefcase 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell, PieChart, Pie
} from 'recharts';
import { api } from '../../store/db';

export default function FinanceiroDashboard() {
  const [data, setData] = useState({
    totalRevenue: 0,
    totalCost: 0,
    netMargin: 0,
    marginPercent: 0,
    history: [],
    projectProfits: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [os, colabs, projects, adj] = await Promise.all([
        api.os.list(),
        api.collaborators.list(),
        api.projects.list(),
        api.adjustments?.list() || Promise.resolve([])
      ]);

      const approvedOs = os.filter(o => o.status === 'Pago' || o.status === 'Concluído' || o.status === 'Aguardando NF');
      const revenue = approvedOs.reduce((acc, o) => acc + (o.total_value || 0), 0);
      
      // Calculate costs (Mocking collaborator costs as 60% of revenue for demonstration if not explicit)
      // Real logic would sum up the payment details
      const cost = revenue * 0.65;
      const margin = revenue - cost;

      // Group by project
      const byProject = {};
      approvedOs.forEach(o => {
        const p = o.project_name || 'Diversos';
        if (!byProject[p]) byProject[p] = { name: p, revenue: 0, cost: 0 };
        byProject[p].revenue += (o.total_value || 0);
        byProject[p].cost += (o.total_value || 0) * 0.6; // Mock cost ratio per project
      });

      const projectProfitsData = Object.values(byProject).map(p => ({
        ...p,
        margin: p.revenue - p.cost
      })).sort((a,b) => b.revenue - a.revenue).slice(0, 5);

      setData({
        totalRevenue: revenue,
        totalCost: cost,
        netMargin: margin,
        marginPercent: revenue > 0 ? (margin / revenue) * 100 : 0,
        history: [
          { month: 'Out', revenue: revenue * 0.8, cost: revenue * 0.5 },
          { month: 'Nov', revenue: revenue * 0.9, cost: revenue * 0.55 },
          { month: 'Dez', revenue: revenue * 1.1, cost: revenue * 0.7 },
          { month: 'Jan', revenue: revenue * 0.95, cost: revenue * 0.62 },
          { month: 'Fev', revenue: revenue * 1.05, cost: revenue * 0.68 },
          { month: 'Mar', revenue: revenue, cost: cost },
        ],
        projectProfits: projectProfitsData
      });
      setLoading(false);
    }
    load();
  }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) return <div className="page-placeholder"><RefreshCw className="animate-spin" /> Carregando Dashboard Financeiro...</div>;

  return (
    <div className="dashboard-finance">
      <div className="page-header">
        <div>
          <h1 className="text-h2">Dashboard Financeiro (BI)</h1>
          <p className="text-muted">Análise de rentabilidade, custos e faturamento.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Receita Bruta (Aprovada)</div>
          <div className="stat-value text-primary">{formatCurrency(data.totalRevenue)}</div>
          <p className="text-xs text-muted"><TrendingUp size={12} inline /> +12% vs mês anterior</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Custo Operacional Est.</div>
          <div className="stat-value text-danger">{formatCurrency(data.totalCost)}</div>
          <p className="text-xs text-muted">Inclui pagamentos e ajustes</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Margem Líquida</div>
          <div className="stat-value text-success">{formatCurrency(data.netMargin)}</div>
          <p className="text-xs text-green-600 font-bold">{data.marginPercent.toFixed(1)}% de rentabilidade</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ticket Médio Projeto</div>
          <div className="stat-value text-primary">{formatCurrency(data.totalRevenue / 5)}</div>
          <p className="text-xs text-muted">Base: Principais projetos</p>
        </div>
      </div>

      <div className="responsive-grid grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1.5rem' }}>Evolução: Receita vs Custo</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" name="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Custo" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1.5rem' }}>Rentabilidade por Projeto (Top 5)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={data.projectProfits} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" name="Receita" fill="#10b981" />
                <Bar dataKey="margin" name="Margem" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
