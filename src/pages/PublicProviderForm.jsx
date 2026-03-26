import React, { useState, useEffect } from 'react';
import { api } from '../store/db';
import SmartField, { FileUploadField } from '../components/SmartField';
import {
  formatCNPJ, formatPhone, formatCEP, onlyNumbers,
  validateCNPJ, validateEmail, validatePix, validatePhone,
  fetchCEP, fetchCNPJ, lookupBank
} from '../hooks/useSmartForm';
import { CheckCircle, Building2, ChevronRight, Copy } from 'lucide-react';
import { useToast } from '../components/Toast';

const STEPS = ['Identificação', 'Endereço', 'Dados Bancários/Pix', 'Documentos'];

const emptyForm = {
  razaoSocial: '', nomeFantasia: '', cnpj: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  telefone: '', email: '',
  codigoBanco: '', nomeBanco: '', agencia: '', conta: '',
  pixKeys: [{ tipo: '', chave: '' }],
  observacoes: ''
};

export default function PublicProviderForm() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loadingField, setLoadingField] = useState({});
  const [docs, setDocs] = useState({ cartaoCNPJ: null, contratoSocial: null, comprovanteEndereco: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));
  const setErr = (key, val) => setErrors(e => ({ ...e, [key]: val }));
  const setLd = (key, val) => setLoadingField(l => ({ ...l, [key]: val }));

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

  const updatePixKey = (index, field, value) => {
    const newKeys = [...formData.pixKeys];
    newKeys[index][field] = value;

    if (field === 'tipo') {
      let val = '';
      if (value === 'cnpj') val = formData.cnpj;
      else if (value === 'email') val = formData.email;
      else if (value === 'celular') val = formData.telefone;
      newKeys[index].chave = val;
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

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.cnpj || !validateCNPJ(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido.';
      if (!formData.razaoSocial || formData.razaoSocial.trim().split(/\s+/).length < 2) 
        newErrors.razaoSocial = 'Digite a Razão Social completa (mín. 2 nomes).';
      if (!formData.email || !validateEmail(formData.email)) newErrors.email = 'E-mail inválido.';
      if (!formData.telefone || !validatePhone(formData.telefone)) newErrors.telefone = 'Telefone inválido.';
    }
    if (step === 1) {
      if (!formData.cep) newErrors.cep = 'CEP obrigatório.';
      if (!formData.logradouro) newErrors.logradouro = 'Logradouro obrigatório.';
      if (!formData.bairro) newErrors.bairro = 'Bairro obrigatório.';
      if (!formData.cidade) newErrors.cidade = 'Cidade obrigatória.';
    }
    if (step === 2) {
      if (!formData.codigoBanco) newErrors.codigoBanco = 'Banco obrigatório.';
      
      formData.pixKeys.forEach((pk, idx) => {
        if (!pk.tipo) newErrors[`pixKeys_${idx}_tipo`] = 'Tipo obrigatório.';
        if (!pk.chave) newErrors[`pixKeys_${idx}_chave`] = 'Chave obrigatória.';
        else if (!validatePix(pk.tipo, pk.chave)) newErrors[`pixKeys_${idx}_chave`] = 'Pix inválido.';
      });
    }
    if (step === 3) {
      if (!docs.cartaoCNPJ) newErrors.cartaoCNPJ = 'Anexo do Cartão CNPJ é obrigatório.';
      if (!docs.contratoSocial) newErrors.contratoSocial = 'Anexo do Contrato Social é obrigatório.';
      if (!docs.comprovanteEndereco) newErrors.comprovanteEndereco = 'Comprovante de Endereço é obrigatório.';

      if (Object.keys(newErrors).length > 0) {
        toast.error('Por favor, anexe todos os documentos obrigatórios antes de finalizar.');
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await api.providers.create({
        ...formData,
        status: 'Em Análise',
        documentos: docs,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('lastCreatedProviderCNPJ', formData.cnpj);
      setSubmitted(true);
      toast.success('Cadastro enviado com sucesso!');
    } catch (err) {
      toast.error('Erro ao enviar o cadastro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFromColab = new URLSearchParams(window.location.search).get('source') === 'colab';

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Cadastro Enviado!</h2>
          <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
            Seus dados foram recebidos com sucesso. {isFromColab ? 'Você já pode fechar esta aba e continuar o seu cadastro de colaborador na aba anterior.' : 'Você já pode fechar esta página.'}
          </p>
          <button onClick={() => window.close()} className="btn btn-primary" style={{ width: '100%' }}>Fechar Página</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
       <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Building2 size={32} color="#3b82f6" />
          <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 700 }}>Space Soluções</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Cadastro de Empresa Parceira / Prestadora</p>
      </div>

      <div className="stepper-container">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{
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
              <SmartField label="CNPJ" required value={formData.cnpj} onChange={e => handleCNPJ(e.target.value)} loading={loadingField.cnpj} error={errors.cnpj} />
              <SmartField label="Razão Social" required value={formData.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} error={errors.razaoSocial} />
              <SmartField label="Nome Fantasia" value={formData.nomeFantasia} onChange={e => set('nomeFantasia', e.target.value)} />
              <div className="responsive-grid grid-2">
                <SmartField label="E-mail" type="email" required value={formData.email} onChange={e => set('email', e.target.value)} error={errors.email} />
                <SmartField label="Telefone" required value={formData.telefone} onChange={e => set('telefone', formatPhone(e.target.value))} error={errors.telefone} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="responsive-grid grid-2" style={{ gridTemplateColumns: '160px 1fr' }}>
                <SmartField label="CEP" required value={formData.cep} onChange={e => handleCEP(e.target.value)} loading={loadingField.cep} error={errors.cep} />
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
              <div className="responsive-grid grid-cep">
                <SmartField label="Cód. Banco" required value={formData.codigoBanco} onChange={e => handleBanco(e.target.value)} maxLength={3} hint={formData.nomeBanco} error={errors.codigoBanco} />
                <SmartField label="Banco" value={formData.nomeBanco} readOnly style={{ opacity: 0.7 }} />
              </div>
              <div className="responsive-grid grid-2">
                <SmartField label="Agência" required value={formData.agencia} onChange={e => set('agencia', onlyNumbers(e.target.value))} error={errors.agencia} />
                <SmartField label="Conta Corrente" required value={formData.conta} onChange={e => set('conta', e.target.value)} error={errors.conta} />
              </div>
              {formData.pixKeys.map((pk, idx) => (
                <div key={idx} className="responsive-grid grid-2" style={{ gridTemplateColumns: '180px 1fr', position: 'relative', marginBottom: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Tipo PIX {idx + 1}</label>
                    <select className="input-field" value={pk.tipo} onChange={e => updatePixKey(idx, 'tipo', e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="celular">Celular</option>
                      <option value="aleatoria">Chave Aleatória</option>
                    </select>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <SmartField 
                      label={`Chave PIX ${idx + 1}`} 
                      value={pk.chave} 
                      onChange={e => {
                        let val = e.target.value;
                        if (pk.tipo === 'cnpj') val = formatCNPJ(val);
                        else if (pk.tipo === 'celular') val = formatPhone(val);
                        updatePixKey(idx, 'chave', val);
                      }} 
                      error={errors[`pixKeys_${idx}_chave`]}
                    />
                    {idx > 0 && (
                      <button type="button" onClick={() => removePixKey(idx)} style={{ position: 'absolute', right: -30, top: 40, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>×</button>
                    )}
                  </div>
                </div>
              ))}

              <button type="button" onClick={addPixKey} className="btn btn-secondary" style={{ width: '100%', marginBottom: '1.5rem', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b' }}>
                + Adicionar Nova Chave PIX
              </button>
            </>
          )}

          {step === 3 && (
            <div className="responsive-grid grid-2">
              <FileUploadField label="Cartão CNPJ" required onChange={e => handleFile('cartaoCNPJ', e)} fileName={docs.cartaoCNPJ?.name} isOk={!!docs.cartaoCNPJ} />
              <FileUploadField label="Contrato Social" required onChange={e => handleFile('contratoSocial', e)} fileName={docs.contratoSocial?.name} isOk={!!docs.contratoSocial} />
              <FileUploadField label="Comprovante Endereço" required onChange={e => handleFile('comprovanteEndereco', e)} fileName={docs.comprovanteEndereco?.name} isOk={!!docs.comprovanteEndereco} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
            <button type="button" onClick={prevStep} disabled={step === 0} className="btn btn-secondary" style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>Voltar</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Enviando...' : step < STEPS.length - 1 ? 'Próximo Passo' : 'Finalizar Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
