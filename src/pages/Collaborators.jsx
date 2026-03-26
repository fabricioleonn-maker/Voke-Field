import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, Plus, Edit2, Trash2, X, Search, 
  MapPin, Phone, Mail, Briefcase, FileText,
  Building2, Landmark, CheckCircle, Copy, ExternalLink
} from 'lucide-react';
import { api, auth } from '../store/db';
import SmartField, { FileUploadField } from '../components/SmartField';
import { useToast } from '../components/Toast';
import {
  formatCPF, formatCNPJ, formatPhone, formatCEP, onlyNumbers,
  validateCPF, validateCNPJ, validateEmail, validatePhone,
  fetchCEP, fetchCNPJ, lookupBank, fetchCoordinates
} from '../hooks/useSmartForm';

const emptyForm = {
  nome: '', cpf: '', rg: '', dataNascimento: '',
  email: '', telefone: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  modalidadeContrato: 'clt',
  cargoId: '', setorId: '', providerId: '', especialidade: '',
  cnpj: '', razaoSocial: '',
  codigoBanco: '', nomeBanco: '', agencia: '', conta: '', tipoChavePix: '', chavePix: '',
  status: 'Em Análise', observacoes: '',
  lunchStart: '12:00', lunchEnd: '13:00',
  customSchedule: false, workingDays: [1, 2, 3, 4, 5], shiftStart: '08:00', shiftEnd: '18:00',
  saturdayMode: 'custom', saturdayStart: '08:00', saturdayEnd: '12:00'
};

