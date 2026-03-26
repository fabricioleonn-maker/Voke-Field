import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { Printer, FileText, ChevronRight, User } from 'lucide-react';

export default function StatementsReport() {
  const [selectedColab, setSelectedColab] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [colabs, os, adj] = await Promise.all([
      api.collaborators.list(),
      api.os.list(),
      api.adjustments?.list() || Promise.resolve([])
    ]);
    setCollaborators(colabs);
    setOrders(os.filter(o => o.isApproved));
    setAdjustments(adj);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getColabData = () => {
    if (!selectedColab) return null;
    const colab = collaborators.find(c => c.id === selectedColab);
    const colabOrders = orders.filter(o => (o.collaborator_id || o.technician_id) === selectedColab);
    const colabAdj = adjustments.filter(a => a.collaborator_id === selectedColab);
    
    const subtotal = colabOrders.reduce((acc, o) => acc + (o.total_value || 0), 0);
    const adjTotal = colabAdj.reduce((acc, a) => acc + (a.type === 'Adicional' ? a.value : -a.value), 0);

    return { colab, orders: colabOrders, adjustments: colabAdj, subtotal, adjTotal, total: subtotal + adjTotal };
  };

  const report = getColabData();
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <h1 className="text-h2">Demonstrativo / Recibo</h1>
          <p className="text-muted">Geração de documentos detalhados para prestação de contas.</p>
        </div>
        {report && (
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={18} /> Imprimir Recibo
          </button>
        )}
      </div>

      <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
        <div className="input-group" style={{ marginBottom: 0, maxWidth: '400px' }}>
          <label className="input-label">Selecione o Colaborador / Prestador</label>
          <select className="input-field" value={selectedColab || ''} onChange={e => setSelectedColab(e.target.value)}>
            <option value="">Selecione um prestador...</option>
            {collaborators.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </div>

      {report ? (
        <div className="card report-container" style={{ padding: '2rem', color: '#111', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>SPACE GESTÃO</h2>
              <p style={{ fontSize: '0.875rem' }}>Demonstrativo de Serviços Prestados</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              <p><strong>Referência:</strong> {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1rem' }}>DADOS DO PRESTADOR</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <p><strong>Nome:</strong> {report.colab.nome}</p>
              <p><strong>CPF/CNPJ:</strong> {report.colab.cpf}</p>
              <p><strong>PIX:</strong> {report.colab.chavePix || '-'} ({report.colab.tipoChavePix})</p>
              <p><strong>Banco:</strong> {report.colab.nomeBanco} / Ag: {report.colab.agencia} / Cc: {report.colab.conta}</p>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1rem' }}>SERVIÇOS REALIZADOS (OS)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Data</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Projeto</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Descrição</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {report.orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '0.5rem' }}>{new Date(o.date).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '0.5rem' }}>{o.project_name || 'Serviço'}</td>
                    <td style={{ padding: '0.5rem' }}>{o.description}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(o.total_value)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right', padding: '1rem 0.5rem', fontWeight: 700 }}>Subtotal Serviços:</td>
                  <td style={{ textAlign: 'right', padding: '1rem 0.5rem', fontWeight: 700 }}>{formatCurrency(report.subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {report.adjustments.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1rem' }}>DESCONTOS E ADICIONAIS</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {report.adjustments.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '0.5rem' }}>{a.description || a.category}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem', color: a.type === 'Desconto' ? 'red' : 'green' }}>
                        {a.type === 'Desconto' ? '-' : '+'}{formatCurrency(a.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '3rem', borderTop: '2px solid #000', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.1rem' }}>VALOR LÍQUIDO A RECEBER</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#000' }}>{formatCurrency(report.total)}</p>
            </div>
          </div>

          <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'space-between', gap: '4rem' }}>
            <div style={{ flex: 1, borderTop: '1px solid #000', textAlign: 'center', paddingTop: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem' }}>Assinatura do Prestador</p>
              <p style={{ fontWeight: 600 }}>{report.colab.nome}</p>
            </div>
            <div style={{ flex: 1, borderTop: '1px solid #000', textAlign: 'center', paddingTop: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem' }}>P/ Space Gestão</p>
              <p style={{ fontWeight: 600 }}>Financeiro Operacional</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="page-placeholder">
          <FileText size={48} />
          <h2>Aguardando seleção</h2>
          <p>Selecione um colaborador acima para visualizar o demonstrativo detalhado.</p>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; background: #fff !important; color: #000 !important; }
          .report-container, .report-container * { visibility: visible; }
          .report-container { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
