import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Award, Clock } from 'lucide-react';
import { api } from '../store/db';
import { useToast } from '../components/Toast';

const emptyForm = { 
  nome: '', setorId: '', salarioBase: '', 
  requerCNH: false, temPericulosidade: false, status: 'Ativo',
  workingDays: [1, 2, 3, 4, 5], 
  shiftStart: '08:00', shiftEnd: '18:00',
  saturdayMode: 'custom', saturdayStart: '08:00', saturdayEnd: '12:00'
};

const weekDays = [
  { id: 1, label: 'Seg' }, { id: 2, label: 'Ter' }, { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' }, { id: 5, label: 'Sex' }, { id: 6, label: 'Sáb' }, { id: 0, label: 'Dom' }
];

export default function Positions() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const load = async () => { setLoading(true); setItems(await api.positions.list()); setDepartments(await api.departments.list()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const getSetorNome = (id) => departments.find(d=>d.id===id)?.nome || '-';

  const openModal = (item = null) => {
    if (item) { 
      setEditingId(item.id); 
      setFormData({ 
        nome: item.nome||'', setorId: item.setorId||'', salarioBase: item.salarioBase||'', 
        requerCNH: item.requerCNH||false, temPericulosidade: item.temPericulosidade||false, status: item.status||'Ativo',
        workingDays: Array.isArray(item.workingDays) ? item.workingDays : [1, 2, 3, 4, 5],
        shiftStart: item.shiftStart || '08:00',
        shiftEnd: item.shiftEnd || '18:00',
        saturdayMode: item.saturdayMode || 'custom',
        saturdayStart: item.saturdayStart || '08:00',
        saturdayEnd: item.saturdayEnd || '12:00'
      }); 
    }
    else { setEditingId(null); setFormData(emptyForm); }
    setIsModalOpen(true);
  };

  const handleDayToggle = (dayId) => {
    setFormData(prev => {
      const currentDays = Array.isArray(prev.workingDays) ? prev.workingDays : [1, 2, 3, 4, 5];
      return {
        ...prev,
        workingDays: currentDays.includes(dayId) 
          ? currentDays.filter(d => d !== dayId)
          : [...currentDays, dayId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.positions.update(editingId, formData);
      else await api.positions.create(formData);
      toast.success('Cargo salvo com sucesso!');
      setIsModalOpen(false); load();
    } catch (err) {
      toast.error('Erro ao salvar cargo.');
    }
  };

  const handleDelete = async (id, nome) => {
    if (await toast.confirm(`Deseja realmente excluir o cargo "${nome}"?`, 'Excluir Cargo', 'danger')) {
      try {
        await api.positions.delete(id);
        toast.success('Cargo removido!');
        load();
      } catch (err) {
        toast.error('Erro ao remover cargo.');
      }
    }
  };

  return (
    <div>
      <div className="page-header"><div><h1 className="text-h2">Gestão de Cargos</h1><p className="text-muted">Cadastro de cargos vinculados aos setores.</p></div>
        <button className="btn btn-primary" onClick={()=>openModal()}><Plus size={18}/> Novo Cargo</button>
      </div>
      <div className="card">
        {loading ? <p className="text-muted" style={{padding:'2rem',textAlign:'center'}}>Carregando...</p>
        : items.length === 0 ? (
          <div className="page-placeholder"><Award size={48}/><h2>Nenhum cargo cadastrado</h2><p>Crie cargos para atribuir aos colaboradores.</p></div>
        ) : (
          <div style={{overflowX:'auto'}}>
          <table className="data-table"><thead><tr><th>Cargo</th><th>Setor</th><th>Jornada Padrão</th><th>Status</th><th style={{textAlign:'right'}}>Ações</th></tr></thead>
            <tbody>{items.map(c=>(
              <tr key={c.id}><td style={{fontWeight:500}}>{c.nome}</td><td>{getSetorNome(c.setorId)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <Clock size={14} className="text-muted" />
                    <span>{c.shiftStart || '08:00'} - {c.shiftEnd || '18:00'}</span>
                    <span className="text-muted">({(c.workingDays || []).length} dias/sem)</span>
                  </div>
                </td>
                <td><span className={`badge ${c.status==='Ativo'?'badge-success':'badge-neutral'}`}>{c.status}</span></td>
                <td className="actions"><button onClick={()=>openModal(c)} style={{color:'var(--secondary)'}}><Edit2 size={18}/></button><button onClick={()=>handleDelete(c.id, c.nome)} style={{color:'var(--danger)'}}><Trash2 size={18}/></button></td>
              </tr>
            ))}</tbody>
          </table>
          </div>
        )}
      </div>
      {isModalOpen && (
        <div className="modal-overlay"><div className="card modal-card" style={{maxWidth:'600px'}}>
          <button className="modal-close" onClick={()=>setIsModalOpen(false)}><X size={20}/></button>
          <h2 className="text-h3" style={{marginBottom:'1.5rem'}}>{editingId?'Editar Cargo':'Novo Cargo'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group"><label className="input-label">Nome do Cargo *</label><input className="input-field" required value={formData.nome} onChange={e=>setFormData({...formData,nome:e.target.value})}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div className="input-group"><label className="input-label">Setor *</label><select className="input-field" required value={formData.setorId} onChange={e=>setFormData({...formData,setorId:e.target.value})}>
                <option value="">Selecione</option>{departments.filter(d=>d.status==='Ativo').map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}
              </select></div>
              <div className="input-group"><label className="input-label">Salário Base (R$)</label><input type="number" step="0.01" className="input-field" value={formData.salarioBase} onChange={e=>setFormData({...formData,salarioBase:e.target.value})}/></div>
            </div>
            
            <div className="form-section-title" style={{ marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontWeight: 600 }}>Jornada de Trabalho Padrão</div>
            
            <div className="input-group">
              <label className="input-label">Dias de Expediente</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {weekDays.map(day => {
                  const isActive = Array.isArray(formData.workingDays) && formData.workingDays.includes(day.id);
                  return (
                  <div key={day.id} onClick={() => handleDayToggle(day.id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.4rem 0.8rem', border: '1px solid',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: isActive ? 'rgba(15, 23, 42, 0.1)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'inherit',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                    userSelect: 'none', transition: 'all 0.2s', position: 'relative', zIndex: 5
                  }}>
                    {day.label}
                  </div>
                  );
                })}
              </div>
            </div>

            {Array.isArray(formData.workingDays) && formData.workingDays.includes(6) && (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
                <div className="input-group">
                  <label className="input-label" style={{ color: 'var(--primary)' }}>Regra Especial para Sábados</label>
                  <select className="input-field" value={formData.saturdayMode || 'custom'} onChange={e => setFormData({...formData, saturdayMode: e.target.value})}>
                    <option value="custom">Personalizar Horário (Entrada/Saída Específica para Sábados)</option>
                    <option value="half">Meio Período Padrão (08:00 às 12:00)</option>
                    <option value="alternate">Sábados Alternados (1 sim, 1 não - Horário Normal)</option>
                  </select>
                </div>

                {formData.saturdayMode === 'custom' && (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem', marginTop: '1rem'}}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>Entrada Sábado</label>
                      <input type="time" className="input-field" value={formData.saturdayStart || '08:00'} onChange={e=>setFormData({...formData,saturdayStart:e.target.value})}/>
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>Saída Sábado</label>
                      <input type="time" className="input-field" value={formData.saturdayEnd || '12:00'} onChange={e=>setFormData({...formData,saturdayEnd:e.target.value})}/>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div className="input-group"><label className="input-label">Entrada</label><input type="time" className="input-field" required value={formData.shiftStart} onChange={e=>setFormData({...formData,shiftStart:e.target.value})}/></div>
              <div className="input-group"><label className="input-label">Saída</label><input type="time" className="input-field" required value={formData.shiftEnd} onChange={e=>setFormData({...formData,shiftEnd:e.target.value})}/></div>
            </div>

            <div style={{display:'flex',gap:'2rem',marginBottom:'1rem', marginTop: '1rem'}}>
              <label style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.875rem',cursor:'pointer'}}><input type="checkbox" checked={formData.requerCNH} onChange={e=>setFormData({...formData,requerCNH:e.target.checked})}/> Requer CNH</label>
              <label style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.875rem',cursor:'pointer'}}><input type="checkbox" checked={formData.temPericulosidade} onChange={e=>setFormData({...formData,temPericulosidade:e.target.checked})}/> Periculosidade (30%)</label>
            </div>
            <div className="input-group"><label className="input-label">Status</label><select className="input-field" value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})}><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'1rem',marginTop:'1.5rem'}}>
              <button type="button" className="btn btn-secondary" onClick={()=>setIsModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editingId?'Salvar':'Criar Cargo'}</button>
            </div>
          </form>
        </div></div>
      )}
    </div>
  );
}
