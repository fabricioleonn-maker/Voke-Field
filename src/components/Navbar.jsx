import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronDown, Users, Briefcase, LayoutGrid, Award, 
  UserCircle, Folder, Shield, ClipboardList, 
  Smartphone, FileText, CheckCircle, TrendingUp, Settings,
  PieChart, Activity, Bell, User, BarChart3, Clock, DollarSign, Calendar, AlertTriangle, LogOut
} from 'lucide-react';
import { resetDatabase, auth, api } from '../store/db';
import { useToast } from './Toast';
import './Navbar.css';

export default function Navbar() {
  const toast = useToast();
  const [openMenu, setOpenMenu] = useState(null);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [user, setUser] = useState(() => auth.getCurrentUser());

  useEffect(() => {
    const onUserUpdated = () => setUser(auth.getCurrentUser());
    window.addEventListener('user-updated', onUserUpdated);
    return () => window.removeEventListener('user-updated', onUserUpdated);
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu(prev => prev === menu ? null : menu);
  };

  const closeMenu = () => setOpenMenu(null);

  const handleLogout = () => {
    auth.logout();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!user) return;
    const all = await api.notifications.list();
    const mine = all.filter(n => n.userId === user.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    setNotifications(mine);
    setUnreadCount(mine.filter(n => !n.read).length);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Polling cada 30s
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id) => {
    await api.notifications.update(id, { read: true });
    loadNotifications();
  };

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

const gestaoItems = [
    { path: '/colaboradores', icon: <Users size={18} />, label: 'Gestão Colaboradores', roles: ['Administrador', 'Gestor', 'RH'] },
    { path: '/empresas', icon: <Briefcase size={18} />, label: 'Gestão Empresas', roles: ['Administrador', 'Gestor'] },
    { path: '/setores', icon: <LayoutGrid size={18} />, label: 'Gestão de Setores', roles: ['Administrador', 'Gestor', 'RH'] },
    { path: '/cargos', icon: <Award size={18} />, label: 'Gestão de Cargos', roles: ['Administrador', 'Gestor', 'RH'] },
    { path: '/clientes', icon: <UserCircle size={18} />, label: 'Gestão de Clientes', roles: ['Administrador', 'Gestor'] },
    { path: '/projetos', icon: <Folder size={18} />, label: 'Gestão de Projetos', roles: ['Administrador', 'Gestor'] },
    { path: '/usuarios', icon: <Shield size={18} />, label: 'Usuários do Sistema', roles: ['Administrador'] },
  ].filter(item => item.roles.includes(user?.role));

  const operacoesItems = [
    { path: '/operacoes/os', icon: <ClipboardList size={18} />, label: 'Ordens de Serviço', roles: ['Administrador', 'Gestor', 'Financeiro'] },
    { path: '/operacoes/tecnico', icon: <Smartphone size={18} />, label: 'Portal do Técnico', roles: ['Administrador', 'Gestor', 'Técnico'] },
    { path: '/operacoes/fechamentos', icon: <FileText size={18} />, label: 'Gerar Fechamento', roles: ['Administrador', 'Gestor', 'Financeiro'] },
    { path: '/operacoes/aprovacoes', icon: <CheckCircle size={18} />, label: 'Central de Aprovações', roles: ['Administrador', 'Gestor', 'Financeiro'] },
    { path: '/operacoes/acompanhamento', icon: <PieChart size={18} />, label: 'Acompanhamento Diário', roles: ['Administrador', 'Gestor', 'Financeiro', 'Técnico'] },
    { path: '/operacoes/agendamento', icon: <Calendar size={18} />, label: 'Agenda de Equipes', roles: ['Administrador', 'Gestor', 'Financeiro'] },
    { path: '/operacoes/tempo-real', icon: <TrendingUp size={18} />, label: 'Acompanhamento Tempo Real', roles: ['Administrador', 'Gestor'] },
    { path: '/operacoes/descontos', icon: <Settings size={18} />, label: 'Descontos e Adicionais', roles: ['Administrador', 'Gestor', 'Financeiro'] },
  ].filter(item => item.roles.includes(user?.role));

  const dashboardsItems = [
    { path: '/dashboards/executivo', icon: <BarChart3 size={18} />, label: 'Dashboard Executivo', roles: ['Administrador', 'Gestor'] },
    { path: '/dashboards/colaboradores', icon: <Users size={18} />, label: 'Dashboard Colaboradores', roles: ['Administrador', 'Gestor', 'RH'] },
    { path: '/dashboards/financeiro', icon: <DollarSign size={18} />, label: 'Dashboard Financeiro', roles: ['Administrador', 'Gestor', 'Financeiro'] },
    { path: '/dashboards/alertas', icon: <Bell size={18} />, label: 'Dashboard de Alertas', roles: ['Administrador', 'Gestor'] },
    { path: '/operacoes/margem', icon: <TrendingUp size={18} />, label: 'Margem por Projeto (BI)', roles: ['Administrador', 'Gestor'] },
  ].filter(item => item.roles.includes(user?.role));

  const relatoriosItems = [
    { path: '/relatorios/beneficios', icon: <FileText size={18} />, label: 'Relatório de Benefícios', roles: ['Administrador', 'Gestor', 'RH'] },
    { path: '/relatorios/movimentacoes', icon: <Activity size={18} />, label: 'Movimentações de Status', roles: ['Administrador', 'Gestor', 'RH'] },
    { path: '/relatorios/alertas', icon: <Bell size={18} />, label: 'Alertas e Notificações', roles: ['Administrador', 'Gestor', 'RH'] },
    { path: '/relatorios/ponto', icon: <Clock size={18} />, label: 'Folha de Ponto', roles: ['Administrador', 'Gestor', 'RH'] },
    { path: '/relatorios/pagamento', icon: <DollarSign size={18} />, label: 'Folha de Pagamento', roles: ['Administrador', 'Gestor', 'Financeiro'] },
    { path: '/relatorios/ferias', icon: <Calendar size={18} />, label: 'Controle de Férias', roles: ['Administrador', 'Gestor', 'RH'] },
    { path: '/relatorios/auditoria', icon: <Shield size={18} />, label: 'Logs de Auditoria', roles: ['Administrador'] },
  ].filter(item => item.roles.includes(user?.role));

  return (
    <nav className="top-navbar" ref={dropdownRef}>
      <div className="navbar-inner">
        <div className="navbar-logo">
          <Link to="/" className="logo-link">
            SPACE<span>GESTÃO</span>
          </Link>
        </div>

        <div className="navbar-links">
          {/* Dashboards */}
          <div className="nav-dropdown">
            <button 
              className={`nav-btn ${openMenu === 'dashboards' ? 'active' : ''}`}
              onClick={() => toggleMenu('dashboards')}
            >
              <LayoutGrid size={18} /> Dashboards <ChevronDown size={14} className="chevron" />
            </button>
            {openMenu === 'dashboards' && (
              <div className="dropdown-menu">
                {dashboardsItems.map(item => (
                  <Link key={item.path} to={item.path} className="dropdown-item">
                    {item.icon} {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Gestão */}
          <div className="nav-dropdown">
            <button 
              className={`nav-btn ${openMenu === 'gestao' ? 'active' : ''}`}
              onClick={() => toggleMenu('gestao')}
            >
              <Briefcase size={18} /> Gestão <ChevronDown size={14} className="chevron" />
            </button>
            {openMenu === 'gestao' && (
              <div className="dropdown-menu">
                {gestaoItems.map(item => (
                  <Link key={item.path} to={item.path} className="dropdown-item">
                    {item.icon} {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Operações */}
          <div className="nav-dropdown">
            <button 
              className={`nav-btn ${openMenu === 'operacoes' ? 'active' : ''}`}
              onClick={() => toggleMenu('operacoes')}
            >
              <ClipboardList size={18} /> Operações <ChevronDown size={14} className="chevron" />
            </button>
            {openMenu === 'operacoes' && (
              <div className="dropdown-menu">
                {operacoesItems.map(item => (
                  <Link key={item.path} to={item.path} className="dropdown-item">
                    {item.icon} {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>


          {/* Relatórios */}
          <div className="nav-dropdown">
            <button 
              className={`nav-btn ${openMenu === 'relatorios' ? 'active' : ''}`}
              onClick={() => toggleMenu('relatorios')}
            >
              <FileText size={18} /> Relatórios <ChevronDown size={14} className="chevron" />
            </button>
            {openMenu === 'relatorios' && (
              <div className="dropdown-menu">
                {relatoriosItems.map(item => (
                  <Link key={item.path} to={item.path} className="dropdown-item">
                    {item.icon} {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-right">
          {user?.role === 'Administrador' && (
            <button 
              className="icon-btn text-xs" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.25rem 0.6rem', borderRadius: '4px' }}
              title="Apagar todos os dados do sistema temporário"
              onClick={async () => {
                if (await toast.confirm('Tem certeza que deseja apagar TODOS os dados do sistema e começar do zero? Esta ação é irreversível.', 'Zerar Sistema', 'danger')) {
                  resetDatabase();
                }
              }}
            >
              <AlertTriangle size={14} /> Zerar Banco
            </button>
          )}
          <div className="nav-dropdown">
            <button className="icon-btn" onClick={() => toggleMenu('notifications')} style={{ position: 'relative' }}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-5px', 
                  right: '-5px', 
                  backgroundColor: 'var(--danger)', 
                  color: 'white', 
                  fontSize: '0.6rem', 
                  padding: '2px 5px', 
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 0 0 2px var(--bg-card)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {openMenu === 'notifications' && (
              <div className="dropdown-menu" style={{ right: 0, left: 'auto', width: '320px', padding: '0.5rem' }}>
                <div style={{ padding: '0.75rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  Notificações
                  {unreadCount > 0 && <span style={{ color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => notifications.forEach(n => !n.read && markAsRead(n.id))}>Marcar todas como lidas</span>}
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Nenhuma notificação por enquanto.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        style={{ 
                          padding: '1rem', 
                          borderBottom: '1px solid var(--border-color)', 
                          backgroundColor: n.read ? 'transparent' : 'rgba(var(--primary-rgb), 0.05)',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.link) closeMenu();
                        }}
                      >
                        <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="user-pill">
            <Link to="/meu-perfil" className="avatar" style={{ cursor: 'pointer', overflow: 'hidden' }} title="Meu Perfil">
              {user?.foto ? (
                <img src={user.foto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={18}/>
              )}
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="user-name" style={{ fontSize: '0.875rem' }}>{user?.nome || 'Usuário'}</span>
              <span className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>{user?.role}</span>
            </div>
            {user?.role === 'Administrador' && (
              <Link to="/configuracoes" style={{ marginLeft: '1rem', color: 'var(--text-muted)', padding: '0.25rem', display: 'flex', alignItems: 'center' }} title="Perfil da Empresa (Tenant)">
                <Settings size={18} />
              </Link>
            )}
            <button 
              onClick={handleLogout}
              style={{ marginLeft: '0.5rem', color: 'var(--danger)', padding: '0.25rem', display: 'flex', alignItems: 'center' }} 
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
