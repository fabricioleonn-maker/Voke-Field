import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Settings, DollarSign } from 'lucide-react';
import { api } from '../store/db';
import { useToast } from '../components/Toast';

export default function Services() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nome: '', basePrice: 0 });

  const loadData = async () => {
    setLoading(true);
    setServices(await api.services.list());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (service = null) => {
    if (service) {
      setEditingId(service.id);
      setFormData({ nome: service.nome, basePrice: service.basePrice });
    } else {
      setEditingId(null);
      setFormData({ nome: '', basePrice: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.services.update(editingId, { ...formData, basePrice: Number(formData.basePrice) });
      toast.success('Serviço atualizado!');
    } else {
      await api.services.create({ ...formData, basePrice: Number(formData.basePrice) });
      toast.success('Serviço criado!');
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (await toast.confirm('Deseja realmente excluir este serviço?', 'Excluir Serviço', 'danger')) {
      await api.services.delete(id);
      loadData();
      toast.success('Serviço excluído.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Catálogo de Serviços</h1>
          <p className="text-muted">Defina os tipos de serviço e seus valores base de pagamento.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Novo Serviço
        </button>
      </div>

      <div className="card">
        {loading ? <p>Carregando...</p> : services.length === 0 ? <p>Nenhum serviço cadastrado.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Nome do Serviço</th>
                <th style={{ padding: '1rem' }}>Valor Base (Pagamento)</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{s.nome}</td>
                  <td style={{ padding: '1rem' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.basePrice)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => openModal(s)} style={{ padding: '0.4rem' }}><Edit2 size={16}/></button>
                      <button className="btn btn-danger" onClick={() => handleDelete(s.id)} style={{ padding: '0.4rem' }}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="text-h3">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Nome do Serviço</label>
                <input type="text" className="input-field" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Chamado Avulso"/>
              </div>
              <div className="input-group">
                <label className="input-label">Valor Base (R$)</label>
                <input type="number" step="0.01" className="input-field" required value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})}/>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
