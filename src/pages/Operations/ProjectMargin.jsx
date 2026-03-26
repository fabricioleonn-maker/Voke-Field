import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { TrendingUp, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Briefcase, Download } from 'lucide-react';

export default function ProjectMargin() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projects, allOs] = await Promise.all([
        api.projects.list(),
        api.os.list()
      ]);

      const projectStats = projects.map(proj => {
        const projOs = allOs.filter(os => os.project_id === proj.id);
        
        // Receita: total_value da OS
        const revenue = projOs.reduce((acc, os) => acc + (Number(os.total_value) || 0), 0);
        
        // Custo: Simulado como 70% se não houver campo específico
        const cost = projOs.reduce((acc, os) => acc + (Number(os.technician_cost) || (Number(os.total_value) * 0.7)), 0);
        
        const margin = revenue - cost;
        const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

        return {
          id: proj.id,
          name: proj.name,
          client: proj.client,
          osCount: projOs.length,
          revenue,
          cost,
          margin,
          marginPercent
        };
      }).filter(s => s.revenue > 0);

      setStats(projectStats.sort((a, b) => b.revenue - a.revenue));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Projeto', 'Cliente', 'Qtd OS', 'Faturamento', 'Custo Direto', 'Margem R$', 'Margem %'];
    const rows = stats.map(s => [
      s.name, s.client, s.osCount, s.revenue.toFixed(2), s.cost.toFixed(2), s.margin.toFixed(2), s.marginPercent.toFixed(1)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(r => r.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `margem_projetos_${new Date().toLocaleDateString('en-CA')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { loadData(); }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) return <div className="p-8 text-center text-muted">Carregando análise...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Margem por Projeto (BI)</h1>
          <p className="text-muted">Análise de rentabilidade e ROI por centro de custo.</p>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
           <Download size={18} /> Exportar CSV
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}><DollarSign size={20}/></div>
          <div className="stat-value">{formatCurrency(stats.reduce((acc, s) => acc + s.revenue, 0))}</div>
          <div className="stat-label">Receita Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}><TrendingUp size={20}/></div>
          <div className="stat-value">{formatCurrency(stats.reduce((acc, s) => acc + s.cost, 0))}</div>
          <div className="stat-label">Custo Operacional</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#10b981' }}><PieChart size={20}/></div>
          <div className="stat-value">{formatCurrency(stats.reduce((acc, s) => acc + s.margin, 0))}</div>
          <div className="stat-label">Margem Bruta</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Projeto / Cliente</th>
                <th style={{ textAlign: 'center' }}>Qtd OS</th>
                <th>Faturamento</th>
                <th>Custo Direto</th>
                <th>Margem R$</th>
                <th>Margem %</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{s.client}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}><span className="badge badge-neutral">{s.osCount}</span></td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(s.revenue)}</td>
                  <td style={{ color: 'var(--danger)' }}>{formatCurrency(s.cost)}</td>
                  <td style={{ fontWeight: 600, color: s.margin >= 0 ? 'var(--success-text)' : 'var(--danger)' }}>
                    {formatCurrency(s.margin)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: s.marginPercent > 20 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                      {s.marginPercent > 20 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                      {s.marginPercent.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
