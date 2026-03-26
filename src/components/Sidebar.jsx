import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  ClipboardList, 
  DollarSign, 
  FileText,
  TrendingUp,
  Settings
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/colaboradores', icon: <Users size={20} />, label: 'Colaboradores' },
    { path: '/empresas', icon: <Briefcase size={20} />, label: 'Providers' },
    { path: '/projetos', icon: <Briefcase size={20} />, label: 'Projetos' },
    { path: '/operacoes/os', icon: <ClipboardList size={20} />, label: 'Ordens de Serviço' },
    { path: '/operacoes/tecnico', icon: <Users size={20} />, label: 'Tecnico App' },
    { path: '/operacoes/financeiro', icon: <DollarSign size={20} />, label: 'Gerar Fechamento' },
    { path: '/operacoes/aprovacoes', icon: <FileText size={20} />, label: 'Aprovações' },
    { path: '/operacoes/descontos', icon: <Settings size={20} />, label: 'Ajustes' },
    { path: '/operacoes/margem', icon: <TrendingUp size={20} />, label: 'Margem (BI)' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-placeholder">
          Space <span>Gestão</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">RH</div>
          <div className="details">
            <span className="name">Administrador</span>
            <span className="role">RH / Financeiro</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
