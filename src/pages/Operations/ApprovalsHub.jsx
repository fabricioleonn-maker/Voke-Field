import React, { useState } from 'react';
import { UserCheck, FileText, CreditCard } from 'lucide-react';
import ApprovalsOps from './ApprovalsOps';
import ApprovalsFiscal from './ApprovalsFiscal';
import ApprovalsFinancial from './ApprovalsFinancial';
import ApprovalsHistory from './ApprovalsHistory';
import { History } from 'lucide-react';

export default function ApprovalsHub() {
  const [activeTab, setActiveTab] = useState('operacoes');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Central de Aprovações</h1>
          <p className="text-muted">Acompanhe as filas de validação operacional, notas fiscais e liberação de pagamentos.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0' }}>
        <button 
          onClick={() => setActiveTab('operacoes')}
          style={{ 
            padding: '0.75rem 0', 
            background: 'none', 
            border: 'none', 
            fontSize: '1rem', 
            fontWeight: 600, 
            color: activeTab === 'operacoes' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'operacoes' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <UserCheck size={18}/> Operações
        </button>
        <button 
          onClick={() => setActiveTab('fiscal')}
          style={{ 
            padding: '0.75rem 0', 
            background: 'none', 
            border: 'none', 
            fontSize: '1rem', 
            fontWeight: 600, 
            color: activeTab === 'fiscal' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'fiscal' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <FileText size={18}/> Fiscal
        </button>
        <button 
          onClick={() => setActiveTab('financeiro')}
          style={{ 
            padding: '0.75rem 0', 
            background: 'none', 
            border: 'none', 
            fontSize: '1rem', 
            fontWeight: 600, 
            color: activeTab === 'financeiro' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'financeiro' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <CreditCard size={18}/> Financeiro
        </button>
        <button 
          onClick={() => setActiveTab('historico')}
          style={{ 
            padding: '0.75rem 0', 
            background: 'none', 
            border: 'none', 
            fontSize: '1rem', 
            fontWeight: 600, 
            color: activeTab === 'historico' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'historico' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <History size={18}/> Histórico
        </button>
      </div>

      <div className="card">
        {activeTab === 'operacoes' && <ApprovalsOps />}
        {activeTab === 'fiscal' && <ApprovalsFiscal />}
        {activeTab === 'financeiro' && <ApprovalsFinancial />}
        {activeTab === 'historico' && <ApprovalsHistory />}
      </div>
    </div>
  );
}
