import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { Plus, Trash2, Tag, Filter, CheckCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { getBrasiliaTodayStr } from '../../utils/time';

export default function Adjustments() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    collaborator_id: '',
    type: 'Desconto', // Desconto ou Adicional
    category: 'VT',
    value: 0,
    description: '',
    date: getBrasiliaTodayStr(),
    status: 'Pendente'
  });

  const load = async () => {
    setLoading(true);
    // Nota: 'adjustments' é uma nova coleção que precisamos garantir no db.js
    const [adj, colabs] = await Promise.all([
      api.adjustments?.list() || Promise.resolve([]),
      api.collaborators.list()
    ]);
    setItems(adj);
    setCollaborators(colabs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.adjustments.create({ ...formData, value: Number(formData.value) });
    setIsModalOpen(false);
    load();
  };

  const getColabName = (id) => collaborators.find(c => c.id === id)?.nome || 'Desconhecido';
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Descontos e Adicionais</h1>
          <p className="text-muted">Lançamentos avulsos que impactam o fechamento do prestador.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Lançamento
        </button>
      </div>

      <div className="card">
        {loading ? <p className="text-muted">Carregando...</p> : items.length === 0 ? (
          <div className="page-placeholder">
            <Tag size={48} />
            <h2>Nenhum desconto ou adicional</h2>
            <p>Lançamentos como VR, VT ou ferramentas aparecerão aqui.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Colaborador</th>
                  <th>Tipo</th>
                   <th>Categoria</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                    <td style={{ fontWeight: 500 }}>{getColabName(item.collaborator_id)}</td>
                    <td>
                      <span className={`badge ${item.type === 'Desconto' ? 'badge-danger' : 'badge-success'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 600, color: item.type === 'Desconto' ? 'var(--danger)' : 'var(--success-text)' }}>
                      {item.type === 'Desconto' ? '-' : '+'}{formatCurrency(item.value)}
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'Compensado' ? 'badge-success' : 'badge-warning'}`}>
                        {item.status || 'Pendente'}
                      </span>
                    </td>
                    <td className="actions">
                      {item.status !== 'Compensado' ? (
                        <button style={{ color: 'var(--danger)' }} onClick={async () => { 
                          if (await toast.confirm('Deseja excluir este lançamento?', 'Excluir Lançamento', 'danger')) { 
                            await api.adjustments.delete(item.id); 
                            load(); 
                          } 
                        }}>
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <span className="text-muted" title="Lançamento já processado no fechamento"><CheckCircle size={16}/></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ maxWidth: '500px' }}>
            <h2 className="text-h3" style={{ marginBottom: '1.5rem' }}>Novo Lançamento</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Colaborador *</label>
                <select className="input-field" required value={formData.collaborator_id} onChange={e => setFormData({...formData, collaborator_id: e.target.value})}>
                  <option value="">Selecione</option>
                  {collaborators.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Tipo</label>
                  <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Desconto">Desconto</option>
                    <option value="Adicional">Adicional</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Valor *</label>
                  <input type="number" step="0.01" className="input-field" required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Categoria</label>
                <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="VT">Vale Transporte</option>
                  <option value="VR">Vale Refeição</option>
                  <option value="Ferramentas">Ferramentas</option>
                  <option value="Adiantamento">Adiantamento</option>
                  <option value="Bonus">Bônus / Premiação</option>
                  <option value="Km">Km Adicional</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Observação / Descrição</label>
                <textarea className="input-field" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Lançar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
