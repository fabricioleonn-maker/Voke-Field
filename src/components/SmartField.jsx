import React from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

/**
 * Campo inteligente com validação visual em tempo real.
 * Props: label, required, value, onChange, error, loading, success, hint, ...inputProps
 */
export default function SmartField({ label, required, error, loading, success, hint, style, ...inputProps }) {
  const borderColor = error
    ? 'var(--danger, #ef4444)'
    : success
    ? 'var(--success-text, #10b981)'
    : 'var(--border-color)';

  return (
    <div className="input-group" style={style}>
      <label className="input-label">
        {label} {required && <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>}
      </label>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          className="input-field"
          required={required}
          style={{ 
            borderColor, 
            paddingRight: (loading || success || error) ? '2.5rem' : undefined,
            transition: 'all 0.2s ease-in-out',
            boxShadow: error ? '0 0 0 4px rgba(239, 68, 68, 0.1)' : 'none'
          }}
          {...inputProps}
        />
        {loading && (
          <Loader size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        )}
        {!loading && success && (
          <CheckCircle size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--success-text, #10b981)' }} />
        )}
        {!loading && error && (
          <XCircle size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--danger, #ef4444)' }} />
        )}
      </div>
      {error && (
        <span className="error-message" style={{ 
          fontSize: '0.75rem', 
          color: 'var(--danger, #ef4444)', 
          marginTop: '0.35rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem',
          fontWeight: '500'
        }}>
          {error}
        </span>
      )}
      {!error && hint && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>{hint}</span>}
    </div>
  );
}

export function FileUploadField({ label, required, description, accepted, onChange, fileName, isOk }) {
  return (
    <div className="input-group">
      <label className="input-label">
        {label} {required && <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>}
        {description && <span style={{ color: 'var(--warning, #f59e0b)', fontWeight: 600, marginLeft: '0.4rem', fontSize: '0.75rem' }}>{description}</span>}
      </label>
      <label style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem',
        border: `2px dashed ${isOk ? 'var(--success-text, #10b981)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-md)', cursor: 'pointer',
        color: isOk ? 'var(--success-text, #10b981)' : 'var(--text-muted)',
        fontSize: '0.85rem', transition: 'all 0.15s',
        backgroundColor: isOk ? 'rgba(16,185,129,0.05)' : 'transparent'
      }}>
        {isOk ? <CheckCircle size={18} /> : <span>📎</span>}
        <span>{fileName || 'Clique para selecionar arquivo (PDF ou Imagem)'}</span>
        <input type="file" accept={accepted || '.pdf,.jpg,.jpeg,.png'} onChange={onChange} style={{ display: 'none' }} />
      </label>
    </div>
  );
}
