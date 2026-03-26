import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Edit2, Trash2, X, Search, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { api, auth } from '../store/db';
import { useToast } from '../components/Toast';

const ROLES = ['Administrador', 'Gestor', 'RH', 'Financeiro', 'Técnico'];

export default function Users() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const currentUser = auth.getCurrentUser();
  const isAdmin = currentUser?.email === 'admin@voke.com.br';

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'Técnico',
    status: 'Ativo'
  });

  const loadUsers = async () => {
    setLoading(true);
    const data = await api.users.list();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openModal = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        nome: user.nome,
        email: user.email,
        password: user.password,
        role: user.role,
        status: user.status
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: '',
        email: '',
        password: '',
        role: 'Técnico',
        status: 'Ativo'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.users.update(editingId, formData);
    } else {
      await api.users.create(formData);
    }
    closeModal();
    loadUsers();
  };

  const handleDelete = async (user) => {
    if (user.email === 'admin@voke.com.br') {
      await toast.confirm('O administrador principal não pode ser excluído.', 'Ação Negada', 'alert');
      return;
    }
    
    if (!isFabricio && currentUser?.role !== 'Administrador') {
      await toast.confirm('Você não tem permissão para excluir usuários.', 'Sem Permissão', 'alert');
      return;
    }

    if (await toast.confirm(`Tem certeza que deseja excluir o usuário ${user.nome}?`, 'Excluir Usuário', 'danger')) {
      await api.users.delete(user.id);
      loadUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Usuários do Sistema</h1>
          <p className="text-muted">Gerencie quem tem acesso ao painel de controle e quais suas permissões.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <UserPlus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
          <div className="input-group" style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            background: 'var(--bg-main)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-md)', 
            padding: '0.25rem 0.75rem',
            margin: 0
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por nome, email ou perfil..." 
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '0.5rem', outline: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Carregando usuários...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nome / E-mail</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Perfil</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 500 }}>{user.nome}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className={`badge ${user.role === 'Administrador' ? 'badge-primary' : user.role === 'Gestor' ? 'badge-info' : 'badge-neutral'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className="badge badge-success" style={{ backgroundColor: user.status === 'Ativo' ? '' : '#fee2e2', color: user.status === 'Ativo' ? '' : '#ef4444' }}>
                        {user.status}
                      </span>
                      {user.verified === false && (
                        <span className="badge" style={{ marginLeft: '0.5rem', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem' }}>
                          Pendente E-mail
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => openModal(user)} style={{ color: 'var(--primary)', padding: '0.25rem' }}>
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user)} 
                          style={{ color: user.email === 'admin@voke.com.br' ? '#cbd5e1' : 'var(--danger)', padding: '0.25rem' }}
                          disabled={user.email === 'admin@voke.com.br'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 className="text-h3" style={{ marginBottom: '1.5rem' }}>
              {editingId ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Nome Completo *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>

              <div className="input-group">
                <label className="input-label">E-mail *</label>
                <input 
                  type="email" 
                  className="input-field" 
                  required 
                  disabled={formData.email === 'admin@voke.com.br'}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Senha *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="input-field" 
                    required 
                    style={{ paddingRight: '2.5rem', marginBottom: 0 }}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Perfil de Acesso *</label>
                <select 
                  className="input-field"
                  disabled={formData.email === 'admin@voke.com.br'}
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Status</label>
                <select 
                  className="input-field"
                  disabled={formData.email === 'admin@voke.com.br'}
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
