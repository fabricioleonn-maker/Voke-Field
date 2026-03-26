import React, { useState } from 'react';
import { Activity, Search, ArrowRight, Download } from 'lucide-react';

export default function StatusMovements() {
  const [search, setSearch] = useState('');
  
  const movements = [
    { id: 1, date: '20/03/2026', time: '14:30', name: 'João Silva', role: 'Técnico', type: 'Status', from: 'Em Análise', to: 'Ativo', user: 'Admin' },
    { id: 2, date: '19/03/2026', time: '09:15', name: 'Maria Oliveira', role: 'Analista', type: 'Cargo', from: 'Assistente', to: 'Analista', user: 'RH' },
    { id: 3, date: '15/03/2026', time: '16:45', name: 'Carlos Costa', role: 'Técnico', type: 'Status', from: 'Ativo', to: 'Inativo', user: 'Admin' },
  ];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div>
          <h1 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={24} /> Movimentações de Status
          </h1>
          <p className="text-muted">Histórico de alterações cadastrais e de status</p>
        </div>
        <button className="btn btn-neutral"><Download size={18}/> Exportar Relatório</button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar colaborador..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
          <select className="form-control" style={{ width: '200px' }}>
            <option>Todos os tipos</option>
            <option>Status</option>
            <option>Cargo</option>
            <option>Salário</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Colaborador</th>
                <th>Tipo de Alteração</th>
                <th>De</th>
                <th>Para</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.date}</div>
                    <div className="text-xs text-muted">{item.time}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div className="text-xs text-muted">{item.role}</div>
                  </td>
                  <td><span className="badge badge-neutral">{item.type}</span></td>
                  <td className="text-muted text-sm">{item.from}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 500 }}>
                      <ArrowRight size={14} /> {item.to}
                    </div>
                  </td>
                  <td className="text-sm">{item.user}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
