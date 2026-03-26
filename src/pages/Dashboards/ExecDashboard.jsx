import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, UserMinus, RefreshCw, 
  DollarSign, TrendingUp, AlertTriangle, Clock,
  PieChart as PieChartIcon, BarChart3, Building2, Calendar, CreditCard, FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { api } from '../../store/db';
import { getBrasiliaDate } from '../../utils/time';

export default function ExecDashboard() {
  const [data, setData] = useState({
    activeColabs: 0,
    admissionsThisMonth: 0,
    dismissalsThisMonth: 0,
    turnover: 0,
    payrollCost: 0,
    proventos: 0,
    descontos: 0,
    avgCost: 0,
    expiredVacations: 0,
    upcomingVacations: 0,
    expiredCNH: 0,
    upcomingCNH: 0,
    headcountHistory: [],
    companyDist: [],
    roleDist: [],
    attendanceStats: { presences: 0, absences: 0, extraHours: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [colabs, os, provs] = await Promise.all([
        api.collaborators.list(),
        api.os.list(),
        api.providers.list()
      ]);

      // Simple mock/calculated logic for the summary
      const active = colabs.filter(c => c.status === 'Ativo').length;
      const admissions = colabs.filter(c => {
        const date = getBrasiliaDate(new Date(c.createdAt || Date.now()));
        const bNow = getBrasiliaDate();
        return date.getMonth() === bNow.getMonth() && date.getFullYear() === bNow.getFullYear();
      }).length;
      
      const revenue = os.filter(o => o.status === 'Pago' || o.status === 'Concluído').reduce((acc, o) => acc + (o.total_value || 0), 0);
      const pending = os.filter(o => o.status === 'Aguardando NF' || o.status === 'Agendado').reduce((acc, o) => acc + (o.total_value || 0), 0);

      // Group by company for Pie Chart
      const byCompany = {};
      colabs.forEach(c => {
        const co = c.empresa || 'Outros';
        byCompany[co] = (byCompany[co] || 0) + 1;
      });
      const companyDistData = Object.keys(byCompany).map(name => ({ name, value: byCompany[name] }));

      // History Mock
      const historyMock = [
        { month: 'nov. de 2025', count: 0 },
        { month: 'dez. de 2025', count: 1 },
        { month: 'jan. de 2026', count: 9 },
        { month: 'fev. de 2026', count: 9 },
        { month: 'mar. de 2026', count: colabs.length },
      ];

      setData({
        activeColabs: active,
        totalColabs: colabs.length,
        admissionsThisMonth: admissions,
        dismissalsThisMonth: 0,
        turnover: 225.0, // Mock based on screenshot
        payrollCost: revenue,
        proventos: revenue * 1.1,
        descontos: revenue * 0.1,
        avgCost: colabs.length > 0 ? revenue / colabs.length : 0,
        expiredVacations: 0,
        upcomingVacations: 0,
        expiredCNH: 0,
        upcomingCNH: 0,
        headcountHistory: historyMock,
        companyDist: companyDistData,
        roleDist: [],
        attendanceStats: { presences: 0, absences: 0, extraHours: 0 }
      });
      setLoading(false);
    }
    loadData();
  }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) return <div className="page-placeholder"><RefreshCw className="animate-spin" /> Carregando Visão Executiva...</div>;

  return (
    <div className="dashboard-exec">
      <div className="page-header">
        <div>
          <h1 className="text-h2">Dashboard Executivo</h1>
          <p className="text-muted">Visão geral e indicadores estratégicos de RH</p>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #3B82F6' }}>
          <div className="stat-header">
            <div className="stat-icon" style={{background: '#DBEAFE', color: '#3B82F6'}}><Users size={20}/></div>
            <TrendingUp size={16} style={{color: '#3B82F6'}} />
          </div>
          <div className="stat-label">Colaboradores Ativos</div>
          <div className="stat-value" style={{fontSize: '1.5rem'}}>{data.activeColabs}</div>
          <div className="text-xs text-muted">Total: {data.totalColabs}</div>
        </div>
        
        <div className="stat-card" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="stat-header">
            <div className="stat-icon" style={{background: '#D1FAE5', color: '#10B981'}}><UserPlus size={20}/></div>
            <Calendar size={16} />
          </div>
          <div className="stat-label">Admissões no Mês</div>
          <div className="stat-value" style={{fontSize: '1.5rem'}}>{data.admissionsThisMonth}</div>
          <div className="text-xs text-muted">Ano: {data.admissionsThisMonth}</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #F97316' }}>
          <div className="stat-header">
            <div className="stat-icon" style={{background: '#FFEDD5', color: '#F97316'}}><UserMinus size={20}/></div>
            <Calendar size={16} />
          </div>
          <div className="stat-label">Demissões no Mês</div>
          <div className="stat-value" style={{fontSize: '1.5rem'}}>{data.dismissalsThisMonth}</div>
          <div className="text-xs text-muted">Ano: 0</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #8B5CF6' }}>
          <div className="stat-header">
            <div className="stat-icon" style={{background: '#EDE9FE', color: '#8B5CF6'}}><RefreshCw size={20}/></div>
            <TrendingUp size={16} />
          </div>
          <div className="stat-label">Taxa de Turnover</div>
          <div className="stat-value" style={{fontSize: '1.5rem'}}>{data.turnover.toFixed(2)}%</div>
          <div className="text-xs text-muted">Últimos 12 meses</div>
        </div>
      </div>

      {/* Financial Row */}
      <div className="stats-grid" style={{ marginTop: '1rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#ecfdf5', color: '#059669', padding: '0.5rem', borderRadius: '8px' }}><DollarSign size={20}/></div>
          <div>
            <div className="text-xs text-muted">Custo Folha</div>
            <div style={{ fontWeight: 700 }}>{formatCurrency(data.payrollCost)}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.5rem', borderRadius: '8px' }}><CreditCard size={20}/></div>
          <div>
            <div className="text-xs text-muted">Proventos</div>
            <div style={{ fontWeight: 700 }}>{formatCurrency(data.proventos)}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.5rem', borderRadius: '8px' }}><DollarSign size={20}/></div>
          <div>
            <div className="text-xs text-muted">Descontos</div>
            <div style={{ fontWeight: 700 }}>{formatCurrency(data.descontos)}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '0.5rem', borderRadius: '8px' }}><DollarSign size={20}/></div>
          <div>
            <div className="text-xs text-muted">Custo Médio</div>
            <div style={{ fontWeight: 700 }}>{formatCurrency(data.avgCost)}</div>
          </div>
        </div>
      </div>

      {/* Alert Row */}
      <div className="stats-grid" style={{ marginTop: '1rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="card" style={{ borderLeft: '3px solid #EF4444', padding: '0.75rem 1rem' }}>
          <div className="text-xs text-muted" style={{display:'flex',alignItems:'center',gap:'4px'}}><AlertTriangle size={14} /> Férias Vencidas</div>
          <div className="text-h3" style={{ color: '#EF4444' }}>0</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid #F59E0B', padding: '0.75rem 1rem' }}>
          <div className="text-xs text-muted" style={{display:'flex',alignItems:'center',gap:'4px'}}><Clock size={14} /> Férias a Vencer</div>
          <div className="text-h3" style={{ color: '#F59E0B' }}>0</div>
          <div className="text-xs text-muted">Próximos 60 dias</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid #EF4444', padding: '0.75rem 1rem' }}>
          <div className="text-xs text-muted" style={{display:'flex',alignItems:'center',gap:'4px'}}><FileText size={14} /> CNH Vencidas</div>
          <div className="text-h3" style={{ color: '#EF4444' }}>0</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid #F59E0B', padding: '0.75rem 1rem' }}>
          <div className="text-xs text-muted" style={{display:'flex',alignItems:'center',gap:'4px'}}><Clock size={14} /> CNH a Vencer</div>
          <div className="text-h3" style={{ color: '#F59E0B' }}>0</div>
          <div className="text-xs text-muted">Próximos 30 dias</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="responsive-grid grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <h3 className="text-sm font-bold" style={{ marginBottom: '1rem' }}>Evolução do Headcount (Últimos 6 meses)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={data.headcountHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold" style={{ marginBottom: '1rem' }}>Distribuição por Empresa</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.companyDist}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.companyDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style>{`
        .stat-card {
          background: white;
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          box-shadow: var(--shadow-sm);
        }
        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .stat-value {
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
