import React, { useState } from 'react';
import { 
  ArrowLeft, Download, Plus, DollarSign, Calendar, 
  Users, CheckCircle, Clock, FileText, Search
} from 'lucide-react';

export default function Payroll() {
  const [data, setData] = useState([]);
  const [activeMonth, setActiveMonth] = useState('Mar');
  const [activeYear, setActiveYear] = useState('2026');

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
            <DollarSign size={24} style={{ color: '#10b981' }} /> Folha de Pagamento
          </h1>
          <p className="text-muted">Gerenciamento mensal de pagamentos</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-neutral"><ArrowLeft size={16}/> Voltar</button>
          <button className="btn" style={{ backgroundColor: '#8b5cf6', color: 'white' }}><DollarSign size={16}/> Gerar Folhas Automáticas</button>
          <button className="btn" style={{ backgroundColor: '#ef4444', color: 'white' }}><FileText size={16}/> Exportar PDF</button>
          <button className="btn" style={{ backgroundColor: '#10b981', color: 'white' }}><Download size={16}/> Exportar Excel</button>
          <button className="btn" style={{ backgroundColor: '#10b981', color: 'white' }}><Plus size={16}/> Nova Folha</button>
        </div>
      </div>

      {/* Filters (Standardized with Folha de Ponto) */}
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
                    backgroundColor: activeMonth === m ? '#1e293b' : 'white',
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
              <select className="form-control" value={activeYear} onChange={e => setActiveYear(e.target.value)} style={{ width: '100px', display: 'inline-block', padding: '0.25rem' }}>
                <option>2026</option>
                <option>2025</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start' }}>
            <div>
              <label className="text-sm font-medium" style={{ display: 'block', marginBottom: '0.5rem', color: '#3b82f6' }}>Status</label>
              <select className="form-control" style={{ minWidth: '150px', padding: '0.5rem' }}>
                <option>Todos</option>
                <option>Aprovadas</option>
                <option>Rascunho</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', color: '#3b82f6' }}>
                <Search size={14} /> Colaborador
              </label>
              <select className="form-control" style={{ minWidth: '220px', padding: '0.5rem' }}>
                <option>Todos os colaboradores</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ backgroundColor: '#10b981', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium" style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Total de Folhas</div>
            <div className="text-h1">0</div>
          </div>
          <Users size={40} style={{ opacity: 0.8 }} />
        </div>
        <div className="card" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium" style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Total a Pagar</div>
            <div className="text-h1">R$ 0,00</div>
          </div>
          <DollarSign size={40} style={{ opacity: 0.8 }} />
        </div>
        <div className="card" style={{ backgroundColor: '#a855f7', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium" style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Aprovadas</div>
            <div className="text-h1">0</div>
          </div>
          <CheckCircle size={40} style={{ opacity: 0.8 }} />
        </div>
        <div className="card" style={{ backgroundColor: '#f97316', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium" style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Rascunho</div>
            <div className="text-h1">0</div>
          </div>
          <Clock size={40} style={{ opacity: 0.8 }} />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>COLABORADOR</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>CARGO</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>SALÁRIO BRUTO</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>DESCONTOS</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>LÍQUIDO</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>STATUS</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan="7">
                  <div style={{ padding: '4rem 0', textAlign: 'center', color: '#94a3b8' }}>
                    <DollarSign size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                    <div className="text-lg font-medium" style={{ color: '#64748b', marginBottom: '0.25rem' }}>Nenhuma folha encontrada</div>
                    <div className="text-sm">Adicione folhas de pagamento para o mês selecionado</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
