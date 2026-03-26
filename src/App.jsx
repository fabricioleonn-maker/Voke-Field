import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Gestão
import Collaborators from './pages/Collaborators';
import Providers from './pages/Providers';
import Departments from './pages/Departments';
import Positions from './pages/Positions';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Users from './pages/Users';
import CompanyProfile from './pages/CompanyProfile';
import UserProfile from './pages/UserProfile';
// import Services from './pages/Services';

// Relatórios
import ExecDashboard from './pages/Dashboards/ExecDashboard';
import ColabDashboard from './pages/Dashboards/ColabDashboard';
import FinanceiroDashboard from './pages/Dashboards/FinanceiroDashboard';
import AlertsDashboard from './pages/Dashboards/AlertsDashboard';
import BenefitsReport from './pages/BenefitsReport';
import StatusMovements from './pages/StatusMovements';
import Alerts from './pages/Alerts';
import Timesheet from './pages/Timesheet';
import Payroll from './pages/Payroll';
import VacationControl from './pages/VacationControl';
import AuditLogs from './pages/AuditLogs';

// Operações
import FinanceDashboard from './pages/Operations/FinanceDashboard';
import OSDashboard from './pages/Operations/OSDashboard';
import OSCtrl from './pages/Operations/OSCtrl';
import CreateOS from './pages/Operations/CreateOS';
import TechnicianApp from './pages/Operations/TechnicianApp';
import GenerateClosing from './pages/Operations/GenerateClosing';
import ApprovalsHub from './pages/Operations/ApprovalsHub';
import DailyTracking from './pages/Operations/DailyTracking';
import Scheduling from './pages/Operations/Scheduling';
import RealTimeTracking from './pages/Operations/RealTimeTracking';
import Adjustments from './pages/Operations/Adjustments';
import StatementsReport from './pages/Operations/StatementsReport';
import PaymentSlip from './pages/Operations/PaymentSlip';
import ProjectMargin from './pages/Operations/ProjectMargin';

import PublicRegistrationForm from './pages/PublicRegistrationForm';
import PublicProviderForm from './pages/PublicProviderForm';
import ServiceOrders from './pages/ServiceOrders';
import Login from './pages/Login';

import { ToastProvider } from './components/Toast';
import { auth } from './store/db';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = auth.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota pública - sem layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/formulario-colaborador" element={<PublicRegistrationForm />} />
          <Route path="/formulario-empresa" element={<PublicProviderForm />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="meu-perfil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            {/* Dashboards - Restricted to Management/RH/Fin */}
            <Route index element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'RH', 'Financeiro']}><ExecDashboard /></ProtectedRoute>} />
            <Route path="dashboards">
              <Route path="executivo" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor']}><ExecDashboard /></ProtectedRoute>} />
              <Route path="colaboradores" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'RH']}><ColabDashboard /></ProtectedRoute>} />
              <Route path="financeiro" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro']}><FinanceiroDashboard /></ProtectedRoute>} />
              <Route path="alertas" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor']}><AlertsDashboard /></ProtectedRoute>} />
            </Route>

            {/* Gestão - Management and RH only */}
            <Route path="colaboradores" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'RH']}><Collaborators /></ProtectedRoute>} />
            <Route path="empresas" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor']}><Providers /></ProtectedRoute>} />
            <Route path="setores" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'RH']}><Departments /></ProtectedRoute>} />
            <Route path="cargos" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'RH']}><Positions /></ProtectedRoute>} />
            <Route path="clientes" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor']}><Clients /></ProtectedRoute>} />
            <Route path="projetos" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor']}><Projects /></ProtectedRoute>} />
            <Route path="usuarios" element={<ProtectedRoute allowedRoles={['Administrador']}><Users /></ProtectedRoute>} />
            <Route path="configuracoes" element={<ProtectedRoute allowedRoles={['Administrador']}><CompanyProfile /></ProtectedRoute>} />
            {/* <Route path="servicos" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor']}><Services /></ProtectedRoute>} /> */}

            {/* Relatórios - Role based */}
            <Route path="relatorios">
              <Route path="beneficios" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'RH']}><BenefitsReport /></ProtectedRoute>} />
              <Route path="movimentacoes" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'RH']}><StatusMovements /></ProtectedRoute>} />
              <Route path="alertas" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'RH']}><Alerts /></ProtectedRoute>} />
              <Route path="ponto" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'RH']}><Timesheet /></ProtectedRoute>} />
              <Route path="pagamento" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro']}><Payroll /></ProtectedRoute>} />
              <Route path="ferias" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'RH']}><VacationControl /></ProtectedRoute>} />
              <Route path="auditoria" element={<ProtectedRoute allowedRoles={['Administrador']}><AuditLogs /></ProtectedRoute>} />
            </Route>

            {/* Operações */}
            <Route path="operacoes">
              <Route index element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro']}><FinanceDashboard /></ProtectedRoute>} />
              <Route path="dashboard-os" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro']}><OSDashboard /></ProtectedRoute>} />
                <Route path="os" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro']}><OSCtrl /></ProtectedRoute>} />
                <Route path="os/novo" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro']}><CreateOS /></ProtectedRoute>} />
                <Route path="tecnico" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Técnico']}><TechnicianApp /></ProtectedRoute>} />
                <Route path="fechamentos" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro']}><GenerateClosing /></ProtectedRoute>} />
              <Route path="aprovacoes" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro']}><ApprovalsHub /></ProtectedRoute>} />
              <Route path="acompanhamento" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro', 'Técnico']}><DailyTracking /></ProtectedRoute>} />
              <Route path="agendamento" element={<Scheduling />} />
              <Route path="tempo-real" element={<RealTimeTracking />} />
              <Route path="descontos" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro']}><Adjustments /></ProtectedRoute>} />
              <Route path="demonstrativo" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro', 'Técnico']}><StatementsReport /></ProtectedRoute>} />
              <Route path="demonstrativo/:id" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor', 'Financeiro', 'Técnico']}><PaymentSlip /></ProtectedRoute>} />
              <Route path="margem" element={<ProtectedRoute allowedRoles={['Administrador', 'Gestor']}><ProjectMargin /></ProtectedRoute>} />
            </Route>

            {/* Legacy */}
            <Route path="os" element={<ServiceOrders />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
