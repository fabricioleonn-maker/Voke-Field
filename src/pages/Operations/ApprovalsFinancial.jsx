import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { Check, X, CreditCard, FileText, Download, Clock } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { getBrasiliaISO, getBrasiliaDate } from '../../utils/time';

export default function ApprovalsFinancial() {
  const toast = useToast();
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.closings.list();
      // Mostramos fechamentos em duas fases:
      // 1. 'Pendente' (Financeiro precisa provisionar/aprovar valores para o técnico emitir NF)
      // 2. 'A Pagar' (Fiscal já aprovou a NF, agora é hora de pagar)
      setClosings(data.filter(c => ['Pendente', 'A Pagar'].includes(c.status)));
    } catch (error) {
      console.error('Error loading closings:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveProvision = async (closing) => {
    if (await toast.confirm(`Aprovar provisionamento de ${formatCurrency(closing.total)}? O técnico será notificado para emitir a NF.`, 'Confirmar Provisão')) {
      await api.closings.update(closing.id, { 
        ...closing, 
        status: 'Aguardando NF',
        provisionedAt: getBrasiliaISO()
      });
      toast.success('Fechamento aprovado! Aguardando o técnico anexar a Nota Fiscal.');
      loadData();
    }
  };

  const handleFinalizePayment = async (closing) => {
    if (await toast.confirm(`Confirmar que o pagamento de ${formatCurrency(closing.total)} para ${closing.provider} foi EFETUADO?`, 'Confirmar Pagamento')) {
      await api.closings.update(closing.id, { 
        ...closing, 
        status: 'Pago',
        paidAt: getBrasiliaISO()
      });

      // Encerrar todas as OS vinculadas de forma atômica
      const allOS = await api.os.list();
      const linkedOS = allOS.filter(os => os.closing_id === closing.id);
      
      for (const os of linkedOS) {
        await api.os.update(os.id, { 
          ...os, 
          status: 'Encerrado',
          paidAt: getBrasiliaISO()
        });
      }

      toast.success(`Pagamento finalizado! ${linkedOS.length} OSs foram marcadas como 'Encerrado'.`);
      loadData();
    }
  };

  const handleReject = async (closing) => {
    const reason = window.prompt('Motivo da rejeição pelo Financeiro:');
    if (reason) {
      // Se rejeitar um fechamento, ele volta a ser OS 'Concluído' para ser corrigido ou re-gerado
      await api.closings.delete(closing.id);
      
      const allOS = await api.os.list();
      const linkedOS = allOS.filter(os => os.closing_id === closing.id);
      for (const os of linkedOS) {
        await api.os.update(os.id, { 
          ...os, 
          status: 'Concluído', 
          closing_id: null,
          rejectionReason: `Financeiro: ${reason}`
        });
      }
      toast.warning('Fechamento excluído e OSs devolvidas para a fila de Concluído.');
      loadData();
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando fluxos financeiros...</div>;

  return (
    <div className="card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="text-h3">Gestão Financeira</h2>
        <p className="text-muted">Aprovação de provisões (pré-NF) e confirmação de pagamentos efetuados (pós-Fiscal).</p>
      </div>

      {closings.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Clock size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          <p>Nenhuma pendência financeira no momento.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Fechamento</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Favoritado / Prestador</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Valor</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status / Etapa</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {closings.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{c.period || `${c.month}/${c.year}`}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Criado em: {getBrasiliaDate(new Date(c.date)).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{c.provider || c.provider_name}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(c.total)}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${c.status === 'Pendente' ? 'badge-warning' : 'badge-danger'}`}>
                      {c.status === 'Pendente' ? 'Provisionar' : 'Aguardando Pagto'}
                    </span>
                    {c.nf_url && (
                        <div style={{ marginTop: '0.25rem' }}>
                            <a href={c.nf_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Download size={12}/> Baixar NF
                            </a>
                        </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {c.status === 'Pendente' ? (
                        <button onClick={() => handleApproveProvision(c)} className="btn btn-primary btn-sm" style={{ padding: '0.4rem 0.8rem' }}>
                          Aprovar Valor
                        </button>
                      ) : (
                        <button onClick={() => handleFinalizePayment(c)} className="btn btn-success btn-sm" style={{ padding: '0.4rem 0.8rem', backgroundColor: '#10b981' }}>
                          Confirmar Pagto
                        </button>
                      )}
                      <button onClick={() => handleReject(c)} className="btn btn-danger btn-sm" style={{ padding: '0.5rem' }}>
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
