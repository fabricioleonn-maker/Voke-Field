import React, { useState, useEffect } from 'react';
import { api } from '../store/db';
import { getBrasiliaISO } from '../utils/time';
import SmartField, { FileUploadField } from '../components/SmartField';
import {
  formatCPF, formatCNPJ, formatPhone, formatCEP, onlyNumbers,
  validateCPF, validateCNPJ, validateEmail, validatePhone, validateRG, validateBirthDate, validatePix,
  fetchCEP, fetchCNPJ, lookupBank
} from '../hooks/useSmartForm';
import { CheckCircle, UserPlus, ChevronRight } from 'lucide-react';
import { useToast } from '../components/Toast';

const STEPS = ['Identificação', 'Endereço', 'Dados PJ/Bancários', 'Documentos'];

const emptyForm = {
  nome: '', cpf: '', rg: '', dataNascimento: '', email: '', telefone: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  modalidadeContrato: 'clt',
  razaoSocial: '', cnpj: '',
  codigoBanco: '', nomeBanco: '', agencia: '', conta: '', 
  pixKeys: [{ tipo: '', chave: '' }],
  status: 'Em Análise',
  observacoes: ''
};

export default function PublicRegistrationForm() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loadingField, setLoadingField] = useState({});
  const [docs, setDocs] = useState({ rg: null, cpf: null, residencia: null, cnpj: null, cnh: null });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [userCodeInput, setUserCodeInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Persistência de Estado e Auto-preenchimento de CNPJ
  useEffect(() => {
    const saved = sessionStorage.getItem('colab_form_state');
    let baseData = emptyForm;
    let baseStep = 0;
    let baseDocs = { rg: null, cpf: null, residencia: null, cnpj: null, cnh: null };

    if (saved) {
      const { data, step: savedStep, docs: savedDocs } = JSON.parse(saved);
      baseData = data;
      baseStep = savedStep;
      baseDocs = savedDocs || baseDocs;
    }

    // Verificar se existe um CNPJ recém cadastrado
    const lastCNPJ = localStorage.getItem('lastCreatedProviderCNPJ');
    if (lastCNPJ) {
      baseData = { ...baseData, cnpj: lastCNPJ, modalidadeContrato: 'pj' };
      // Opcional: Se já carregou o CNPJ, pular para o passo de dados PJ se estiver no começo
      if (baseStep === 0 && baseData.nome) {
        // baseStep = 2; // Poderia pular, mas melhor deixar o usuário conferir
      }
      localStorage.removeItem('lastCreatedProviderCNPJ');
    }

    setFormData(baseData);
    setStep(baseStep);
    setDocs(baseDocs);
  }, []);

  useEffect(() => {
    if (!submitted) {
      sessionStorage.setItem('colab_form_state', JSON.stringify({ data: formData, step: step, docs: docs }));
    } else {
      sessionStorage.removeItem('colab_form_state');
    }
  }, [formData, step, docs, submitted]);

  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));
  const setErr = (key, val) => setErrors(e => ({ ...e, [key]: val }));
  const setLd = (key, val) => setLoadingField(l => ({ ...l, [key]: val }));
  const isPJ = formData.modalidadeContrato === 'pj' || formData.modalidadeContrato === 'pj_fixo' || formData.modalidadeContrato === 'pj_freelancer';

  const handleCEP = async val => {
    const formatted = formatCEP(val);
    set('cep', formatted);
    if (val.replace(/\D/g, '').length === 8) {
      setLd('cep', true);
      const data = await fetchCEP(val.replace(/\D/g, ''));
      setLd('cep', false);
      if (data) { setFormData(f => ({ ...f, ...data })); setErr('cep', ''); }
      else setErr('cep', 'CEP não encontrado.');
    }
  };

  const handleCNPJ = async val => {
    const formatted = formatCNPJ(val);
    set('cnpj', formatted);
    const raw = val.replace(/\D/g, '');
    if (raw.length === 14) {
      if (!validateCNPJ(raw)) { setErr('cnpj', 'CNPJ inválido.'); return; }
      setLd('cnpj', true);
      
      try {
        // 1. Verificar se existe no sistema
        const providers = await api.providers.list();
        const existing = providers.find(p => p.cnpj.replace(/\D/g, '') === raw);

        if (existing) {
          setFormData(f => ({
            ...f,
            razaoSocial: existing.razaoSocial,
            codigoBanco: existing.codigoBanco || '',
            nomeBanco: existing.nomeBanco || '',
            agencia: existing.agencia || '',
            conta: existing.conta || '',
            tipoChavePix: existing.tipoChavePix || '',
            chavePix: existing.chavePix || ''
          }));
          setErr('cnpj', '');
          toast.success('Empresa parceira encontrada. Dados bancários vinculados.');
          return;
        }

        // 2. Se não existe, perguntar se quer cadastrar
        if (await toast.confirm(
          'Este CNPJ não consta em nosso registro de prestadores de serviços. Você é o responsável por esta empresa ou possui autorização para cadastrá-la agora?',
          'Empresa não encontrada'
        )) {
          window.open('/formulario-empresa?source=colab', '_blank');
        } else {
          set('cnpj', '');
          set('razaoSocial', '');
          toast.error('Esta empresa não está cadastrada em nosso sistema. Solicite o cadastro da empresa antes de continuar.');
        }

      } catch (err) {
        setErr('cnpj', 'Erro ao validar CNPJ.');
      } finally {
        setLd('cnpj', false);
      }
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

  const updatePixKey = (index, field, value) => {
    const newKeys = [...formData.pixKeys];
    newKeys[index][field] = value;

    // Auto-preenchimento inteligente
    if (field === 'tipo' && !isPJ) {
      if (value === 'cpf') newKeys[index].chave = formData.cpf;
      else if (value === 'cnpj') newKeys[index].chave = formData.cnpj;
      else if (value === 'email') newKeys[index].chave = formData.email;
      else if (value === 'celular') newKeys[index].chave = formData.telefone;
    }

    set('pixKeys', newKeys);
  };

  const addPixKey = () => {
    set('pixKeys', [...formData.pixKeys, { tipo: '', chave: '' }]);
  };

  const removePixKey = (index) => {
    if (formData.pixKeys.length <= 1) return;
    const newKeys = formData.pixKeys.filter((_, i) => i !== index);
    set('pixKeys', newKeys);
  };

  const handleFile = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setDocs(d => ({ ...d, [key]: { name: file.name, data: reader.result } }));
    reader.readAsDataURL(file);
  };

  const validateStep = async () => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.nome || formData.nome.trim().split(/\s+/).length < 2) 
        newErrors.nome = 'Digite seu nome completo (nome e sobrenome).';
      if (!formData.cpf || !validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido.';
      if (!formData.rg || !validateRG(formData.rg)) newErrors.rg = 'RG inválido.';
      if (!formData.dataNascimento || !validateBirthDate(formData.dataNascimento)) newErrors.dataNascimento = 'Data de nascimento inválida (mín. 14 anos).';
      if (!formData.email || !validateEmail(formData.email)) newErrors.email = 'E-mail inválido.';
      if (!formData.telefone || !validatePhone(formData.telefone)) newErrors.telefone = 'Telefone inválido.';
    }
    if (step === 1) {
      if (!formData.cep) newErrors.cep = 'CEP obrigatório.';
      if (!formData.logradouro) newErrors.logradouro = 'Logradouro obrigatório.';
      if (!formData.numero) newErrors.numero = 'Número obrigatório.';
      if (!formData.bairro) newErrors.bairro = 'Bairro obrigatório.';
      if (!formData.cidade) newErrors.cidade = 'Cidade obrigatória.';
      if (!formData.estado) newErrors.estado = 'UF obrigatória.';
    }
    if (step === 2) {
      if (isPJ) {
        if (!formData.cnpj || !validateCNPJ(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido.';
        if (!formData.razaoSocial) newErrors.razaoSocial = 'Razão Social obrigatória.';
      }
      if (!formData.codigoBanco) newErrors.codigoBanco = 'Banco obrigatório.';
      if (!formData.agencia) newErrors.agencia = 'Agência obrigatória.';
      if (!formData.conta) newErrors.conta = 'Conta obrigatória.';
      
      formData.pixKeys.forEach((pk, idx) => {
        if (!pk.tipo) newErrors[`pixKeys_${idx}_tipo`] = 'Tipo obrigatório.';
        if (!pk.chave) newErrors[`pixKeys_${idx}_chave`] = 'Chave obrigatória.';
        else if (!validatePix(pk.tipo, pk.chave)) newErrors[`pixKeys_${idx}_chave`] = 'Formato Pix inválido.';
      });
    }
    if (step === 3) {
      if (!docs.rg) newErrors.rg = 'Cópia do RG é obrigatória.';
      if (!docs.cpf) newErrors.cpf = 'Cópia do CPF é obrigatória.';
      if (!docs.residencia) newErrors.residencia = 'Comprovante residência é obrigatório.';
      if (isPJ && !docs.cnpj) newErrors.cnpj = 'Cartão CNPJ é obrigatório para PJ.';
      
      if (Object.keys(newErrors).length > 0) {
        toast.error('Por favor, envie todos os documentos obrigatórios antes de finalizar.');
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => { if (await validateStep()) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!await validateStep()) return;
    
    // Inicia verificação de e-mail antes de salvar
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setIsVerifying(true);
    await toast.confirm(`[SIMULAÇÃO] Código enviado para ${formData.email}: ${code}`, 'Código de Verificação', 'alert');
  };

  const handleFinalSubmit = async () => {
    if (userCodeInput !== verificationCode) {
      toast.error('Código de verificação incorreto.');
      return;
    }

    setSubmitting(true);
    try {
      const colabPayload = {
        ...formData,
        status: formData.status || 'Em Análise',
        documentos: docs,
        submittedAt: getBrasiliaISO()
      };
      
      await api.collaborators.create(colabPayload);
      
      // Cria o usuário do sistema já verificado
      await api.users.create({
        nome: formData.nome,
        email: formData.email,
        password: 'voke' + Math.floor(100 + Math.random() * 900), // Senha provisória
        role: 'Técnico',
        status: 'Ativo',
        verified: true // Já verificou no formulário
      });

      setSubmitted(true);
      toast.success('Cadastro e acesso criados com sucesso!');
    } catch (err) {
      toast.error('Erro ao enviar o cadastro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Tudo Pronto!</h2>
          <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
            Seus dados foram recebidos com sucesso e estão em análise. Você receberá um contato em breve.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-secondary">Enviar outro cadastro</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <UserPlus size={32} color="#3b82f6" />
          <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 700 }}>Space Soluções</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Formulário de Pré-Cadastro de Colaborador</p>
      </div>

      <div className="stepper-container">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="stepper-item" style={{
              padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
              background: i === step ? '#3b82f6' : i < step ? '#10b981' : 'white',
              color: i === step || i < step ? 'white' : '#64748b',
              border: i >= step ? '1px solid #e2e8f0' : 'none'
            }}>{i < step ? '✓ ' : ''}{s}</div>
            {i < STEPS.length - 1 && <ChevronRight size={16} color="#94a3b8" />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ maxWidth: '620px', width: '100%', background: 'white', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>{STEPS[step]}</h2>

        <form onSubmit={step < STEPS.length - 1 ? e => { e.preventDefault(); nextStep(); } : handleSubmit}>
          {step === 0 && (
            <>
              <SmartField label="Nome Completo" required value={formData.nome} onChange={e => set('nome', e.target.value)} error={errors.nome} placeholder="Ex: João Silva" />
              <div className="responsive-grid grid-2">
                <SmartField label="CPF" required value={formData.cpf} onChange={e => set('cpf', formatCPF(e.target.value))} error={errors.cpf} />
                <SmartField label="RG" required value={formData.rg} onChange={e => set('rg', e.target.value)} error={errors.rg} />
              </div>
              <SmartField label="Data de Nascimento" type="date" required value={formData.dataNascimento} onChange={e => set('dataNascimento', e.target.value)} error={errors.dataNascimento} />
              <div className="responsive-grid grid-2">
                <SmartField label="E-mail" type="email" required value={formData.email} onChange={e => { set('email', e.target.value); setErr('email', validateEmail(e.target.value) || !e.target.value ? '' : 'Email inválido.'); }} error={errors.email} />
                <SmartField label="Telefone / Celular" required value={formData.telefone} onChange={e => set('telefone', formatPhone(e.target.value))} error={errors.telefone} />
              </div>
              <div className="input-group">
                <label className="input-label">Status do Cadastro *</label>
                <select className="input-field" required value={formData.status} onChange={e => set('status', e.target.value)}>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="responsive-grid grid-2" style={{ gridTemplateColumns: '160px 1fr' }}>
                <SmartField label="CEP" required value={formData.cep} onChange={e => handleCEP(e.target.value)} loading={loadingField.cep} error={errors.cep} success={!!formData.logradouro} />
                <SmartField label="Logradouro" required value={formData.logradouro} onChange={e => set('logradouro', e.target.value)} error={errors.logradouro} />
              </div>
              <div className="responsive-grid grid-2">
                <SmartField label="Número" required value={formData.numero} onChange={e => set('numero', e.target.value)} error={errors.numero} />
                <SmartField label="Complemento" value={formData.complemento} onChange={e => set('complemento', e.target.value)} />
              </div>
              <div className="responsive-grid grid-city-uf">
                <SmartField label="Bairro" required value={formData.bairro} onChange={e => set('bairro', e.target.value)} error={errors.bairro} />
                <SmartField label="Cidade" required value={formData.cidade} onChange={e => set('cidade', e.target.value)} error={errors.cidade} />
                <SmartField label="UF" required value={formData.estado} onChange={e => set('estado', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} error={errors.estado} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="input-group">
                <label className="input-label">Modalidade de Contrato <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
                  <label className="radio-label"><input type="radio" name="modal" checked={formData.modalidadeContrato === 'clt'} onChange={() => set('modalidadeContrato', 'clt')} /> CLT</label>
                  <label className="radio-label"><input type="radio" name="modal" checked={formData.modalidadeContrato === 'pj_fixo'} onChange={() => set('modalidadeContrato', 'pj_fixo')} /> PJ (Fixo)</label>
                  <label className="radio-label"><input type="radio" name="modal" checked={formData.modalidadeContrato === 'pj_freelancer'} onChange={() => set('modalidadeContrato', 'pj_freelancer')} /> PJ (Freelancer)</label>
                </div>
              </div>

              {isPJ && (
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b' }}>Dados da Empresa</h4>
                    <button type="button" onClick={() => window.location.href = '/formulario-empresa?source=colab'} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Cadastrar Nova Empresa</button>
                  </div>
                  <SmartField label="CNPJ" required value={formData.cnpj} onChange={e => handleCNPJ(e.target.value)} loading={loadingField.cnpj} error={errors.cnpj} success={formData.cnpj.replace(/\D/g,'').length === 14 && !errors.cnpj} hint="Digite o CNPJ da empresa parceira" />
                  <SmartField label="Razão Social" value={formData.razaoSocial} readOnly style={{ opacity: 0.7 }} />
                </div>
              )}

              <div className="responsive-grid grid-cep">
                <SmartField label="Cód. Banco" required value={formData.codigoBanco} onChange={e => handleBanco(e.target.value)} maxLength={3} hint={formData.nomeBanco} error={errors.codigoBanco} readOnly={isPJ} style={isPJ ? { opacity: 0.7 } : {}} />
                <SmartField label="Nome do Banco" value={formData.nomeBanco} readOnly style={{ opacity: 0.7 }} />
              </div>
              <div className="responsive-grid grid-2">
                <SmartField label="Agência" required value={formData.agencia} onChange={e => set('agencia', onlyNumbers(e.target.value))} error={errors.agencia} readOnly={isPJ} style={isPJ ? { opacity: 0.7 } : {}} />
                <SmartField label="Conta" required value={formData.conta} onChange={e => set('conta', e.target.value)} error={errors.conta} readOnly={isPJ} style={isPJ ? { opacity: 0.7 } : {}} />
              </div>
              {formData.pixKeys.map((pk, idx) => (
                <div key={idx} className="responsive-grid grid-2" style={{ gridTemplateColumns: '180px 1fr', position: 'relative', marginBottom: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Tipo PIX {idx + 1} <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select className="input-field" value={pk.tipo} onChange={e => updatePixKey(idx, 'tipo', e.target.value)} required disabled={isPJ} style={isPJ ? { opacity: 0.7 } : {}}>
                      <option value="">Selecione...</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="celular">Celular</option>
                      <option value="email">E-mail</option>
                      <option value="aleatoria">Chave Aleatória</option>
                    </select>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <SmartField 
                      label={`Chave PIX ${idx + 1}`} 
                      required 
                      value={pk.chave} 
                      onChange={e => {
                        let val = e.target.value;
                        if (pk.tipo === 'cpf') val = formatCPF(val);
                        else if (pk.tipo === 'cnpj') val = formatCNPJ(val);
                        else if (pk.tipo === 'celular') val = formatPhone(val);
                        updatePixKey(idx, 'chave', val);
                      }} 
                      error={errors[`pixKeys_${idx}_chave`]} 
                      readOnly={isPJ}
                      style={isPJ ? { opacity: 0.7 } : {}}
                    />
                    {idx > 0 && !isPJ && (
                      <button type="button" onClick={() => removePixKey(idx)} style={{ position: 'absolute', right: -30, top: 40, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>×</button>
                    )}
                  </div>
                </div>
              ))}

              {!isPJ && (
                <button type="button" onClick={addPixKey} className="btn btn-secondary" style={{ width: '100%', marginBottom: '1.5rem', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b' }}>
                  + Adicionar Nova Chave PIX
                </button>
              )}
            </>
          )}


          {step === 3 && (
            <div className="responsive-grid grid-2">
              <FileUploadField label="Documento Identidade (RG)" required onChange={e => handleFile('rg', e)} fileName={docs.rg?.name} isOk={!!docs.rg} />
              <FileUploadField label="CPF" required onChange={e => handleFile('cpf', e)} fileName={docs.cpf?.name} isOk={!!docs.cpf} />
              <FileUploadField label="Comprovante de Residência" required onChange={e => handleFile('residencia', e)} fileName={docs.residencia?.name} isOk={!!docs.residencia} />
              {isPJ && <FileUploadField label="Cartão CNPJ" required onChange={e => handleFile('cnpj', e)} fileName={docs.cnpj?.name} isOk={!!docs.cnpj} />}
            </div>
          )}

          {isVerifying && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Verifique seu E-mail</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Insira o código enviado para <strong>{formData.email}</strong> para finalizar seu cadastro.
                </p>
                <input 
                  type="text" 
                  maxLength="6"
                  className="input-field"
                  placeholder="000000"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                  value={userCodeInput}
                  onChange={e => setUserCodeInput(e.target.value.replace(/\D/g, ''))}
                />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsVerifying(false)} style={{ flex: 1 }}>Corrigir E-mail</button>
                  <button type="button" className="btn btn-primary" onClick={handleFinalSubmit} disabled={submitting} style={{ flex: 1 }}>
                    {submitting ? 'Validando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
            {step > 0 && (
              <button type="button" className="btn btn-secondary" disabled={submitting} onClick={prevStep} style={{ flex: 1 }}>Voltar</button>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2 }}>
              {submitting ? 'Enviando...' : step === STEPS.length - 1 ? 'Finalizar Cadastro' : 'Próximo Passo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
