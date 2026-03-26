import React, { useState } from 'react';
import { 
  FileText, Download, TrendingUp, Calendar, 
  CheckCircle, BarChart3, TrendingDown,
  Building2, Users, Edit2, Info, BarChart2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function BenefitsReport() {
  const [activeMonth, setActiveMonth] = useState('Mar');

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const chartData = [
    { name: 'Out', vr: 0, vt: 0, total: 0 },
    { name: 'Nov', vr: 0, vt: 0, total: 0 },
    { name: 'Dez', vr: 420, vt: 0, total: 420 },
    { name: 'Jan', vr: 420, vt: 0, total: 420 },
    { name: 'Fev', vr: 400, vt: 0, total: 400 },
    { name: 'Mar', vr: 440, vt: 0, total: 440 },
  ];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
            <FileText size={24} /> Relatório de Benefícios
          </h1>
          <p className="text-muted">Vale Refeição e Vale Transporte dos colaboradores CLT</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" style={{ backgroundColor: '#ef4444', color: 'white' }}><FileText size={16}/> Exportar PDF</button>
          <button className="btn" style={{ backgroundColor: '#10b981', color: 'white' }}><Download size={16}/> Exportar Excel</button>
          <button className="btn btn-neutral" style={{ color: '#10b981', borderColor: '#10b981', backgroundColor: 'transparent' }}><Download size={16}/> Exportar CSV</button>
        </div>
      </div>

      {/* Filters */}

      <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#3b82f6' }}>
              <Calendar size={16} /> Selecione o Período
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {months.map(m => (
                <button 
                  key={m}
                  className={`btn ${activeMonth === m ? 'btn-primary' : 'btn-neutral'}`}
                  onClick={() => setActiveMonth(m)}
                  style={{ 
                    padding: '0.25rem 0.75rem', 
                    fontSize: '0.85rem',
                    backgroundColor: activeMonth === m ? '#3b82f6' : 'white',
                    color: activeMonth === m ? 'white' : '#64748b',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="text-sm font-medium">Ano:</span>
              <select className="form-control" style={{ width: '100px', display: 'inline-block', padding: '0.25rem' }}>
                <option>2026</option>
                <option>2025</option>
              </select>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1rem', minWidth: '150px', textAlign: 'center' }}>
            <div className="text-sm" style={{ color: '#3b82f6' }}>Dias úteis no período:</div>
            <div className="text-h2" style={{ color: '#3b82f6' }}>22 dias</div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ea580c', marginBottom: '0.5rem' }}>
            <Users size={16} /> <span className="text-sm font-medium">Colaboradores com Benefícios</span>
          </div>
          <div className="text-h1" style={{ color: '#ea580c' }}>1</div>
        </div>
        <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} /> <span className="text-sm font-medium">Total VR Mensal</span>
          </div>
          <div className="text-h1" style={{ color: '#16a34a' }}>R$ 440.00</div>
        </div>
        <div className="card" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} /> <span className="text-sm font-medium">Total VT Mensal</span>
          </div>
          <div className="text-h1" style={{ color: '#2563eb' }}>R$ 0.00</div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ marginBottom: '1rem', overflowX: 'auto' }}>
        <table className="data-table" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Cargo</th>
              <th className="text-center">Dias Úteis</th>
              <th className="text-right">VR Diário</th>
              <th className="text-right">VR Mensal</th>
              <th className="text-right">VT Diário</th>
              <th className="text-right">VT Mensal</th>
              <th className="text-right" style={{ color: '#9333ea' }}>Total Mês</th>
              <th>Observação</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>Robson Paulo Santos</td>
              <td className="text-muted">Técnico de Help Desk</td>
              <td className="text-center" style={{ color: '#9333ea', fontWeight: 600 }}>22</td>
              <td className="text-right text-muted">R$ 20.00</td>
              <td className="text-right" style={{ color: '#16a34a' }}>R$ 440.00</td>
              <td className="text-right text-muted">R$ 0.00</td>
              <td className="text-right" style={{ color: '#2563eb' }}>R$ 0.00</td>
              <td className="text-right" style={{ color: '#9333ea', fontWeight: 600 }}>R$ 440.00</td>
              <td className="text-muted">-</td>
              <td className="text-center">
                <button className="icon-btn text-muted"><Edit2 size={14}/></button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#faf5ff' }}>
              <td colSpan="4" style={{ fontWeight: 700, padding: '1rem' }}>TOTAL GERAL</td>
              <td className="text-right" style={{ fontWeight: 700, color: '#16a34a' }}>R$ 440.00</td>
              <td className="text-right"></td>
              <td className="text-right" style={{ fontWeight: 700, color: '#2563eb' }}>R$ 0.00</td>
              <td className="text-right" style={{ fontWeight: 700, color: '#9333ea' }}>R$ 440.00</td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Charts section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem 0' }}>
        <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4c1d95' }}>
          <BarChart2 size={20} /> Análise de Custos (Últimos 6 Meses)
        </h3>
        <button className="btn btn-neutral text-xs text-muted" style={{ padding: '0.25rem 0.5rem' }}>x Ocultar Gráficos</button>
      </div>

      {/* Charts */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h4 className="font-semibold mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={16} className="text-muted"/> Evolução Mensal de Benefícios
        </h4>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <RechartsTooltip />
              <Legend verticalAlign="bottom" height={36}/>
              <Bar dataKey="vr" name="Vale Refeição" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="vt" name="Vale Transporte" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h4 className="font-semibold mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={16} className="text-muted"/> Tendência de Custo Total
        </h4>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <RechartsTooltip />
              <Legend verticalAlign="bottom" height={36}/>
              <Line type="monotone" dataKey="total" name="Custo Total (VR + VT)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '0.5rem' }}>
            <span className="text-sm font-medium">Média VR (6 meses)</span>
            <FileText size={16} />
          </div>
          <div className="text-h2" style={{ color: '#16a34a' }}>R$ 280.00</div>
          <div className="text-xs text-muted" style={{ color: '#22c55e' }}>Por mês</div>
        </div>
        <div className="card" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', marginBottom: '0.5rem' }}>
            <span className="text-sm font-medium">Média VT (6 meses)</span>
            <TrendingUp size={16} />
          </div>
          <div className="text-h2" style={{ color: '#2563eb' }}>R$ 0.00</div>
          <div className="text-xs text-muted" style={{ color: '#3b82f6' }}>Por mês</div>
        </div>
        <div className="card" style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9333ea', marginBottom: '0.5rem' }}>
            <span className="text-sm font-medium">Média Total (6 meses)</span>
            <Calendar size={16} />
          </div>
          <div className="text-h2" style={{ color: '#9333ea' }}>R$ 280.00</div>
          <div className="text-xs text-muted" style={{ color: '#a855f7' }}>VR + VT por mês</div>
        </div>
      </div>

      {/* Observations */}
      <div className="card" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.5rem' }}>
        <h4 className="font-semibold mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af' }}>
          <Info size={16} /> Observações
        </h4>
        <ul className="text-sm" style={{ color: '#1e40af', paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li>Valores calculados com base em 22 dias úteis para Março de 2026.</li>
          <li>Dias úteis = dias da semana excluindo sábados e domingos.</li>
          <li>Apenas colaboradores CLT ativos com VR/VT cadastrados são exibidos.</li>
          <li>Para alterar valores diários, edite o cadastro do colaborador.</li>
          <li>Os gráficos mostram a evolução dos últimos 6 meses incluindo o mês atual.</li>
        </ul>
      </div>
    </div>
  );
}
