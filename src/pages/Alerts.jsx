import React, { useState } from 'react';
import { Bell, Search, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function Alerts() {
  const [search, setSearch] = useState('');
  
  const alerts = [
    { id: 1, type: 'critical', title: 'CNH Vencida', desc: 'A CNH do colaborador João Silva venceu há 5 dias.', date: '20/03/2026', status: 'Pendente' },
    { id: 2, type: 'warning', title: 'Férias Próximas', desc: 'As férias de Maria Oliveira vencem em 45 dias.', date: '19/03/2026', status: 'Pendente' },
    { id: 3, type: 'info', title: 'Novo Cadastro', desc: 'Novo colaborador pendente de aprovação de documentos.', date: '18/03/2026', status: 'Resolvido' },
  ];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div>
          <h1 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={24} /> Alertas e Notificações
          </h1>
          <p className="text-muted">Gestão de pendências e avisos do sistema</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar alertas..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
          <select className="form-control" style={{ width: '200px' }}>
            <option>Todos os tipos</option>
            <option>Críticos</option>
            <option>Avisos</option>
            <option>Informativos</option>
          </select>
          <select className="form-control" style={{ width: '200px' }}>
            <option>Pendentes</option>
            <option>Resolvidos</option>
            <option>Todos</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Alerta</th>
                <th>Data</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.type === 'critical' ? <AlertCircle size={20} color="#ef4444" /> : 
                     item.type === 'warning' ? <AlertTriangle size={20} color="#f59e0b" /> : 
                     <Info size={20} color="#3b82f6" />}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                    <div className="text-sm text-muted">{item.desc}</div>
                  </td>
                  <td className="text-muted">{item.date}</td>
                  <td>
                    <span className={`badge ${item.status === 'Resolvido' ? 'badge-success' : 'badge-warning'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-neutral text-sm" style={{ padding: '0.25rem 0.75rem' }}>
                      {item.status === 'Resolvido' ? 'Ver' : 'Resolver'}
                    </button>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>
                    Nenhum alerta encontrado.
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
