import React, { useState, useEffect } from 'react';
import { api } from '../../store/db';
import { getBrasiliaTodayStr } from '../../utils/time';
import { Save, ArrowLeft, CheckCircle, Clock, Play, Check, FileText, CreditCard, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateOS() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    date: getBrasiliaTodayStr(),
    project_id: '',
    collaborator_id: '',
    type: 'Chamado',
    client: '',
    location: '',
    description: '',
    base_value: 0,
    additional_value: 0,
    status: 'Agendado', // Status Inicial conforme planejado
    isApproved: false
  });

  const loadData = async () => {
    setLoading(true);
    const [projData, colabData] = await Promise.all([
      api.projects.list(),
      api.collaborators.list()
    ]);
    setProjects(projData.filter(p => p.status === 'Ativo'));
    setCollaborators(colabData.filter(t => t.status === 'Ativo'));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      base_value: Number(formData.base_value),
      additional_value: Number(formData.additional_value),
      total_value: Number(formData.base_value) + Number(formData.additional_value)
    };
    await api.os.create(payload);
    navigate('/operacoes/os');
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) return <div className="p-8 text-center text-muted">Carregando formulário...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-h2">Lançar Nova OS</h1>
            <p className="text-muted">Início do ciclo de vida do serviço.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            
            <div className="input-group">
              <label className="input-label">Data do Serviço *</label>
              <input type="date" className="input-field" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>

            <div className="input-group">
              <label className="input-label">Projeto / Centro de Custo *</label>
              <select className="input-field" required value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})}>
                <option value="">Selecione o projeto</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Colaborador / Técnico *</label>
              <select className="input-field" required value={formData.collaborator_id} onChange={(e) => setFormData({...formData, collaborator_id: e.target.value})}>
                <option value="">Selecione o colaborador</option>
                {collaborators.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Tipo de Atendimento</label>
              <select className="input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="Chamado">Chamado (Avulso)</option>
                <option value="Diária">Diária Inteira</option>
                <option value="Mensal">Equipe Fixa Mensal</option>
                <option value="Projeto">Hora/Projeto</option>
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Cliente Final / Localidade</label>
              <input type="text" className="input-field" placeholder="Ex: Unidade Centro - SP" value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Descrição das Atividades</label>
              <textarea className="input-field" rows="3" placeholder="O que será/foi realizado neste atendimento?" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="input-group">
              <label className="input-label">Valor Base (R$)</label>
              <input type="number" step="0.01" className="input-field" value={formData.base_value} onChange={(e) => setFormData({...formData, base_value: e.target.value})} />
            </div>

            <div className="input-group">
              <label className="input-label">Valor Adicional / Km (R$)</label>
              <input type="number" step="0.01" className="input-field" value={formData.additional_value} onChange={(e) => setFormData({...formData, additional_value: e.target.value})} />
            </div>

            <div className="input-group">
              <label className="input-label">Status Inicial</label>
              <select className="input-field" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="Agendado">Agendado</option>
                <option value="Criação">Apenas Criado (Rascunho)</option>
                <option value="Em Execução">Já em Execução</option>
              </select>
            </div>

          </div>

          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>Resumo Financeiro</div>
              <div className="text-h3 text-success">{formatCurrency(Number(formData.base_value) + Number(formData.additional_value))}</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">
                <Save size={18} />
                Confirmar Lançamento
              </button>
            </div>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 className="text-sm" style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Ciclo de Vida Esperado</h3>
        <div style={{ display: 'flex', gap: '0.5rem', opacity: 0.6 }}>
          {[
            { icon: <Clock size={14}/>, label: 'Agendado' },
            { icon: <Play size={14}/>, label: 'Execução' },
            { icon: <CheckCircle size={14}/>, label: 'Conclusão' },
            { icon: <Check size={14}/>, label: 'Aprovação' },
            { icon: <FileText size={14}/>, label: 'Gerar NF' },
            { icon: <CreditCard size={14}/>, label: 'Pagamento' },
            { icon: <Lock size={14}/>, label: 'Encerrado' }
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem' }}>
              {step.icon} {step.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
