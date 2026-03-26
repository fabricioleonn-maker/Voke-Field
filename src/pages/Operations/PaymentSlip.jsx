import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../store/db';
import { Printer, ArrowLeft, Download } from 'lucide-react';

export default function PaymentSlip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [closings, allOs, allColabs, allAdjs] = await Promise.all([
      api.closings.list(),
      api.os.list(),
      api.collaborators.list(),
      api.adjustments?.list() || Promise.resolve([])
    ]);

    const closing = closings.find(c => c.id === id);
    if (!closing) {
      setLoading(false);
      return;
    }

    const linkedOs = allOs.filter(os => os.closing_id === id);
    const linkedAdjs = allAdjs.filter(a => a.closing_id === id);
    
    // Find the primary collaborator name for display
    let colabName = closing.provider;
    if (closing.collaboratorId) {
      const c = allColabs.find(x => x.id === closing.collaboratorId);
      if (c) colabName = c.nome;
    }

    setData({
      closing,
      os: linkedOs,
      adjustments: linkedAdjs,
      recipient: colabName
    });
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) return <div className="p-8 text-center">Gerando demonstrativo...</div>;
  if (!data) return <div className="p-8 text-center text-danger">Erro: Fechamento não encontrado.</div>;

  const { closing, os, adjustments, recipient } = data;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }} className="print-container">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={18} /> Imprimir / PDF
        </button>
      </div>

      <div id="payment-slip" style={{ background: 'white', padding: '3rem', border: '1px solid #ddd', minHeight: '1000px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>SPACE GESTÃO</h1>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Demonstrativo de Pagamento de Prestador</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>Nº {closing.id?.slice(-6).toUpperCase()}</div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Ref: {closing.month}/{closing.year}</div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Destinatário</h2>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{recipient}</div>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>{closing.providerId ? 'Empresa / Provider' : 'Técnico Independente'}</div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Detalhamento de Serviços</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 0' }}>Data</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0' }}>Serviço / OS</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {os.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '0.75rem 0' }}>{new Date(item.date + 'T12:00:00').toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem 0' }}>OS #{item.id?.slice(-4)} - {item.client}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem 0' }}>{formatCurrency(item.total_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {adjustments.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Ajustes e Descontos</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <tbody>
                {adjustments.map(adj => (
                  <tr key={adj.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '0.5rem 0' }}>{adj.category} - {adj.description || 'Lançamento avulso'}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem 0', color: adj.type === 'Desconto' ? 'var(--danger)' : 'var(--success-text)' }}>
                      {adj.type === 'Desconto' ? '-' : '+'}{formatCurrency(adj.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '3rem', borderTop: '2px solid #333', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>VALOR LÍQUIDO A RECEBER:</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(closing.total)}</div>
          </div>
        </div>

        <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #999', paddingTop: '0.5rem', fontSize: '0.8rem' }}>Assinatura do Prestador</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #999', paddingTop: '0.5rem', fontSize: '0.8rem' }}>Space Consultoria e Serviços</div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
          #payment-slip { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
