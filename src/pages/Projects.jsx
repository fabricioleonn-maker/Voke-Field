import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { api } from '../store/db';
import { getBrasiliaTodayStr } from '../utils/time';
import { useToast } from '../components/Toast';

export default function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    periodType: 'mensal',
    description: '',
    budget: 0,
    startDate: getBrasiliaTodayStr(),
    endDate: '',
    status: 'Ativo',
    latitude: '',
    longitude: '',
    services: [] // Array de { name, price }
  });

  const loadProjects = async () => {
    setLoading(true);
    const [data, clientsData] = await Promise.all([api.projects.list(), api.clients.list()]);
    setProjects(data);
    setClients(clientsData);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openModal = (project = null) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        name: project.name || '',
        clientId: project.clientId || project.client || '',
        periodType: project.periodType || (project.period ? 'mensal' : 'mensal'),
        description: project.description || '',
        budget: project.budget || 0,
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        status: project.status || 'Ativo',
        latitude: project.latitude || '',
        longitude: project.longitude || '',
        services: project.services || []
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        clientId: '',
        periodType: 'mensal',
        description: '',
        budget: 0,
        startDate: getBrasiliaTodayStr(),
        endDate: '',
        status: 'Ativo',
        latitude: '',
        longitude: '',
        services: []
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.projects.update(editingId, formData);
    } else {
      await api.projects.create(formData);
    }
    closeModal();
    loadProjects();
  };

  const handleDelete = async (id) => {
    if (await toast.confirm('Tem certeza que deseja excluir este projeto?', 'Excluir Projeto', 'danger')) {
      await api.projects.delete(id);
      loadProjects();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Centros de Custo / Projetos</h1>
          <p className="text-muted">Gerenciamento de contratos e clientes da operação.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Novo Projeto
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Carregando projetos...</p>
        ) : projects.length === 0 ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Nenhum projeto cadastrado.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nome do Projeto</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Período</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => (
                  <tr key={proj.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{proj.name}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{clients.find(c=>c.id===proj.clientId)?.nome || proj.client || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                      {proj.periodType === 'mensal' || (!proj.periodType && proj.period)
                        ? 'Mensal'
                        : (proj.startDate && proj.endDate 
                            ? `${new Date(proj.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(proj.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}` 
                            : '-')
                      }
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className={`badge ${proj.status === 'Ativo' ? 'badge-success' : 'badge-neutral'}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => openModal(proj)}
                          style={{ color: 'var(--primary)', padding: '0.25rem' }} 
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(proj.id)}
                          style={{ color: 'var(--danger)', padding: '0.25rem' }} 
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 className="text-h3" style={{ marginBottom: '1.5rem' }}>
              {editingId ? 'Editar Projeto' : 'Novo Projeto'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Nome do Projeto / C.Custo *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Equipe Fixa Sustentação"
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Cliente *</label>
                <select 
                  className="input-field" 
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                >
                  <option value="">Selecione o cliente</option>
                  {clients.filter(c => c.status === 'Ativo' && !c.parentId).map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Tipos de Serviço / Preços</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFormData({...formData, services: [...formData.services, { name: '', price: 0 }]})}>
                    + Add Serviço
                  </button>
                </div>
                {formData.services.map((s, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 40px', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Nome (ex: Visita Técnica)" 
                      style={{ marginBottom: 0 }}
                      value={s.name}
                      onChange={e => {
                        const newS = [...formData.services];
                        newS[idx].name = e.target.value;
                        setFormData({...formData, services: newS});
                      }}
                    />
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="Valor" 
                      style={{ marginBottom: 0 }}
                      value={s.price}
                      onChange={e => {
                        const newS = [...formData.services];
                        newS[idx].price = Number(e.target.value);
                        setFormData({...formData, services: newS});
                      }}
                    />
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setFormData({...formData, services: formData.services.filter((_, i) => i !== idx)})}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {formData.services.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>Nenhum serviço configurado para este projeto.</p>}
              </div>
              
              <div className="input-group">
                <label className="input-label">Tipo de Período *</label>
                <select 
                  className="input-field"
                  value={formData.periodType}
                  onChange={(e) => setFormData({...formData, periodType: e.target.value})}
                >
                  <option value="mensal">Mensal</option>
                  <option value="periodo">Por Período</option>
                </select>
              </div>

              {formData.periodType === 'periodo' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Data de Início *</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Data de Fim *</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>
              )}
              
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Latitude (GPS)</label>
                <input type="text" className="input-field" placeholder="Ex: -23.5505" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Longitude (GPS)</label>
                <input type="text" className="input-field" placeholder="Ex: -46.6333" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Status</label>
                <select 
                  className="input-field"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Sair
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
