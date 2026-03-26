import React, { useState } from 'react';
import { 
  FileText, Download, Activity, User, Filter, Eye, CheckCircle 
} from 'lucide-react';

export default function AuditLogs() {
  const [data, setData] = useState([
    { id: 1, time: '20/03/2026, 13:08:36', name: 'Administrador', email: 'admin@voke.com.br', action: 'visualizar', module: 'sistema', entity: '-', company: '', status: 'Sucesso' },
    { id: 2, time: '20/03/2026, 13:08:18', name: 'Administrador', email: 'admin@voke.com.br', action: 'visualizar', module: 'sistema', entity: '-', company: '', status: 'Sucesso' },
    { id: 3, time: '20/03/2026, 13:07:13', name: 'Administrador', email: 'admin@voke.com.br', action: 'visualizar', module: 'sistema', entity: '-', company: '', status: 'Sucesso' },
    { id: 4, time: '20/03/2026, 12:29:58', name: 'Administrador', email: 'admin@voke.com.br', action: 'visualizar', module: 'sistema', entity: '-', company: '', status: 'Sucesso' },
    { id: 5, time: '20/03/2026, 12:29:50', name: 'Administrador', email: 'admin@voke.com.br', action: 'visualizar', module: 'sistema', entity: '-', company: '', status: 'Sucesso' },
    { id: 6, time: '20/03/2026, 12:29:29', name: 'Administrador', email: 'admin@voke.com.br', action: 'visualizar', module: 'sistema', entity: '-', company: '', status: 'Sucesso' },
    { id: 7, time: '20/03/2026, 12:29:08', name: 'Administrador', email: 'admin@voke.com.br', action: 'visualizar', module: 'sistema', entity: '-', company: '', status: 'Sucesso' },
  ]);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e3a8a' }}>
            <FileText size={24} /> Logs de Auditoria
          </h1>
          <p className="text-muted">Histórico completo de todas as ações realizadas no sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" style={{ backgroundColor: '#ef4444', color: 'white' }}><FileText size={16}/> Exportar PDF</button>
          <button className="btn" style={{ backgroundColor: '#10b981', color: 'white' }}><Download size={16}/> Exportar Excel</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium text-muted" style={{ marginBottom: '0.5rem' }}>Total de Logs</div>
            <div className="text-h1">347</div>
          </div>
          <Activity size={32} style={{ color: '#3b82f6' }} />
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium text-muted" style={{ marginBottom: '0.5rem' }}>Módulos Ativos</div>
            <div className="text-h1">1</div>
          </div>
          <FileText size={32} style={{ color: '#a855f7' }} />
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-sm font-medium text-muted" style={{ marginBottom: '0.5rem' }}>Usuários Ativos</div>
            <div className="text-h1">1</div>
          </div>
          <User size={32} style={{ color: '#10b981' }} />
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 className="font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Filter size={18} /> Filtros
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label text-sm font-medium">Módulo</label>
            <select className="form-control">
              <option>Todos os módulos</option>
            </select>
          </div>
          <div>
            <label className="form-label text-sm font-medium">Ação</label>
            <select className="form-control">
              <option>Todas as ações</option>
            </select>
          </div>
          <div>
            <label className="form-label text-sm font-medium">Empresa</label>
            <select className="form-control">
              <option>Todas as empresas</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label text-sm font-medium">Usuário (email)</label>
            <input type="text" className="form-control" placeholder="Filtrar por email" />
          </div>
          <div>
            <label className="form-label text-sm font-medium">Data Início</label>
            <input type="date" className="form-control" />
          </div>
          <div>
            <label className="form-label text-sm font-medium">Data Fim</label>
            <input type="date" className="form-control" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-neutral text-muted" style={{ fontSize: '0.85rem' }}>Limpar filtros</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>DATA/HORA</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>USUÁRIO</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>AÇÃO</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>MÓDULO</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>ENTIDADE</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>EMPRESA</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>STATUS</th>
              <th className="text-xs text-muted" style={{ fontWeight: 600 }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {data.map(log => (
              <tr key={log.id}>
                <td className="text-sm font-medium text-muted">{log.time}</td>
                <td>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{log.name}</div>
                  <div className="text-xs text-muted">{log.email}</div>
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#64748b' }}>
                    <Eye size={14} /> {log.action}
                  </span>
                </td>
                <td className="text-muted">{log.module}</td>
                <td className="text-muted">{log.entity}</td>
                <td className="text-muted">{log.company}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 500 }}>
                    <CheckCircle size={14} /> {log.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-neutral text-sm" style={{ color: '#3b82f6', padding: '0.25rem 0.5rem' }}>Ver detalhes</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
