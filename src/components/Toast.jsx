import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, Info, X, AlertTriangle, HelpCircle } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmData, setConfirmData] = useState({ isOpen: false, message: '', title: '', type: 'confirm', onConfirm: null, onCancel: null });

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const confirm = (message, title = 'Confirmação', type = 'confirm') => {
    return new Promise((resolve) => {
      setConfirmData({
        isOpen: true,
        message,
        title,
        type,
        onConfirm: () => {
          setConfirmData(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmData(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ 
      success: (m) => addToast(m, 'success'), 
      error: (m) => addToast(m, 'error'), 
      info: (m) => addToast(m, 'info'),
      confirm
    }}>
      {children}
      
      {confirmData.isOpen && (
        <div className="modal-overlay" style={{ 
          zIndex: 10000, 
          backdropFilter: 'blur(8px)', 
          backgroundColor: 'rgba(0,0,0,0.6)'
        }}>
          <div className="card modal-card" style={{ 
            maxWidth: '440px', 
            textAlign: 'center', 
            padding: '3rem 2rem', 
            borderRadius: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'var(--bg-surface)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle light effect top */}
            <div style={{
              position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
              width: '240px', height: '120px', 
              background: confirmData.type === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(14, 165, 233, 0.15)',
              filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none'
            }} />

            <div style={{ 
              width: '72px', height: '72px', borderRadius: '1rem',
              background: confirmData.type === 'danger' ? 'var(--danger)' : 'var(--primary)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: confirmData.type === 'danger' ? '0 10px 15px -3px rgba(239, 68, 68, 0.3)' : '0 10px 15px -3px rgba(14, 165, 233, 0.3)',
              transform: 'rotate(-4deg)',
              animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              {confirmData.type === 'danger' ? <AlertTriangle size={36} /> : <HelpCircle size={36} />}
            </div>
            
            <h3 className="text-h2" style={{ marginBottom: '0.75rem', fontSize: '1.6rem', fontWeight: 700 }}>{confirmData.title}</h3>
            <p className="text-muted" style={{ marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '1.1rem' }}>{confirmData.message}</p>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              {confirmData.type !== 'alert' && (
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.875rem', borderRadius: '0.75rem', fontWeight: 600 }} 
                  onClick={confirmData.onCancel}
                >
                  Cancelar
                </button>
              )}
              <button 
                className="btn btn-primary" 
                style={{ 
                  flex: 1, 
                  padding: '0.875rem',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  background: confirmData.type === 'danger' ? 'var(--danger)' : 'var(--primary)',
                }} 
                onClick={confirmData.onConfirm}
              >
                {confirmData.type === 'alert' ? 'Entendido' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <div style={{ marginTop: '0.125rem' }}>
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'error' && <XCircle size={20} />}
              {toast.type === 'info' && <Info size={20} />}
            </div>
            <div className="toast-content">{toast.message}</div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
