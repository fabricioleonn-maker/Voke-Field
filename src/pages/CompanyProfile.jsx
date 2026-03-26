import React, { useState, useEffect } from 'react';
import { Save, Building2 } from 'lucide-react';
import { api } from '../store/db';
import SmartField from '../components/SmartField';
import { useToast } from '../components/Toast';
import { fetchCNPJ, formatCNPJ, formatPhone, formatCEP, fetchCEP, validateCNPJ, validateEmail } from '../hooks/useSmartForm';

export default function CompanyProfile() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tenantName: '', razaoSocial: '', cnpj: '', email: '', telefone: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: ''
  });
  const [errors, setErrors] = useState({});
  const [loadingField, setLoadingField] = useState({});

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));
  const setErr = (k, v) => setErrors(e => ({ ...e, [k]: v }));
  const setLd = (k, v) => setLoadingField(l => ({ ...l, [k]: v }));

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const data = await api.settings.get();
    setFormData(data);
    setLoading(false);
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
          tenantName: f.tenantName || data.razaoSocial.split(' ')[0],
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.tenantName) newErrors.tenantName = 'Nome Fantasia é obrigatório.';
    if (!formData.razaoSocial) newErrors.razaoSocial = 'Razão Social obrigatória.';
    if (!formData.cnpj || !validateCNPJ(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido ou obrigatório.';
    if (formData.email && !validateEmail(formData.email)) newErrors.email = 'Email inválido.';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    try {
      await api.settings.update(formData);
      toast.success('Perfil da empresa atualizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar perfil.');
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando dados da empresa...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Perfil da Empresa</h1>
          <p className="text-muted">Gerencie os dados oficiais e a identidade visual do sistema (Tenant).</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={32} />
            </div>
            <div>
              <h2 className="text-h3" style={{ margin: 0 }}>Identidade e Cadastro</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>O nome definido aqui (Nome Fantasia / Tenant) será utilizado em todo o sistema.</p>
            </div>
          </div>

          <h3 className="form-section-title">Identificação</h3>
          <div className="responsive-grid grid-2">
            <SmartField label="CNPJ" required value={formData.cnpj} onChange={e => handleCNPJ(e.target.value)} loading={loadingField.cnpj} error={errors.cnpj} />
            <SmartField 
              label="Nome Fantasia" 
              required 
              value={formData.tenantName} 
              onChange={e => set('tenantName', e.target.value)} 
              error={errors.tenantName} 
              hint="Ex: SPACE (Este nome aparecerá para os clientes)"
            />
          </div>
          <SmartField label="Razão Social" required value={formData.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} error={errors.razaoSocial} />
          <div className="responsive-grid grid-2">
            <SmartField label="Email" type="email" value={formData.email} onChange={e => set('email', e.target.value)} error={errors.email} />
            <SmartField label="Telefone" value={formData.telefone} onChange={e => set('telefone', formatPhone(e.target.value))} error={errors.telefone} />
          </div>

          <h3 className="form-section-title">Sede Administrativa</h3>
          <div className="responsive-grid grid-address-full">
            <SmartField label="CEP" value={formData.cep} onChange={e => handleCEP(e.target.value)} loading={loadingField.cep} error={errors.cep} />
            <SmartField label="Logradouro" value={formData.logradouro} onChange={e => set('logradouro', e.target.value)} error={errors.logradouro} />
            <SmartField label="Número" value={formData.numero} onChange={e => set('numero', e.target.value)} error={errors.numero} />
          </div>
          <div className="responsive-grid grid-2">
            <SmartField label="Complemento" value={formData.complemento} onChange={e => set('complemento', e.target.value)} />
            <SmartField label="Bairro" value={formData.bairro} onChange={e => set('bairro', e.target.value)} error={errors.bairro} />
          </div>
          <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 70px' }}>
            <SmartField label="Cidade" value={formData.cidade} onChange={e => set('cidade', e.target.value)} error={errors.cidade} />
            <SmartField label="UF" value={formData.estado} onChange={e => set('estado', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} error={errors.estado} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
