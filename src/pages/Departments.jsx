import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Layers } from 'lucide-react';
import { api } from '../store/db';
import { useToast } from '../components/Toast';

export default function Departments() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nome: '', tipo: 'operacional', status: 'Ativo' });

  const load = async () => { setLoading(true); setItems(await api.departments.list()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openModal = (item = null) => {
    if (item) { setEditingId(item.id); setFormData({ nome: item.nome||'', tipo: item.tipo||'operacional', status: item.status||'Ativo' }); }
    else { setEditingId(null); setFormData({ nome: '', tipo: 'operacional', status: 'Ativo' }); }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.departments.update(editingId, formData);
      else await api.departments.create(formData);
      toast.success('Setor salvo com sucesso!');
      setIsModalOpen(false); load();
    } catch (err) {
      toast.error('Erro ao salvar setor.');
    }
  };

  const handleDelete = async (id, nome) => {
    if (await toast.confirm(`Tem certeza que deseja remover o setor "${nome}"?`, 'Excluir Setor', 'danger')) {
      try {
        await api.departments.delete(id);
        toast.success('Setor removido!');
        load();
      } catch (err) {
        toast.error('Erro ao remover setor.');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="text-h2">Gestão de Setores</h1><p className="text-muted">Cadastro e organização dos setores da empresa.</p></div>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={18}/> Novo Setor</button>
      </div>
      <div className="card">
        {loading ? <p className="text-muted" style={{padding:'2rem',textAlign:'center'}}>Carregando...</p>
        : items.length === 0 ? (
          <div className="page-placeholder"><Layers size={48}/><h2>Nenhum setor cadastrado</h2><p>Crie setores para organizar cargos e colaboradores.</p></div>
        ) : (
          <div style={{overflowX:'auto'}}>
          <table className="data-table"><thead><tr><th>Nome</th><th>Tipo</th><th>Status</th><th style={{textAlign:'right'}}>Ações</th></tr></thead>
            <tbody>{items.map(d=>(
              <tr key={d.id}><td style={{fontWeight:500}}>{d.nome}</td><td><span className="badge badge-info">{d.tipo}</span></td>
                <td><span className={`badge ${d.status==='Ativo'?'badge-success':'badge-neutral'}`}>{d.status}</span></td>
                <td className="actions"><button onClick={()=>openModal(d)} style={{color:'var(--secondary)'}}><Edit2 size={18}/></button><button onClick={()=>handleDelete(d.id, d.nome)} style={{color:'var(--danger)'}}><Trash2 size={18}/></button></td>
              </tr>
            ))}</tbody>
          </table>
          </div>
        )}
      </div>
      {isModalOpen && (
        <div className="modal-overlay"><div className="card modal-card" style={{maxWidth:'420px'}}>
          <button className="modal-close" onClick={()=>setIsModalOpen(false)}><X size={20}/></button>
          <h2 className="text-h3" style={{marginBottom:'1.5rem'}}>{editingId?'Editar Setor':'Novo Setor'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group"><label className="input-label">Nome do Setor *</label><input className="input-field" required value={formData.nome} onChange={e=>setFormData({...formData,nome:e.target.value})}/></div>
            <div className="input-group"><label className="input-label">Tipo</label><select className="input-field" value={formData.tipo} onChange={e=>setFormData({...formData,tipo:e.target.value})}><option value="operacional">Operacional</option><option value="administrativo">Administrativo</option></select></div>
            <div className="input-group"><label className="input-label">Status</label><select className="input-field" value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})}><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'1rem',marginTop:'1.5rem'}}>
              <button type="button" className="btn btn-secondary" onClick={()=>setIsModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editingId?'Salvar':'Criar Setor'}</button>
            </div>
          </form>
        </div></div>
      )}
    </div>
  );
}
