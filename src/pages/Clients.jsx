import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, UserCheck } from 'lucide-react';
import { api } from '../store/db';
import { useToast } from '../components/Toast';
import SmartField from '../components/SmartField';
import { 
  formatCPF, formatCNPJ, formatPhone, formatCEP, onlyNumbers,
  validateCPF, validateCNPJ, validateEmail, validatePhone,
  fetchCNPJ, fetchCoordinates
} from '../hooks/useSmartForm';

export default function Clients() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('meus'); // 'meus' ou 'finais'
  const [tenantName, setTenantName] = useState(localStorage.getItem('tenantName') || 'SPACE');
  const [formData, setFormData] = useState({
    nome: '', cnpj: '', contato: '', telefone: '', email: '', endereco: '', status: 'Ativo',
    isUmbrella: false, parentId: '', latitude: '', longitude: '', sigla: ''
  });
  const [errors, setErrors] = useState({});
  const [loadingField, setLoadingField] = useState({});

  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));
  const setErr = (key, val) => setErrors(e => ({ ...e, [key]: val }));

  const load = async () => { 
    setLoading(true); 
    setItems(await api.clients.list()); 
    const settings = await api.settings.get();
    setTenantName(settings.tenantName || 'SPACE');
    setLoading(false); 
  };
  useEffect(() => { load(); }, []);

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ 
        nome: item.nome||'', cnpj: item.cnpj||'', contato: item.contato||'', 
        telefone: item.telefone||'', email: item.email||'', endereco: item.endereco||'', 
        status: item.status||'Ativo', isUmbrella: !!item.isUmbrella, parentId: item.parentId||'',
        latitude: item.latitude||'', longitude: item.longitude||'', sigla: item.sigla||''
      });
    } else {
      setEditingId(null);
      setFormData({ 
        nome: '', cnpj: '', contato: '', telefone: '', email: '', endereco: '', 
        status: 'Ativo', 
        isUmbrella: activeTab === 'meus', 
        parentId: '', 
        latitude: '', longitude: '', sigla: ''
      });
    }
    setIsModalOpen(true);
    setErrors({});
  };

  const handleCNPJ = async (val) => {
    const formatted = val.length <= 14 ? formatCPF(val) : formatCNPJ(val);
    set('cnpj', formatted);
    setErr('cnpj', '');

    const raw = val.replace(/\D/g, '');
    if (raw.length === 14) {
      setLoadingField(l => ({ ...l, cnpj: true }));
      const data = await fetchCNPJ(raw);
      setLoadingField(l => ({ ...l, cnpj: false }));
      if (data) {
        const addr = data.logradouro ? `${data.logradouro}, ${data.numero || 'SN'} - ${data.bairro}, ${data.cidade}/${data.estado}` : '';
        setFormData(f => ({ 
          ...f, 
          nome: f.nome || data.razaoSocial,
          email: f.email || data.email,
          telefone: f.telefone || data.telefone,
          endereco: f.endereco || addr
        }));
        
        if (addr && !formData.latitude) {
          setLoadingField(l => ({ ...l, coords: true }));
          const coords = await fetchCoordinates(addr);
          setLoadingField(l => ({ ...l, coords: false }));
          if (coords) {
            setFormData(f => ({ ...f, latitude: coords.lat, longitude: coords.lon }));
            toast.success('Localização geográfica carregada com sucesso!', 'Sucesso');
          }
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    const newErrors = {};
    if (!formData.nome) newErrors.nome = 'Nome é obrigatório.';
    if (!formData.sigla) newErrors.sigla = 'Sigla é obrigatória.';
    if (formData.email && !validateEmail(formData.email)) newErrors.email = 'Email inválido.';
    if (formData.cnpj) {
      const raw = formData.cnpj.replace(/\D/g, '');
      if (raw.length === 11 && !validateCPF(raw)) newErrors.cnpj = 'CPF inválido.';
      else if (raw.length === 14 && !validateCNPJ(raw)) newErrors.cnpj = 'CNPJ inválido.';
      else if (raw.length !== 11 && raw.length !== 14) newErrors.cnpj = 'Documento incompleto.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor, corrija os erros no formulário.');
      return;
    }

    try {
      if (editingId) await api.clients.update(editingId, formData);
      else await api.clients.create(formData);
      toast.success('Cliente salvo com sucesso!');
      setIsModalOpen(false); 
      load();
    } catch (err) {
      toast.error('Erro ao salvar cliente.');
    }
  };

  const handleDelete = async (id) => {
    if (await toast.confirm('Excluir este cliente?')) { await api.clients.delete(id); load(); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Gestão de Clientes</h1>
          <p className="text-muted">Cadastro e gerenciamento dos clientes da operação.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', gap: '2rem' }}>
        <button 
          onClick={() => setActiveTab('meus')}
          style={{ 
            padding: '0.75rem 0.5rem', 
            border: 'none', 
            background: 'none', 
            color: activeTab === 'meus' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'meus' ? '2px solid var(--primary)' : '2px solid transparent',
            fontWeight: activeTab === 'meus' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Meus Clientes
        </button>
        <button 
          onClick={() => setActiveTab('finais')}
          style={{ 
            padding: '0.75rem 0.5rem', 
            border: 'none', 
            background: 'none', 
            color: activeTab === 'finais' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'finais' ? '2px solid var(--primary)' : '2px solid transparent',
            fontWeight: activeTab === 'finais' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Clientes Finais
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</p>
        ) : (items.filter(c => activeTab === 'meus' ? (!c.parentId) : c.parentId)).length === 0 ? (
          <div className="page-placeholder">
            <UserCheck size={48} />
            <h2>{activeTab === 'meus' ? 'Nenhum cliente direto' : 'Nenhum cliente final'}</h2>
            <p>Clique em "Novo Cliente" para começar a cadastrar.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr>
                <th>Nome</th>
                {activeTab === 'meus' ? <th>Tipo</th> : <th>Cliente Direto (Pai)</th>}
                <th>CNPJ/CPF</th><th>Contato</th><th>Status</th><th style={{textAlign:'right'}}>Ações</th>
              </tr></thead>
              <tbody>
                {(items.filter(c => activeTab === 'meus' ? (!c.parentId) : c.parentId)).map(c => (
                  <tr key={c.id}>
                    <td style={{fontWeight:500}}>{c.nome}</td>
                    <td>
                      {activeTab === 'meus' ? (
                        c.isUmbrella ? <span className="badge badge-primary">Guarda-chuva</span> : 'Direto'
                      ) : (
                        <span className="text-muted" style={{fontSize:'0.85rem'}}>{items.find(i=>i.id===c.parentId)?.nome || 'Não vinculado'}</span>
                      )}
                    </td>
                    <td>{c.cnpj || '-'}</td>
                    <td>{c.contato || '-'}</td>
                    <td><span className={`badge ${c.status==='Ativo'?'badge-success':'badge-neutral'}`}>{c.status}</span></td>
                    <td className="actions">
                      <button onClick={() => openModal(c)} style={{color:'var(--secondary)'}} title="Editar"><Edit2 size={18}/></button>
                      <button onClick={() => handleDelete(c.id)} style={{color:'var(--danger)'}} title="Excluir"><Trash2 size={18}/></button>
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
          <div className="card modal-card">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            <h2 className="text-h3" style={{marginBottom:'1.5rem'}}>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1rem'}}>
                <SmartField 
                  label="Nome da Empresa" 
                  required 
                  value={formData.nome} 
                  onChange={e => set('nome', e.target.value)} 
                  error={errors.nome}
                  placeholder="Nome completo da empresa"
                />
                <SmartField 
                  label="Sigla (max 4 carac.)" 
                  required 
                  maxLength={4} 
                  value={formData.sigla} 
                  onChange={e => set('sigla', e.target.value.toUpperCase())} 
                  error={errors.sigla}
                  placeholder="Ex: ARK"
                />
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <SmartField 
                  label="CNPJ/CPF" 
                  value={formData.cnpj} 
                  onChange={e => handleCNPJ(e.target.value)} 
                  loading={loadingField.cnpj}
                  error={errors.cnpj}
                  placeholder="00.000.000/0000-00"
                />
                <SmartField 
                  label="Telefone" 
                  value={formData.telefone} 
                  onChange={e => set('telefone', formatPhone(e.target.value))} 
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <SmartField 
                  label="Contato (Nome)" 
                  value={formData.contato} 
                  onChange={e => set('contato', e.target.value)} 
                  placeholder="Pessoa de contato"
                />
                <SmartField 
                  label="Email" 
                  type="email" 
                  value={formData.email} 
                  onChange={e => {
                    set('email', e.target.value);
                    if (errors.email) setErr('email', '');
                  }} 
                  error={errors.email}
                  placeholder="email@empresa.com"
                />
              </div>

              <SmartField 
                label="Endereço" 
                value={formData.endereco} 
                onChange={e => set('endereco', e.target.value)} 
                placeholder="Endereço completo"
              />

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <SmartField 
                  label="Latitude" 
                  value={formData.latitude} 
                  onChange={e => set('latitude', e.target.value)} 
                  loading={loadingField.coords}
                  placeholder="-23.000000"
                />
                <SmartField 
                  label="Longitude" 
                  value={formData.longitude} 
                  onChange={e => set('longitude', e.target.value)} 
                  loading={loadingField.coords}
                  placeholder="-46.000000"
                />
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem', alignItems:'center', marginBottom:'1rem'}}>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer'}}>
                  <input type="checkbox" checked={formData.isUmbrella} onChange={e=>setFormData({...formData, isUmbrella: e.target.checked, parentId: e.target.checked ? '' : formData.parentId})}/>
                  <span className="text-sm font-medium">É Cliente {tenantName}?</span>
                </label>
                
                {!formData.isUmbrella && (
                  <div className="input-group" style={{marginBottom:0}}>
                    <label className="input-label">Vincular ao Cliente</label>
                    <select className="input-field" value={formData.parentId} onChange={e=>setFormData({...formData, parentId: e.target.value})}>
                      <option value="">Nenhum (Independente)</option>
                      {items.filter(i => i.isUmbrella && i.id !== editingId).map(i => (
                        <option key={i.id} value={i.id}>{i.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="input-group"><label className="input-label">Status</label>
                <select className="input-field" value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})}>
                  <option value="Ativo">Ativo</option><option value="Inativo">Inativo</option>
                </select>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'1rem',marginTop:'1.5rem'}}>
                <button type="button" className="btn btn-secondary" onClick={()=>setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Salvar' : 'Criar Cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
