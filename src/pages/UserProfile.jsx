import React, { useState, useEffect } from 'react';
import { Save, UserCircle, Upload } from 'lucide-react';
import { api, auth } from '../store/db';
import SmartField from '../components/SmartField';
import { useToast } from '../components/Toast';

export default function UserProfile() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', email: '', novaSenha: '', confirmacaoSenha: '', foto: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);
    setFormData({
      nome: currentUser.nome || '',
      email: currentUser.email || '',
      novaSenha: '',
      confirmacaoSenha: '',
      foto: currentUser.foto || ''
    });
    setLoading(false);
  };

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));
  
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Limits size to ~2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      set('foto', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.nome) newErrors.nome = 'Nome é obrigatório.';
    if (!formData.email) newErrors.email = 'Email obrigatório.';
    
    if (formData.novaSenha) {
      if (formData.novaSenha.length < 5) newErrors.novaSenha = 'A senha deve ter pelo menos 5 caracteres.';
      if (formData.novaSenha !== formData.confirmacaoSenha) newErrors.confirmacaoSenha = 'As senhas não conferem.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        foto: formData.foto
      };
      
      if (formData.novaSenha) {
        payload.password = formData.novaSenha;
      }

      await api.users.update(user.id, payload);
      
      const updatedUser = { ...user, ...payload };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      
      toast.success('Perfil atualizado com sucesso!');
      window.dispatchEvent(new Event('user-updated'));
      
      setFormData(f => ({ ...f, novaSenha: '', confirmacaoSenha: '' }));
    } catch (err) {
      toast.error('Erro ao atualizar perfil.');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando perfil...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Meu Perfil</h1>
          <p className="text-muted">Gerencie suas informações pessoais, senha e foto de perfil.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '50%', 
              backgroundColor: 'var(--bg-color)', border: '2px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', marginBottom: '1rem', position: 'relative'
            }}>
              {formData.foto ? (
                <img src={formData.foto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserCircle size={64} color="var(--text-muted)" />
              )}
            </div>
            
            <div>
              <input 
                type="file" 
                id="photo-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handlePhotoUpload}
              />
              <label 
                htmlFor="photo-upload" 
                className="btn btn-secondary text-sm" 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Upload size={16} /> Alterar Foto
              </label>
            </div>
            {formData.foto && (
              <button 
                type="button" 
                className="text-danger text-sm" 
                style={{ background: 'none', border: 'none', marginTop: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => set('foto', '')}
              >
                Remover foto
              </button>
            )}
          </div>

          <h3 className="form-section-title">Dados Pessoais</h3>
          <SmartField label="Nome Completo" required value={formData.nome} onChange={e => set('nome', e.target.value)} error={errors.nome} />
          <SmartField label="Email" type="email" required value={formData.email} onChange={e => set('email', e.target.value)} error={errors.email} />

          <h3 className="form-section-title" style={{ marginTop: '2rem' }}>Alterar Senha</h3>
          <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>Deixe em branco se não quiser alterar sua senha atual.</p>
          <div className="responsive-grid grid-2">
            <SmartField type="password" label="Nova Senha" value={formData.novaSenha} onChange={e => set('novaSenha', e.target.value)} error={errors.novaSenha} />
            <SmartField type="password" label="Confirmar Senha" value={formData.confirmacaoSenha} onChange={e => set('confirmacaoSenha', e.target.value)} error={errors.confirmacaoSenha} />
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
