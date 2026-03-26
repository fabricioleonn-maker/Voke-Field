import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, FileText } from 'lucide-react';
import { api } from '../store/db';
import { useToast } from '../components/Toast';
import { getBrasiliaTodayStr, getBrasiliaDate } from '../utils/time';

export default function ServiceOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    date: getBrasiliaTodayStr(),
    project_id: '',
    technician_id: '',
    type: 'Chamado',
    client: '',
    location: '',
    description: '',
    base_value: 0,
    additional_value: 0,
    status: 'Agendado'
  });

  const loadData = async () => {
    setLoading(true);
    const [osData, projData, techData] = await Promise.all([
      api.os.list(),
      api.projects.list(),
      api.technicians.list()
    ]);
    
    // Sort by date descending
    setOrders(osData.sort((a,b) => new Date(b.date) - new Date(a.date)));
    setProjects(projData.filter(p => p.status === 'Ativo'));
    setTechnicians(techData.filter(t => t.status === 'Ativo'));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (os = null) => {
    if (os) {
      setEditingId(os.id);
      setFormData({
        date: os.date || getBrasiliaTodayStr(),
        project_id: os.project_id || '',
        technician_id: os.technician_id || '',
        type: os.type || 'Chamado',
        client: os.client || '',
        location: os.location || '',
        description: os.description || '',
        base_value: os.base_value || 0,
        additional_value: os.additional_value || 0,
        status: os.status || 'Agendado'
      });
    } else {
      setEditingId(null);
      setFormData({ 
        date: getBrasiliaTodayStr(),
        project_id: projects.length > 0 ? projects[0].id : '',
        technician_id: technicians.length > 0 ? technicians[0].id : '',
        type: 'Chamado', client: '', location: '', description: '', 
        base_value: 0, additional_value: 0, status: 'Agendado' 
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      base_value: Number(formData.base_value),
      additional_value: Number(formData.additional_value),
      total_value: Number(formData.base_value) + Number(formData.additional_value)
    };

    if (editingId) {
      await api.os.update(editingId, payload);
    } else {
      await api.os.create(payload);
    }
    closeModal();
    loadData();
  };

  const handleDelete = async (id) => {
    if (await toast.confirm('Tem certeza que deseja excluir esta Ordem de Serviço?', 'Excluir OS', 'danger')) {
      await api.os.delete(id);
      loadData();
    }
  };

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Desconhecido';
  const getTechName = (id) => technicians.find(t => t.id === id)?.name || 'Desconhecido';

  const filteredOrders = orders.filter(os => 
    getTechName(os.technician_id).toLowerCase().includes(search.toLowerCase()) || 
    getProjectName(os.project_id).toLowerCase().includes(search.toLowerCase()) ||
    (os.client || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Concluído': return 'badge-success';
      case 'Agendado': return 'badge-warning';
      case 'Em Execução': return 'badge-primary';
      case 'Aguardando NF': return 'badge-danger';
      case 'Pago': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Ordens de Serviço</h1>
          <p className="text-muted">Acompanhamento e lançamento de atividades e serviços prestados.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} disabled={projects.length === 0 || technicians.length === 0}>
          <Plus size={18} />
          Nova OS
        </button>
      </div>

      {(projects.length === 0 || technicians.length === 0) && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--warning)' }}>
          <strong>Ação necessária:</strong> Você precisa cadastrar pelo menos um <strong>Projeto</strong> e um <strong>Técnico</strong> para criar uma OS.
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <div className="input-group" style={{ margin: 0, flex: 1, maxWidth: '400px', flexDirection: 'row', alignItems: 'center', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.25rem 0.75rem' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por técnico, projeto ou cliente..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '0.5rem', outline: 'none' }}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Carregando Ordens de Serviço...</p>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>Nenhuma ordem de serviço registrada.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Data</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Projeto / Cliente</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Técnico</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tipo</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Valor Total</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((os) => (
                  <tr key={os.id} style={{ borderBottom: '1px solid var(--border-color)', '&:hover': { backgroundColor: 'var(--bg-main)' } }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{formatDate(os.date)}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--primary)' }}>{getProjectName(os.project_id)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{os.client || '-'}</div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>{getTechName(os.technician_id)}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{os.type}</td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--success-text)' }}>
                      {formatCurrency(os.total_value)}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className={`badge ${getStatusBadge(os.status)}`}>
                        {os.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => openModal(os)} style={{ color: 'var(--primary)', padding: '0.25rem' }} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(os.id)} style={{ color: 'var(--danger)', padding: '0.25rem' }} title="Excluir">
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
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 className="text-h3" style={{ marginBottom: '1.5rem' }}>
              {editingId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                
                <div className="input-group">
                  <label className="input-label">Data *</label>
                  <input type="date" className="input-field" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>

                <div className="input-group">
                  <label className="input-label">Projeto / C.Custo *</label>
                  <select className="input-field" required value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})}>
                    <option value="" disabled>Selecione...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Técnico *</label>
                  <select className="input-field" required value={formData.technician_id} onChange={(e) => setFormData({...formData, technician_id: e.target.value})}>
                    <option value="" disabled>Selecione...</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Tipo de OS</label>
                  <select className="input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="Chamado">Chamado (Avulso)</option>
                    <option value="Diária">Diária Inteira</option>
                    <option value="Mensal">Equipe Fixa Mensal</option>
                    <option value="Projeto">Hora/Projeto</option>
                  </select>
                </div>

                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Cliente Final / Local</label>
                  <input type="text" className="input-field" placeholder="Para quem o serviço foi prestado" value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} />
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Descrição da Atividade</label>
                  <textarea className="input-field" rows="2" placeholder="Descreva brevemente o serviço realizado" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                </div>

                <div className="input-group">
                  <label className="input-label">Valor Base (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={formData.base_value} onChange={(e) => setFormData({...formData, base_value: e.target.value})} />
                </div>

                <div className="input-group">
                  <label className="input-label">Valor Adicional / Km (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={formData.additional_value} onChange={(e) => setFormData({...formData, additional_value: e.target.value})} />
                </div>

                <div className="input-group">
                  <label className="input-label">Status da OS</label>
                  <select className="input-field" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Agendado">Agendado</option>
                    <option value="Em Execução">Em Execução</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Aguardando NF">Aguardando NF</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>

              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="text-muted">Valor Total Calculado:</span>
                  <span className="text-h3 text-success">{formatCurrency(Number(formData.base_value) + Number(formData.additional_value))}</span>
                </div>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
