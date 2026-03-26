import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { Check, X, FileText, Download } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { getBrasiliaISO } from '../../utils/time';

export default function ApprovalsFiscal() {
  const toast = useToast();
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.closings.list();
      // Filtramos fechamentos que aguardam aprovação de NF
      setClosings(data.filter(c => c.status === 'Aprovar NF'));
    } catch (error) {
      console.error('Error loading closings:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (closing) => {
    if (await toast.confirm(`Confirmar aprovação da NF do fechamento ${closing.period}?`)) {
      await api.closings.update(closing.id, { 
        ...closing, 
        status: 'A Pagar',
        approvedAt: getBrasiliaISO(),
        approvedBy: 'Fiscal'
      });
      toast.success('NF Aprovada com sucesso! O fechamento seguiu para o Financeiro (A Pagar).');
      loadData();
    }
  };

  const handleReject = async (closing) => {
    const reason = window.prompt('Motivo da recusa da NF:');
    if (reason) {
      await api.closings.update(closing.id, { 
        ...closing, 
        status: 'Aguardando NF', 
        nf_url: null,
        rejectionReason: reason,
        rejectedAt: getBrasiliaISO(),
        rejectedBy: 'Fiscal'
      });
      toast.warning('NF Recusada. O técnico será notificado para reanexar.');
      loadData();
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando fechamentos para conferência fiscal...</div>;

  return (
    <div className="card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="text-h3">Conferência Fiscal</h2>
        <p className="text-muted">Valide as Notas Fiscais anexadas pelos técnicos após o fechamento do período.</p>
      </div>

      {closings.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          <p>Nenhuma Nota Fiscal aguardando aprovação.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Período</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Colaborador</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Total Repasse</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nota Fiscal</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {closings.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{c.period}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ref: {c.os_ids?.length || 0} OSs</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{c.collaborator_name}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(c.total_value)}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {c.nf_url ? (
                      <a href={c.nf_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download size={14} /> Ver NF
                      </a>
                    ) : (
                      <span className="text-danger" style={{ fontSize: '0.85rem' }}>Erro: NF não encontrada</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleApprove(c)} className="btn btn-success btn-sm" style={{ padding: '0.5rem' }} title="Aprovar NF">
                        <Check size={18} />
                      </button>
                      <button onClick={() => handleReject(c)} className="btn btn-danger btn-sm" style={{ padding: '0.5rem' }} title="Recusar NF">
                        <X size={18} />
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
  );
}