const weekDays = [
  { id: 1, label: 'Seg' }, { id: 2, label: 'Ter' }, { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' }, { id: 5, label: 'Sex' }, { id: 6, label: 'Sáb' }, { id: 0, label: 'Dom' }
];

export default function Collaborators() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [docs, setDocs] = useState({ rg: null, cpf: null, residencia: null, cnpj: null, cnh: null });

  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [providers, setProviders] = useState([]);

  const isPJ = formData.modalidadeContrato === 'pj' || formData.modalidadeContrato === 'pj_fixo' || formData.modalidadeContrato === 'pj_freelancer';
  const isCLT = formData.modalidadeContrato === 'clt' || formData.modalidadeContrato === 'estagio' || formData.modalidadeContrato === 'temporario';

  const load = async () => {
    setLoading(true);
    try {
      const [c, p, d, prov] = await Promise.all([
        api.collaborators.list(),
        api.positions.list(),
        api.departments.list(),
        api.providers.list()
      ]);
      setItems(c);
      setPositions(p);
      setDepartments(d);
      setProviders(prov);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && items.length > 0) {
      const item = items.find(x => x.id === editId);
      if (item) {
        openModal(item);
        setSearchParams({});
      }
    }
  }, [items, searchParams, setSearchParams]);

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      const f = { ...emptyForm };
      Object.keys(emptyForm).forEach(k => { f[k] = item[k] ?? emptyForm[k]; });
      if (!Array.isArray(f.workingDays)) f.workingDays = [1, 2, 3, 4, 5];
      setFormData(f);
      setDocs(item.documentos || { rg: null, cpf: null, residencia: null, cnpj: null, cnh: null });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
      setDocs({ rg: null, cpf: null, residencia: null, cnpj: null, cnh: null });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));
  const setErr = (key, val) => setErrors(e => ({ ...e, [key]: val }));

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

  const handleCEP = async (val) => {
    const formatted = formatCEP(val);
    set('cep', formatted);
    const raw = val.replace(/\D/g, '');
    if (raw.length === 8) {
      setLoadingField(l => ({ ...l, cep: true }));
      const data = await fetchCEP(raw);
      setLoadingField(l => ({ ...l, cep: false }));
      if (data) { setFormData(f => ({ ...f, ...data })); setErr('cep', ''); }
      else setErr('cep', 'CEP não encontrado.');
    }
  };

  const handleCNPJ = async (val) => {
    const formatted = formatCNPJ(val);
    set('cnpj', formatted);
    const raw = val.replace(/\D/g, '');
    if (raw.length === 14) {
      if (!validateCNPJ(raw)) { setErr('cnpj', 'CNPJ inválido.'); return; }
      setLoadingField(l => ({ ...l, cnpj: true }));
      const data = await fetchCNPJ(raw);
      setLoadingField(l => ({ ...l, cnpj: false }));
      if (data) { setFormData(f => ({ ...f, razaoSocial: data.razaoSocial || f.razaoSocial })); setErr('cnpj', ''); }
      else setErr('cnpj', 'CNPJ não encontrado.');
    }
  };

  const handleCPF = (val) => {
    const formatted = formatCPF(val);
    set('cpf', formatted);
    const raw = val.replace(/\D/g, '');
    if (raw.length === 11) { setErr('cpf', validateCPF(raw) ? '' : 'CPF inválido.'); }
  };

  const handleBanco = (val) => {
    const code = onlyNumbers(val).slice(0, 3);
    set('codigoBanco', code);
    if (code.length >= 3) {
      const name = lookupBank(code);
      if (name) { set('nomeBanco', name); setErr('codigoBanco', ''); }
      else setErr('codigoBanco', 'Banco não encontrado.');
    }
  };

  const handlePixChave = (val) => {
    let formatted = val;
    if (formData.tipoChavePix === 'cpf') formatted = formatCPF(val);
    else if (formData.tipoChavePix === 'cnpj') formatted = formatCNPJ(val);
    else if (formData.tipoChavePix === 'celular') formatted = formatPhone(val);
    set('chavePix', formatted);
  };

  const getPixPlaceholder = () => {
    switch (formData.tipoChavePix) {
      case 'cpf': return '000.000.000-00';
      case 'cnpj': return '00.000.000/0000-00';
      case 'celular': return '(00) 00000-0000';
      case 'email': return 'email@exemplo.com';
      default: return 'Chave aleatória';
    }
  };

  const handleFile = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setDocs(d => ({ ...d, [key]: { name: file.name, data: reader.result } }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.nome) newErrors.nome = 'Nome obrigatório.';
    if (!formData.cpf || !validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido ou obrigatório.';
    if (formData.email && !validateEmail(formData.email)) newErrors.email = 'Email inválido.';
    
    if (isPJ && (!formData.cnpj || !validateCNPJ(formData.cnpj))) {
      newErrors.cnpj = 'CNPJ obrigatório para modalidade PJ.';
    }

    if (isCLT) {
      if (!formData.codigoBanco) newErrors.codigoBanco = 'Banco obrigatório.';
      if (!formData.agencia) newErrors.agencia = 'Agência obrigatória.';
      if (!formData.conta) newErrors.conta = 'Conta obrigatória.';
      if (!formData.tipoChavePix) newErrors.tipoChavePix = 'Tipo de PIX obrigatório.';
      if (!formData.chavePix) newErrors.chavePix = 'Chave PIX obrigatória.';
    }

    const hasRequiredDocs = docs.rg && docs.cpf && docs.residencia && (!isPJ || docs.cnpj);
    if (!hasRequiredDocs) {
      await toast.confirm('Por favor, anexe todos os documentos obrigatórios (*).', 'Documentos Pendentes', 'alert');
      return;
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    let latitude = formData.latitude;
    let longitude = formData.longitude;

    if (formData.logradouro && formData.cidade && formData.estado) {
      const fullAddress = `${formData.logradouro}, ${formData.numero || ''}, ${formData.cidade}, ${formData.estado}`;
      const coords = await fetchCoordinates(fullAddress);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lon;
      }
    }

    const payload = { ...formData, documentos: docs, latitude, longitude };
    try {
      if (editingId) {
        await api.collaborators.update(editingId, payload);
        toast.success('Colaborador atualizado!');
        setIsModalOpen(false);
        load();
      } else {
        const newColab = await api.collaborators.create(payload);
        setIsModalOpen(false);
        load();
        
        // Pergunta se deseja criar acesso
        const createAccess = await toast.confirm(
          `Deseja gerar o acesso (usuário) para ${payload.nome} agora? O perfil padrão será "Técnico".`,
          'Criar Acesso ao Sistema?',
          'primary'
        );

        if (createAccess) {
          try {
            await api.users.create({
              nome: payload.nome,
              email: payload.email,
              password: 'voke' + Math.floor(100 + Math.random() * 900), // Senha provisória
              role: 'Técnico',
              status: 'Ativo'
            });
            toast.success('Acesso criado com sucesso! Informe ao colaborador sua senha temporária.');
          } catch (err) {
            toast.error('Erro ao criar acesso.');
          }
        }
      }
    } catch (err) {
      toast.error('Erro ao salvar colaborador.');
    }
  };

  const filtered = items.filter(i => 
    i.nome?.toLowerCase().includes(search.toLowerCase()) || 
    i.cpf?.includes(search) ||
    i.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Gerenciar Colaboradores</h1>
          <p className="text-muted">Gestão de equipe, prestadores PJ e regime CLT.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => {
              const url = window.location.origin + '/formulario-colaborador';
              navigator.clipboard.writeText(url);
              toast.success('Link de cadastro copiado!');
            }}
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <Copy size={18} /> Copiar Link
          </button>
          <button 
            onClick={() => window.open('/formulario-colaborador', '_blank')}
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <ExternalLink size={18} /> Link de Cadastro
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              placeholder="Buscar colaborador..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ paddingLeft: '2.25rem', minWidth: '400px', marginBottom: 0 }}
            />
          </div>
          <button onClick={() => openModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Novo Colaborador
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</p>
          : filtered.length === 0 ? (
            <div className="page-placeholder">
              <Users size={48} />
              <h2>Nenhum colaborador encontrado</h2>
              <p>Comece adicionando novos membros à sua equipe ou prestadores PJ.</p>
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF/RG</th>
                    <th>Contato</th>
                    <th>Modalidade</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.nome}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{item.cpf}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.rg}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{item.telefone}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.email}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>{item.modalidadeContrato}</span>
                      </td>
                      <td>
                        <span className={`badge ${item.status === 'Ativo' ? 'badge-success' : item.status === 'Inativo' ? 'badge-danger' : 'badge-warning'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="actions">
                        <button onClick={() => openModal(item)} style={{ color: 'var(--secondary)' }}><Edit2 size={18} /></button>
                        <button onClick={async () => {
                          if (await toast.confirm(`Tem certeza que deseja remover "${item.nome}"? Esta ação não pode ser desfeita.`, 'Excluir Colaborador', 'danger')) {
                            await api.collaborators.delete(item.id);
                            load();
                            toast.success('Colaborador excluído!');
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
          <div className="card modal-card" style={{ maxWidth: '780px' }}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            <h2 className="text-h3" style={{ marginBottom: '1.5rem' }}>{editingId ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
            <form onSubmit={handleSubmit} style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <h3 className="form-section-title">Dados Pesosais</h3>
              <SmartField label="Nome Completo" required value={formData.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome como está no documento" />
              <div className="responsive-grid grid-3">
                <SmartField label="CPF" required value={formData.cpf} onChange={e => handleCPF(e.target.value)} placeholder="000.000.000-00" error={errors.cpf} />
                <SmartField label="RG" required value={formData.rg} onChange={e => set('rg', e.target.value)} error={errors.rg} />
                <SmartField label="Data de Nascimento" type="date" value={formData.dataNascimento} onChange={e => set('dataNascimento', e.target.value)} error={errors.dataNascimento} />
              </div>
              <div className="responsive-grid grid-2">
                <SmartField label="Email" required type="email" value={formData.email} onChange={e => set('email', e.target.value)} error={errors.email} />
                <SmartField label="Telefone / Celular" required value={formData.telefone} onChange={e => set('telefone', formatPhone(e.target.value))} placeholder="(00) 00000-0000" error={errors.telefone} />
              </div>

              <h3 className="form-section-title">Endereço</h3>
              <div className="responsive-grid grid-address-full">
                <SmartField label="CEP" required value={formData.cep} onChange={e => handleCEP(e.target.value)} placeholder="00000-000" loading={loadingField.cep} error={errors.cep} />
                <SmartField label="Logradouro" required value={formData.logradouro} onChange={e => set('logradouro', e.target.value)} />
                <SmartField label="Número" required value={formData.numero} onChange={e => set('numero', e.target.value)} error={errors.numero} />
              </div>
              <div className="responsive-grid" style={{ gridTemplateColumns: '1.2fr 1.2fr 1fr 70px' }}>
                <SmartField label="Complemento" value={formData.complemento} onChange={e => set('complemento', e.target.value)} />
                <SmartField label="Bairro" required value={formData.bairro} onChange={e => set('bairro', e.target.value)} error={errors.bairro} />
                <SmartField label="Cidade" required value={formData.cidade} onChange={e => set('cidade', e.target.value)} error={errors.cidade} />
                <SmartField label="UF" required value={formData.estado} onChange={e => set('estado', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} error={errors.estado} />
              </div>

              <h3 className="form-section-title">Dados Profissionais</h3>
              <div className="responsive-grid grid-2">
                <div className="input-group">
                  <label className="input-label">Tipo de Contrato *</label>
                  <select className="input-field" required value={formData.modalidadeContrato} onChange={e => {
                    const val = e.target.value;
                    set('modalidadeContrato', val);
                    // Default lunch hours
                    if (val === 'clt') { set('lunchStart', '12:00'); set('lunchEnd', '13:00'); }
                    else { set('lunchStart', '13:00'); set('lunchEnd', '14:00'); }
                  }}>
                    <option value="clt">CLT</option>
                    <option value="pj_fixo">FIXO (PJ Contrato Fixo)</option>
                    <option value="pj_freelancer">FREELANCER (PJ Avulso)</option>
                    <option value="estagio">Estágio</option>
                    <option value="temporario">Temporário</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Cargo</label>
                  <select className="input-field" value={formData.cargoId} onChange={e => {
                    const val = e.target.value;
                    set('cargoId', val);
                    if (val && !formData.customSchedule) {
                      const pos = positions.find(p => p.id === val);
                      if (pos) {
                        set('workingDays', pos.workingDays || [1,2,3,4,5]);
                        set('shiftStart', pos.shiftStart || '08:00');
                        set('shiftEnd', pos.shiftEnd || '18:00');
                      }
                    }
                  }}>
                    <option value="">Selecione</option>
                    {positions.filter(p => p.status === 'Ativo').map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="responsive-grid grid-2">
                <SmartField label="Especialidade" value={formData.especialidade} onChange={e => set('especialidade', e.target.value)} placeholder="Ex: Câmeras IP, Mikrotik..." />
                <div className="input-group">
                  <label className="input-label">Setor</label>
                  <select className="input-field" value={formData.setorId} onChange={e => set('setorId', e.target.value)}>
                    <option value="">Selecione</option>
                    {departments.filter(d => d.status === 'Ativo').map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="responsive-grid grid-2" style={{ marginBottom: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Status *</label>
                  <select className="input-field" required value={formData.status} onChange={e => set('status', e.target.value)}>
                    <option value="Ativo">Ativo</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--surface-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="form-section-title" style={{ margin: 0, color: 'var(--primary)' }}>Jornada de Trabalho</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input type="checkbox" checked={formData.customSchedule} onChange={e => {
                      const isCustom = e.target.checked;
                      set('customSchedule', isCustom);
                      if (!isCustom && formData.cargoId) {
                        const pos = positions.find(p => p.id === formData.cargoId);
                        if (pos) {
                          set('workingDays', Array.isArray(pos.workingDays) ? pos.workingDays : [1,2,3,4,5]);
                          set('shiftStart', pos.shiftStart || '08:00');
                          set('shiftEnd', pos.shiftEnd || '18:00');
                          set('saturdayMode', pos.saturdayMode || 'custom');
                          set('saturdayStart', pos.saturdayStart || '08:00');
                          set('saturdayEnd', pos.saturdayEnd || '12:00');
                        }
                      }
                    }} /> 
                    Personalizar Jornada
                  </label>
                </div>

                <div className="input-group" style={{ opacity: formData.customSchedule ? 1 : 0.6, pointerEvents: formData.customSchedule ? 'auto' : 'none' }}>
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
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: '1rem', opacity: formData.customSchedule ? 1 : 0.6, pointerEvents: formData.customSchedule ? 'auto' : 'none' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ color: 'var(--primary)' }}>Regra Especial para Sábados</label>
                      <select className="input-field" value={formData.saturdayMode || 'custom'} onChange={e => set('saturdayMode', e.target.value)}>
                        <option value="custom">Personalizar Horário (Entrada/Saída Específica para Sábados)</option>
                        <option value="half">Meio Período Padrão (08:00 às 12:00)</option>
                        <option value="alternate">Sábados Alternados (1 sim, 1 não - Horário Normal)</option>
                      </select>
                    </div>

                    {formData.saturdayMode === 'custom' && (
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem', marginTop: '1rem'}}>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.75rem' }}>Entrada Sábado</label>
                          <input type="time" className="input-field" value={formData.saturdayStart || '08:00'} onChange={e=>set('saturdayStart', e.target.value)}/>
                        </div>
                        <div className="input-group">
                          <label className="input-label" style={{ fontSize: '0.75rem' }}>Saída Sábado</label>
                          <input type="time" className="input-field" value={formData.saturdayEnd || '12:00'} onChange={e=>set('saturdayEnd', e.target.value)}/>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="responsive-grid grid-2" style={{ marginTop: '1rem', opacity: formData.customSchedule ? 1 : 0.6, pointerEvents: formData.customSchedule ? 'auto' : 'none' }}>
                  <SmartField label="Entrada" type="time" required value={formData.shiftStart} onChange={e => set('shiftStart', e.target.value)} />
                  <SmartField label="Saída" type="time" required value={formData.shiftEnd} onChange={e => set('shiftEnd', e.target.value)} />
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'rgba(236,72,153,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(236,72,153,0.2)', marginBottom: '1rem' }}>
                <h3 className="form-section-title" style={{ color: '#db2777' }}>Configuração de Almoço</h3>
                <div className="responsive-grid grid-2">
                  <SmartField label="Início do Almoço" type="time" value={formData.lunchStart} onChange={e => set('lunchStart', e.target.value)} />
                  <SmartField label="Fim do Almoço" type="time" value={formData.lunchEnd} onChange={e => set('lunchEnd', e.target.value)} />
                </div>
              </div>

              {isPJ && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(59,130,246,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '1rem' }}>
                  <h3 className="form-section-title" style={{ color: 'var(--info)' }}>Dados Pessoa Jurídica</h3>
                  <SmartField label="CNPJ" required value={formData.cnpj} onChange={e => handleCNPJ(e.target.value)} placeholder="00.000.000/0000-00" loading={loadingField.cnpj} error={errors.cnpj} />
                  <SmartField label="Razão Social" value={formData.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} />
                </div>
              )}

              {isCLT && (
                <>
                  <h3 className="form-section-title">Dados Bancários / Pix</h3>
                  <div className="responsive-grid grid-cep">
                    <SmartField label="Cód. Banco" value={formData.codigoBanco} onChange={e => handleBanco(e.target.value)} maxLength={3} error={errors.codigoBanco} hint={formData.nomeBanco} />
                    <SmartField label="Banco" value={formData.nomeBanco} readOnly style={{ opacity: 0.7 }} />
                  </div>
                  <div className="responsive-grid grid-2">
                    <SmartField label="Agência" value={formData.agencia} onChange={e => set('agencia', onlyNumbers(e.target.value))} />
                    <SmartField label="Conta" value={formData.conta} onChange={e => set('conta', e.target.value)} />
                  </div>
                  <div className="responsive-grid grid-cep">
                    <div className="input-group">
                      <label className="input-label">Tipo PIX *</label>
                      <select className="input-field" value={formData.tipoChavePix} onChange={e => { set('tipoChavePix', e.target.value); set('chavePix', ''); }}>
                        <option value="">Selecione</option>
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="celular">Celular</option>
                        <option value="email">Email</option>
                        <option value="aleatoria">Aleatória</option>
                      </select>
                    </div>
                    {formData.tipoChavePix && (
                      <SmartField label="Chave PIX" required value={formData.chavePix} onChange={e => handlePixChave(e.target.value)} placeholder={getPixPlaceholder()} error={errors.chavePix} />
                    )}
                  </div>
                </>
              )}

              <h3 className="form-section-title">Documentos (*)</h3>
              <div className="responsive-grid grid-2">
                <FileUploadField label="RG" required onChange={e => handleFile('rg', e)} fileName={docs.rg?.name} isOk={!!docs.rg} />
                <FileUploadField label="CPF" required onChange={e => handleFile('cpf', e)} fileName={docs.cpf?.name} isOk={!!docs.cpf} />
              </div>
              <div className="responsive-grid grid-2">
                <FileUploadField label="Comprovante Residência" required onChange={e => handleFile('residencia', e)} fileName={docs.residencia?.name} isOk={!!docs.residencia} />
                <FileUploadField label="CNH / Outros" onChange={e => handleFile('cnh', e)} fileName={docs.cnh?.name} isOk={!!docs.cnh} />
              </div>
              {isPJ && <FileUploadField label="Cartão CNPJ" required onChange={e => handleFile('cnpj', e)} fileName={docs.cnpj?.name} isOk={!!docs.cnpj} />}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Sair</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Salvar Alterações' : 'Cadastrar Colaborador'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
