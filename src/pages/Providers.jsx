import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Building2, Search, Link as LinkIcon, QrCode, ExternalLink, Copy } from 'lucide-react';
import { api, auth } from '../store/db';
import SmartField, { FileUploadField } from '../components/SmartField';
import { useToast } from '../components/Toast';
import {
  formatCNPJ, formatPhone, formatCEP, onlyNumbers,
  validateCNPJ, validateEmail, validatePix,
  fetchCEP, fetchCNPJ, lookupBank, formatCPF
} from '../hooks/useSmartForm';

const emptyForm = {
  razaoSocial: '', nomeFantasia: '', cnpj: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  telefone: '', email: '',
  codigoBanco: '', nomeBanco: '', agencia: '', conta: '',
  tipoChavePix: '', chavePix: '',
  status: 'Ativo', observacoes: ''
};

export default function Providers() {
  const toast = useToast();
  const currentUser = auth.getCurrentUser();
  const isAdmin = currentUser?.role === 'Administrador';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loadingField, setLoadingField] = useState({});
  const [docs, setDocs] = useState({ cartaoCNPJ: null, contratoSocial: null, comprovanteEndereco: null });

  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));
  const setErr = (key, val) => setErrors(e => ({ ...e, [key]: val }));
  const setLd = (key, val) => setLoadingField(l => ({ ...l, [key]: val }));

  const load = async () => { setLoading(true); setItems(await api.providers.list()); setLoading(false); };
  useEffect(() => { 
    load(); 
    const pending = sessionStorage.getItem('pendingCNPJ');
    if (pending) {
      const data = JSON.parse(pending);
      setFormData(f => ({ ...f, ...data }));
      setEditingId(null);
      setErrors({});
      setDocs({ cartaoCNPJ: null, contratoSocial: null, comprovanteEndereco: null });
      setIsModalOpen(true);
      sessionStorage.removeItem('pendingCNPJ');
    }
  }, []);

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      const f = {};
      Object.keys(emptyForm).forEach(k => f[k] = item[k] ?? emptyForm[k]);
      setFormData(f);
      setDocs(item.documentos || { cartaoCNPJ: null, contratoSocial: null, comprovanteEndereco: null });
    } else { 
      setEditingId(null); 
      setFormData(emptyForm); 
      setDocs({ cartaoCNPJ: null, contratoSocial: null, comprovanteEndereco: null });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCNPJ = async (val) => {
    const formatted = formatCNPJ(val);
    set('cnpj', formatted);
    const raw = val.replace(/\D/g, '');
    if (raw.length === 14) {
      if (!validateCNPJ(raw)) { setErr('cnpj', 'CNPJ inválido.'); return; }
      setLd('cnpj', true);
      const data = await fetchCNPJ(raw);
      setLd('cnpj', false);
      if (data) {
        setFormData(f => ({
          ...f,
          razaoSocial: data.razaoSocial || f.razaoSocial,
          email: data.email || f.email,
          telefone: data.telefone ? data.telefone.replace(/\D/g,'').replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3') : f.telefone,
          cep: data.cep ? data.cep.replace(/\D/g,'').replace(/(\d{5})(\d{3})/, '$1-$2') : f.cep,
          logradouro: data.logradouro || f.logradouro,
          numero: data.numero || f.numero,
          bairro: data.bairro || f.bairro,
          cidade: data.cidade || f.cidade,
          estado: data.estado || f.estado
        }));
        setErr('cnpj', '');
      } else setErr('cnpj', 'CNPJ não encontrado.');
    }
  };

  const handleCEP = async (val) => {
    const formatted = formatCEP(val);
    set('cep', formatted);
    const raw = val.replace(/\D/g, '');
    if (raw.length === 8) {
      setLd('cep', true);
      const data = await fetchCEP(raw);
      setLd('cep', false);
      if (data) { setFormData(f => ({ ...f, ...data })); setErr('cep', ''); }
      else setErr('cep', 'CEP não encontrado.');
    }
  };

  const handleBanco = val => {
    const code = onlyNumbers(val).slice(0, 3);
    set('codigoBanco', code);
    if (code.length >= 3) {
      const name = lookupBank(code);
      if (name) { set('nomeBanco', name); setErr('codigoBanco', ''); }
      else setErr('codigoBanco', 'Banco não encontrado.');
    }
  };

  const handleFile = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setDocs(d => ({ ...d, [key]: { name: file.name, data: reader.result } }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.razaoSocial) newErrors.razaoSocial = 'Razão Social obrigatória.';
    if (!formData.cnpj || !validateCNPJ(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido ou obrigatório.';
    if (formData.email && !validateEmail(formData.email)) newErrors.email = 'Email inválido.';
    if (formData.telefone && formData.telefone.replace(/\D/g,'').length < 10) newErrors.telefone = 'Telefone inválido.';
    
    if (formData.tipoChavePix && formData.chavePix) {
      if (!validatePix(formData.tipoChavePix, formData.chavePix)) {
        newErrors.chavePix = 'Formato de chave Pix inválido para este tipo.';
      }
    }

    if (!docs.cartaoCNPJ && !editingId) newErrors.cartaoCNPJ = 'Cartão CNPJ é obrigatório.';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    const payload = { ...formData, documentos: docs };
    try {
      if (editingId) await api.providers.update(editingId, payload);
      else await api.providers.create(payload);
      toast.success('Empresa salva com sucesso!');
      setIsModalOpen(false); load();
    } catch (err) {
      toast.error('Erro ao salvar empresa.');
    }
  };

  const filtered = items.filter(i =>
    i.razaoSocial?.toLowerCase().includes(search.toLowerCase()) ||
    i.cnpj?.includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Gerenciar Empresas</h1>
          <p className="text-muted">Cadastro de prestadores de serviço e parceiros.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => {
              const url = window.location.origin + '/formulario-empresa';
              navigator.clipboard.writeText(url);
              toast.success('Link copiado!');
            }}
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <Copy size={18} /> Copiar Link
          </button>
          <button 
            onClick={() => window.open('/formulario-empresa', '_blank')}
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <ExternalLink size={18} /> Link de Cadastro
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              placeholder="Buscar empresa..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ paddingLeft: '2.25rem', minWidth: '400px', marginBottom: 0 }}
            />
          </div>
          <button onClick={() => openModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Nova Empresa
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando empresas...</div>
          ) : filtered.length === 0 ? (
            <div className="page-placeholder">
              <Building2 size={48} />
              <h2>Nenhuma empresa encontrada</h2>
              <p>Comece adicionando novos parceiros ou prestadores PJ.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>CNPJ</th>
                    <th>Telefone</th>
                    <th>Banco</th>
                    <th>Status</th>
                    <th style={{ width: '100px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.razaoSocial}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</div>
                      </td>
                      <td>{p.cnpj}</td>
                      <td>{p.telefone}</td>
                      <td>{p.nomeBanco}</td>
                      <td><span className={`badge ${p.status === 'Ativo' ? 'badge-success' : 'badge-neutral'}`}>{p.status}</span></td>
                      <td className="actions">
                        <button onClick={() => openModal(p)} style={{ color: 'var(--secondary)' }}><Edit2 size={18} /></button>
                        <button onClick={async () => {
                          if (await toast.confirm(`Deseja remover "${p.razaoSocial}"?`, 'Excluir Empresa', 'danger')) {
                            await api.providers.delete(p.id);
                            load();
                            toast.success('Empresa excluída!');
                          }
                        }} style={{ display: isAdmin ? 'block' : 'none', color: 'var(--danger)' }}><Trash2 size={18} /></button>
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
          <div className="card modal-card" style={{ maxWidth: '760px' }}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            <h2 className="text-h3">{editingId ? 'Editar Empresa' : 'Nova Empresa'}</h2>

            <form onSubmit={handleSubmit} style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <h3 className="form-section-title">Identificação</h3>
              <SmartField label="CNPJ" required value={formData.cnpj} onChange={e => handleCNPJ(e.target.value)} loading={loadingField.cnpj} error={errors.cnpj} />
              <div className="responsive-grid grid-2">
                <SmartField label="Razão Social" required value={formData.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} error={errors.razaoSocial} />
                <SmartField label="Nome Fantasia" value={formData.nomeFantasia} onChange={e => set('nomeFantasia', e.target.value)} />
              </div>
              <div className="responsive-grid grid-2">
                <SmartField label="Email" type="email" value={formData.email} onChange={e => set('email', e.target.value)} error={errors.email} />
                <SmartField label="Telefone" value={formData.telefone} onChange={e => set('telefone', formatPhone(e.target.value))} error={errors.telefone} />
              </div>

              <h3 className="form-section-title">Endereço</h3>
              <div className="responsive-grid grid-address-full">
                <SmartField label="CEP" value={formData.cep} onChange={e => handleCEP(e.target.value)} loading={loadingField.cep} error={errors.cep} />
                <SmartField label="Logradouro" required value={formData.logradouro} onChange={e => set('logradouro', e.target.value)} error={errors.logradouro} />
                <SmartField label="Número" required value={formData.numero} onChange={e => set('numero', e.target.value)} error={errors.numero} />
              </div>
              <div className="responsive-grid" style={{ gridTemplateColumns: '1.2fr 1fr 70px' }}>
                <SmartField label="Complemento" value={formData.complemento} onChange={e => set('complemento', e.target.value)} />
                <SmartField label="Bairro" required value={formData.bairro} onChange={e => set('bairro', e.target.value)} error={errors.bairro} />
                <SmartField label="Cidade" required value={formData.cidade} onChange={e => set('cidade', e.target.value)} error={errors.cidade} />
                <SmartField label="UF" required value={formData.estado} onChange={e => set('estado', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} error={errors.estado} />
              </div>

              <h3 className="form-section-title">Dados Bancários / Pix</h3>
              <div className="responsive-grid grid-cep">
                <SmartField label="Cód. Banco" value={formData.codigoBanco} onChange={e => handleBanco(e.target.value)} maxLength={3} hint={formData.nomeBanco} error={errors.codigoBanco} />
                <SmartField label="Nome do Banco" value={formData.nomeBanco} readOnly style={{ opacity: 0.7 }} />
              </div>
              <div className="responsive-grid grid-2">
                <SmartField label="Agência" value={formData.agencia} onChange={e => set('agencia', onlyNumbers(e.target.value))} error={errors.agencia} />
                <SmartField label="Conta" value={formData.conta} onChange={e => set('conta', e.target.value)} error={errors.conta} />
              </div>
              <div className="responsive-grid grid-2" style={{ gridTemplateColumns: '180px 1fr' }}>
                <div className="input-group">
                  <label className="input-label">Tipo PIX</label>
                  <select className="input-field" value={formData.tipoChavePix} onChange={e => { set('tipoChavePix', e.target.value); set('chavePix', ''); setErr('chavePix', ''); }}>
                    <option value="">Selecione...</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="celular">Celular</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>
                <SmartField 
                  label="Chave PIX" 
                  value={formData.chavePix} 
                  onChange={e => {
                    let val = e.target.value;
                    if (formData.tipoChavePix === 'cpf') val = formatCPF(val);
                    else if (formData.tipoChavePix === 'cnpj') val = formatCNPJ(val);
                    else if (formData.tipoChavePix === 'celular') val = formatPhone(val);
                    set('chavePix', val);
                  }} 
                  error={errors.chavePix} 
                />
              </div>

              <h3 className="form-section-title">Documentos</h3>
              <div className="responsive-grid grid-3">
                <FileUploadField label="Cartão CNPJ" required onChange={e => handleFile('cartaoCNPJ', e)} fileName={docs.cartaoCNPJ?.name} isOk={!!docs.cartaoCNPJ} />
                <FileUploadField label="Contrato Social" required onChange={e => handleFile('contratoSocial', e)} fileName={docs.contratoSocial?.name} isOk={!!docs.contratoSocial} />
                <FileUploadField label="Comprovante Endereço" required onChange={e => handleFile('comprovanteEndereco', e)} fileName={docs.comprovanteEndereco?.name} isOk={!!docs.comprovanteEndereco} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Sair</button>
                <button type="submit" className="btn btn-primary">Salvar Empresa</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
