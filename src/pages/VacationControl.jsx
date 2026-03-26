import React, { useState } from 'react';
import { 
  Calendar, ArrowLeft, Users, AlertTriangle, Clock, CheckCircle, FileText
} from 'lucide-react';

export default function VacationControl() {
  const [data, setData] = useState([]);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4c1d95' }}>
            <Calendar size={24} /> Dashboard de Férias
          </h1>
          <p className="text-muted">Acompanhamento e controle de férias CLT</p>
        </div>
        <div>
          <button className="btn btn-neutral"><ArrowLeft size={16}/> Voltar</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="text-sm" style={{ color: '#475569' }}>Status de Vencimento</label>
          <select className="form-control" style={{ padding: '0.25rem 2rem 0.25rem 0.5rem', minWidth: '150px' }}>
            <option>Todos</option>
            <option>Vencidas</option>
            <option>Vencendo</option>
            <option>Em Dia</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium" style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Total CLT</div>
            <div className="text-h1">0</div>
          </div>
          <Users size={40} style={{ opacity: 0.8 }} />
        </div>
        <div className="card" style={{ backgroundColor: '#ef4444', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium" style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Férias Vencidas</div>
            <div className="text-h1">0</div>
          </div>
          <AlertTriangle size={40} style={{ opacity: 0.8 }} />
        </div>
        <div className="card" style={{ backgroundColor: '#f59e0b', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium" style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Vencendo em 60 Dias</div>
            <div className="text-h1">0</div>
          </div>
          <Clock size={40} style={{ opacity: 0.8 }} />
        </div>
        <div className="card" style={{ backgroundColor: '#10b981', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium" style={{ opacity: 0.9, marginBottom: '0.5rem' }}>Em Dia</div>
            <div className="text-h1">0</div>
          </div>
          <CheckCircle size={40} style={{ opacity: 0.8 }} />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>COLABORADOR</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>CARGO</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>ADMISSÃO</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>ÚLTIMAS FÉRIAS</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>VENCIMENTO</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>DIAS RESTANTES</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>STATUS</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan="8">
                  <div style={{ padding: '4rem 0', textAlign: 'center', color: '#94a3b8' }}>
                    <Calendar size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                    <div className="text-lg font-medium" style={{ color: '#64748b', marginBottom: '0.25rem' }}>Nenhum colaborador encontrado</div>
                    <div className="text-sm">Ajuste os filtros para ver os dados</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Box */}
      <div className="card" style={{ borderLeft: '4px solid #3b82f6', backgroundColor: '#f8fafc' }}>
        <h4 className="font-semibold mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e3a8a' }}>
          <FileText size={18} /> Sobre o Controle de Férias CLT
        </h4>
        <div className="text-sm" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#1e40af' }}>
          <div><strong style={{ fontWeight: 600 }}>Período Aquisitivo:</strong> 12 meses trabalhados para adquirir direito a 30 dias de férias</div>
          <div><strong style={{ fontWeight: 600 }}>Período Concessivo:</strong> 12 meses após o aquisitivo para tirar as férias</div>
          <div><strong style={{ fontWeight: 600 }}>Vencimento:</strong> Data limite para concessão das férias (24 meses após admissão ou últimas férias)</div>
          <div><strong style={{ fontWeight: 600 }}>Alerta:</strong> Sistema avisa com 60 dias de antecedência sobre férias vencendo</div>
          <div style={{ color: '#b45309', fontWeight: 500, marginTop: '0.25rem' }}>
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }}/> 
            Atenção: Férias vencidas podem gerar multas e pagamento em dobro conforme CLT
          </div>
        </div>
      </div>
    </div>
  );
}
