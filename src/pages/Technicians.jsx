import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { api } from '../store/db';
import { useToast } from '../components/Toast';

export default function Technicians() {
  const toast = useToast();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    cpf_cnpj: '',
    email: '',
    phone: '',
    role: '',
    status: 'Ativo'
  });

  const loadTechnicians = async () => {
    setLoading(true);
    const data = await api.technicians.list();
    setTechnicians(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTechnicians();
  }, []);

  const openModal = (tech = null) => {
    if (tech) {
      setEditingId(tech.id);
      setFormData({
        name: tech.name || '',
        cpf_cnpj: tech.cpf_cnpj || '',
        email: tech.email || '',
        phone: tech.phone || '',
        role: tech.role || '',
        status: tech.status || 'Ativo'
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', cpf_cnpj: '', email: '', phone: '', role: '', status: 'Ativo' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.technicians.update(editingId, formData);
    } else {
      await api.technicians.create(formData);
    }
    closeModal();
    loadTechnicians();
  };

  const handleDelete = async (id) => {
    if (await toast.confirm('Tem certeza que deseja excluir este técnico?', 'Excluir Técnico', 'danger')) {
      await api.technicians.delete(id);
      loadTechnicians();
    }
  };

  const filteredTechs = technicians.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.cpf_cnpj || '').includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Cadastro de Técnicos</h1>
          <p className="text-muted">Gerencie os prestadores de serviço e profissionais parceiros.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Adicionar Técnico
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <div className="input-group" style={{ margin: 0, flex: 1, maxWidth: '400px', flexDirection: 'row', alignItems: 'center', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.25rem 0.75rem' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF/CNPJ..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '0.5rem', outline: 'none' }}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Carregando técnicos...</p>
        ) : filteredTechs.length === 0 ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Nenhum técnico encontrado.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nome Completo</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>CPF / CNPJ</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Função</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contato</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTechs.map((tech) => (
                  <tr key={tech.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{tech.name}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{tech.cpf_cnpj || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{tech.role || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '0.875rem' }}>{tech.phone || '-'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{tech.email || ''}</div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className={`badge ${tech.status === 'Ativo' ? 'badge-success' : 'badge-neutral'}`}>
                        {tech.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => openModal(tech)} style={{ color: 'var(--primary)', padding: '0.25rem' }} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(tech.id)} style={{ color: 'var(--danger)', padding: '0.25rem' }} title="Excluir">
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
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 className="text-h3" style={{ marginBottom: '1.5rem' }}>
              {editingId ? 'Editar Técnico' : 'Adicionar Técnico'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Nome Completo *</label>
                  <input type="text" className="input-field" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="input-group">
                  <label className="input-label">CPF / CNPJ</label>
                  <input type="text" className="input-field" value={formData.cpf_cnpj} onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})} />
                </div>

                <div className="input-group">
                  <label className="input-label">Função / Cargo</label>
                  <input type="text" className="input-field" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} placeholder="Ex: Analista de Suporte" />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Telefone / WhatsApp</label>
                  <input type="text" className="input-field" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>

                <div className="input-group">
                  <label className="input-label">E-mail</label>
                  <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Status</label>
                  <select className="input-field" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Adicionar Técnico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
