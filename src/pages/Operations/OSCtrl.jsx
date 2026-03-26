import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, FileText, AlertTriangle, Eye, ClipboardList, CalendarDays, Play, CheckCircle } from 'lucide-react';
import { api, auth } from '../../store/db';
import { useToast } from '../../components/Toast';
import { getBrasiliaTodayStr, getBrasiliaDate } from '../../utils/time';

export default function OSCtrl() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [providers, setProviders] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedOSForHistory, setSelectedOSForHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  const currentUser = auth.getCurrentUser();
  const isAdmin = currentUser?.role === 'Administrador';

  const [periodFilter, setPeriodFilter] = useState('Mes');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    date: getBrasiliaTodayStr(),
    scheduledTime: '09:00',
    estimatedCompletion: '',
    project_id: '',
    collaborator_id: '',
    serviceId: '',
    clientId: '',
    clientCnpj: '',
    clientAddress: '',
    type: 'Chamado',
    description: '',
    base_value: 0,
    additional_value: 0,
    status: 'Agendado',
    isApproved: false,
    completionDate: '',
    completionTime: ''
  });

  const loadData = async () => {
    setLoading(true);
    const [osData, projData, colabData, provData, clientsData] = await Promise.all([
      api.os.list(),
      api.projects.list(),
      api.collaborators.list(),
      api.providers.list(),
      api.clients.list()
    ]);
    
    setOrders(osData.sort((a,b) => getBrasiliaDate(new Date(b.date)) - getBrasiliaDate(new Date(a.date))));
    setProjects(projData.filter(p => p.status === 'Ativo'));
    setCollaborators(colabData.filter(t => t.status === 'Ativo'));
    setProviders(provData);
    setClients(clientsData);
    setLoading(false);
  };

  // Lógica de Precificação Automática baseada no PROJETO
  useEffect(() => {
    if (!formData.serviceId || !formData.collaborator_id || !formData.project_id) return;

    const project = projects.find(p => p.id === formData.project_id);
    if (!project || !project.services) return;

    const selectedService = project.services.find(s => s.name === formData.serviceId);
    const selectedColab = collaborators.find(c => c.id === formData.collaborator_id);

    if (selectedService && selectedColab) {
      const isFixed = selectedColab.modalidadeContrato === 'clt' || selectedColab.hasFixedContract;
      
      setFormData(prev => ({
        ...prev,
        base_value: isFixed ? 0 : (selectedService.price || 0)
      }));
    }
  }, [formData.serviceId, formData.collaborator_id, formData.project_id, projects, collaborators]);

  // Auto-preenchimento de dados do cliente
  useEffect(() => {
    if (!formData.clientId) {
      setFormData(prev => ({
        ...prev,
        clientCnpj: '',
        clientAddress: ''
      }));
      return;
    }
    const client = clients.find(c => c.id === formData.clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientCnpj: client.cnpj || '',
        clientAddress: client.endereco || client.address || ''
      }));
    }
  }, [formData.clientId, clients]);

  useEffect(() => {
    loadData();
  }, []);

  const openModal = async (os = null) => {
    if (!os && (projects.length === 0 || collaborators.length === 0)) {
      await toast.confirm('Ação necessária: Você precisa cadastrar pelo menos um Projeto e um Colaborador para criar uma OS.', 'Dados Faltantes', 'alert');
      return;
    }

    if (os) {
      setEditingId(os.id);
      setFormData({
        date: os.date || getBrasiliaTodayStr(),
        scheduledTime: os.scheduledTime || '09:00',
        estimatedCompletion: os.estimatedCompletion || '',
        project_id: os.project_id || '',
        collaborator_id: os.collaborator_id || '',
        serviceId: os.serviceId || '',
        clientId: os.clientId || '',
        clientCnpj: os.clientCnpj || '',
        clientAddress: os.clientAddress || '',
        type: os.type || 'Chamado',
        description: os.description || '',
        base_value: os.base_value || 0,
        additional_value: os.additional_value || 0,
        status: os.status || 'Agendado',
        isApproved: os.isApproved || false,
        completionDate: os.completionDate || '',
        completionTime: os.completionTime || ''
      });
      setClientSearch(clients.find(c => c.id === os.clientId)?.nome || '');
    } else {
      setEditingId(null);
      const firstProj = projects.length > 0 ? projects[0] : null;
      setFormData({ 
        date: getBrasiliaTodayStr(),
        scheduledTime: '09:00',
        estimatedCompletion: '',
        project_id: firstProj ? firstProj.id : '',
        collaborator_id: collaborators.length > 0 ? collaborators[0].id : '',
        serviceId: (firstProj && firstProj.services?.length > 0) ? firstProj.services[0].name : '',
        clientId: '',
        clientCnpj: '',
        clientAddress: '',
        type: 'Chamado', 
        description: '', 
        base_value: 0, 
        additional_value: 0, 
        status: 'Agendado', 
        isApproved: false,
        completionDate: '',
        completionTime: ''
      });
      setClientSearch('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      base_value: Number(formData.base_value),
      additional_value: Number(formData.additional_value),
      total_value: Number(formData.base_value) + Number(formData.additional_value)
    };

    // Validação de requisitos obrigatórios por status
    const isCreation = payload.status === 'Criação';
    const isCompleted = payload.status === 'Concluído' || payload.status === 'Aprovação' || payload.status === 'Encerrado';

    const requiredFields = [
      { key: 'project_id', label: 'Projeto' },
      { key: 'collaborator_id', label: 'Colaborador' },
      { key: 'serviceId', label: 'Tipo de Serviço' },
      { key: 'clientId', label: 'Cliente Final / Local' }
    ];

    if (!isCreation) {
      requiredFields.push({ key: 'date', label: 'Data de Início' });
      requiredFields.push({ key: 'scheduledTime', label: 'Horário Agendado' });
    }

    if (isCompleted) {
      requiredFields.push({ key: 'completionDate', label: 'Data de Conclusão' });
      requiredFields.push({ key: 'completionTime', label: 'Hora de Conclusão' });
    }

    const missing = requiredFields.filter(f => !payload[f.key]);
    if (missing.length > 0) {
      toast.error(`Para o status "${payload.status}", os campos abaixo são obrigatórios: \n- ${missing.map(m => m.label).join('\n- ')}`);
      return;
    }

    if (editingId) {
      await api.os.update(editingId, payload);
    } else {
      await api.os.create(payload);
    }
    closeModal();
    loadData();
  };

  const handleDelete = async (id) => {
    if (await toast.confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) {
      await api.os.delete(id);
      loadData();
    }
  };

  const getProjectName = (id) => {
    const p = projects.find(proj => proj.id === id);
    return p ? (p.name || p.nome || 'Projeto Sem Nome') : 'Desconhecido';
  };
  
  const getColabName = (id) => {
    const c = collaborators.find(col => col.id === id);
    return c ? (c.nome || c.name || 'Colaborador Sem Nome') : 'Desconhecido';
  };

  const getProviderByColabId = (id) => {
    const colab = collaborators.find(t => t.id === id);
    if (!colab) return '-';
    // Suporta providerId (camelCase) ou provider_id (snake_case)
    const pid = colab.providerId || colab.provider_id;
    if (!pid) return 'Independente';
    const provider = providers.find(p => p.id === pid);
    // Suporta razaoSocial ou nome
    return provider?.razaoSocial || provider?.nome || 'Desconhecido';
  };

  const getServiceName = (id, projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.services) return id || 'S/ Serviço';
    const s = project.services.find(serv => serv.name === id);
    return s ? s.name : (id || 'Serviço s/ Projeto');
  };

  const getClientName = (id) => {
    const c = clients.find(cl => cl.id === id);
    return c ? c.nome : 'Local não informado';
  };

  const isWithinPeriod = (dateStr) => {
    if (!dateStr) return true;
    const todayStr = getBrasiliaTodayStr();
    
    if (periodFilter === 'Dia') {
      return dateStr === todayStr;
    }

    const osDate = new Date(dateStr + 'T12:00:00');
    const today = getBrasiliaDate();
    today.setHours(12, 0, 0, 0);
    
    if (periodFilter === 'Semana') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return osDate >= startOfWeek && osDate <= endOfWeek;
    } else if (periodFilter === 'Mes') {
      return osDate.getMonth() === today.getMonth() && osDate.getFullYear() === today.getFullYear();
    } else if (periodFilter === 'Personalizado') {
      if (!customStartDate || !customEndDate) return true;
      const start = new Date(customStartDate + 'T00:00:00');
      const end = new Date(customEndDate + 'T23:59:59');
      return osDate >= start && osDate <= end;
    }
    return true;
  };

  const periodOrders = orders.filter(os => isWithinPeriod(os.date));

  const filteredOrders = periodOrders.filter(os => {
    const matchesSearch = getColabName(os.collaborator_id).toLowerCase().includes(search.toLowerCase()) || 
                         getProjectName(os.project_id).toLowerCase().includes(search.toLowerCase()) ||
                         getClientName(os.clientId).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || os.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleApproval = async (os) => {
    await api.os.update(os.id, { ...os, isApproved: !os.isApproved });
    loadData();
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    // Se já estiver no formato brasileiro DD/MM/YYYY, retorna como está
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Criação': return 'badge-neutral';
      case 'Agendado': return 'badge-warning';
      case 'Em Execução': return 'badge-primary';
      case 'Concluído': return 'badge-info';
      case 'Aprovação': return 'badge-success';
      case 'Gerar NF': return 'badge-secondary';
      case 'Aprovar NF': return 'badge-warning';
      case 'Pagamento': return 'badge-danger';
      case 'Encerrado': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  const getNextStatus = (current) => {
    const flow = ['Criação', 'Agendado', 'Em Execução', 'Concluído', 'Aprovação', 'Gerar NF', 'Aprovar NF', 'Pagamento', 'Encerrado'];
    const idx = flow.indexOf(current);
    if (idx < flow.length - 1) return flow[idx + 1];
    return null;
  };

  const advanceStatus = async (os) => {
    const next = getNextStatus(os.status);
    if (next) {
      const updates = { status: next };
      if (next === 'Aprovação') updates.isApproved = true;
      
      await api.os.update(os.id, { ...os, ...updates });
      
      // Sistema de Notificações Automáticas
      if (next === 'Agendado') {
        await api.notifications.notifyUser(os.collaborator_id, `Nova OS agendada para você: ${os.description.substring(0,30)}...`, '/os');
      } else if (next === 'Concluído') {
        await api.notifications.notifyRole('Gestor', `Técnico finalizou a OS. Aguardando sua aprovação.`, '/os');
      } else if (next === 'Gerar NF') {
        await api.notifications.notifyUser(os.collaborator_id, `Período fechado! Favor emitir e anexar a NF desta OS.`, '/os');
      } else if (next === 'Aprovar NF') {
        await api.notifications.notifyRole('Financeiro', `Nova NF anexada pelo técnico. Favor validar e aprovar.`, '/os');
      } else if (next === 'Pagamento') {
        await api.notifications.notifyRole('Financeiro', `NF Aprovada! OS pronta para execução do pagamento.`, '/os');
      } else if (next === 'Encerrado') {
        await api.notifications.notifyUser(os.collaborator_id, `Pagamento realizado e OS encerrada.`, '/os');
      }
      
      loadData();
    }
  };

  const openHistory = (os) => {
    setSelectedOSForHistory(os);
    setIsHistoryModalOpen(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h2">Ordens de Serviço</h1>
          <p className="text-muted">Acompanhamento e lançamento de atividades e serviços prestados.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Nova OS
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="text-h3" style={{ margin: 0 }}>Visão Geral</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select 
            className="input-field" 
            style={{ width: '150px', marginBottom: 0, padding: '0.5rem' }}
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="Dia">Hoje</option>
            <option value="Semana">Esta Semana</option>
            <option value="Mes">Este Mês</option>
            <option value="Personalizado">Personalizado</option>
          </select>
          {periodFilter === 'Personalizado' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="date" className="input-field" style={{ marginBottom: 0, padding: '0.5rem' }} value={customStartDate} onChange={e=>setCustomStartDate(e.target.value)}/>
              <span className="text-muted">até</span>
              <input type="date" className="input-field" style={{ marginBottom: 0, padding: '0.5rem' }} value={customEndDate} onChange={e=>setCustomEndDate(e.target.value)}/>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card shadow-sm hover-scale" style={{ borderLeft: '4px solid var(--primary)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
              <ClipboardList size={20} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{periodOrders.length}</span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Total de OS</p>
        </div>

        <div className="card shadow-sm hover-scale" style={{ borderLeft: '4px solid var(--warning)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', padding: '0.5rem', borderRadius: '8px' }}>
              <CalendarDays size={20} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{periodOrders.filter(o => o.status === 'Agendado').length}</span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Agendadas</p>
        </div>

        <div className="card shadow-sm hover-scale" style={{ borderLeft: '4px solid var(--info)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.5rem', borderRadius: '8px' }}>
              <Play size={20} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{periodOrders.filter(o => o.status === 'Em Execução').length}</span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Em Execução</p>
        </div>

        <div className="card shadow-sm hover-scale" style={{ borderLeft: '4px solid var(--success)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ backgroundColor: 'var(--success-subtle)', color: 'var(--success-text)', padding: '0.5rem', borderRadius: '8px' }}>
              <CheckCircle size={20} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{periodOrders.filter(o => o.status === 'Concluído').length}</span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Concluídas</p>
        </div>
      </div>

      {(projects.length === 0 || collaborators.length === 0) && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--warning)' }}>
          <strong>Ação necessária:</strong> Você precisa cadastrar pelo menos um <strong>Projeto</strong> e um <strong>Colaborador</strong> para criar uma OS.
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="input-group" style={{ margin: 0, flex: 1, maxWidth: '400px', flexDirection: 'row', alignItems: 'center', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.25rem 0.75rem' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar técnico, projeto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '0.5rem', outline: 'none' }}
            />
          </div>
          <select 
            className="input-field" 
            style={{ width: '200px', marginBottom: 0 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Criação">Criação</option>
            <option value="Agendado">Agendado</option>
            <option value="Em Execução">Em Execução</option>
            <option value="Concluído">Concluído</option>
            <option value="Aprovação">Aprovação</option>
            <option value="Gerar NF">Gerar NF</option>
            <option value="Efetuar Pagamento">Pagamento</option>
            <option value="Encerrado">Encerrado</option>
          </select>
        </div>

        {loading ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Carregando Ordens de Serviço...</p>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>Nenhuma ordem de serviço registrada.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Data</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Projeto / Cliente</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Serviço</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Colaborador</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>Fluxo</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((os) => (
                  <tr key={os.id} style={{ borderBottom: '1px solid var(--border-color)', '&:hover': { backgroundColor: 'var(--bg-main)' } }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{formatDate(os.date)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{os.code || os.id.substring(0,6).toUpperCase()}</div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--primary)' }}>{getProjectName(os.project_id)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getClientName(os.clientId)}</div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 500 }}>{getServiceName(os.serviceId, os.project_id)}</div>
                      {os.scheduledTime && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏰ {os.scheduledTime}</div>}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 500 }}>{getColabName(os.collaborator_id)}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{getProviderByColabId(os.collaborator_id)}</div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className={`badge ${getStatusBadge(os.status)}`}>
                        {os.status}
                      </span>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>{formatCurrency(os.total_value)}</div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                      {getNextStatus(os.status) && (
                        <button 
                          onClick={() => advanceStatus(os)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', borderColor: 'var(--primary-subtle)' }}
                        >
                          Mover: {getNextStatus(os.status)}
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => openHistory(os)} style={{ color: 'var(--info)', padding: '0.25rem' }} title="Ver Histórico">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => openModal(os)} style={{ color: 'var(--primary)', padding: '0.25rem' }} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleDelete(os.id)} style={{ color: 'var(--danger)', padding: '0.25rem' }} title="Excluir">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={closeModal}><X size={20}/></button>
            <h2 className="text-h3" style={{ marginBottom: '1.5rem' }}>{editingId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Data de Início *</label>
                  <input type="date" className="input-field" required value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})}/>
                </div>
                <div className="input-group">
                  <label className="input-label">Horário Agendado *</label>
                  <input type="time" className="input-field" required value={formData.scheduledTime} onChange={e=>setFormData({...formData, scheduledTime:e.target.value})}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Projeto / C.Custo *</label>
                  <select className="input-field" required value={formData.project_id} onChange={e=>setFormData({...formData, project_id:e.target.value})}>
                    <option value="">Selecione o Projeto</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.nome}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Colaborador *</label>
                  <select className="input-field" required value={formData.collaborator_id} onChange={e=>setFormData({...formData, collaborator_id:e.target.value})}>
                    <option value="">Selecione o Colaborador</option>
                    {collaborators.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome || c.name} ({c.modalidadeContrato?.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Tipo de Serviço (Projeto) *</label>
                  <select className="input-field" required value={formData.serviceId} onChange={e=>setFormData({...formData, serviceId:e.target.value})}>
                    <option value="">Selecione o Serviço</option>
                    {projects.find(p=>p.id===formData.project_id)?.services?.map((s, idx) => (
                      <option key={idx} value={s.name}>{s.name} (R$ {s.price})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ position: 'relative' }}>
                  <label className="input-label">Cliente Final / Local *</label>
                  <input 
                    type="text"
                    className="input-field" 
                    placeholder="Digite para buscar..."
                    value={clientSearch}
                    autoComplete="off"
                    onFocus={() => setShowClientDropdown(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClientSearch(val);
                      setShowClientDropdown(true);
                      const match = clients.find(c => c.nome.toLowerCase() === val.toLowerCase());
                      if (match) {
                        setFormData(prev => ({ ...prev, clientId: match.id, clientCnpj: match.cnpj || '', clientAddress: match.address || '' }));
                      } else {
                        setFormData(prev => ({ ...prev, clientId: '', clientCnpj: '', clientAddress: '' }));
                      }
                    }}
                    onBlur={() => {
                      // Pequeno atraso para permitir o clique no item da lista
                      setTimeout(() => setShowClientDropdown(false), 200);
                    }}
                  />
                  
                  {showClientDropdown && (
                    <div className="card" style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      zIndex: 1000, 
                      marginTop: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      padding: '0.5rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {clients.filter(c => {
                        return c.nome.toLowerCase().includes(clientSearch.toLowerCase());
                      }).length === 0 ? (
                        <div style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Nenhum local encontrado</p>
                          <button 
                            type="button"
                            className="btn btn-secondary btn-sm" 
                            style={{ width: '100%' }}
                            onClick={async () => {
                              if (await toast.confirm(`Deseja cadastrar novo cliente "${clientSearch}" agora?`, 'Novo Cliente')) {
                                window.open('/clientes', '_blank');
                              }
                            }}
                          >
                            + Cadastrar Novo Cliente
                          </button>
                        </div>
                      ) : (
                        <div>
                          {clients.filter(c => {
                            return c.nome.toLowerCase().includes(clientSearch.toLowerCase());
                          }).map(c => (
                            <div 
                              key={c.id} 
                              style={{ 
                                padding: '0.5rem 0.75rem', 
                                cursor: 'pointer', 
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                              }}
                              className="dropdown-hover-item"
                              onClick={() => {
                                setClientSearch(c.nome);
                                setFormData(prev => ({ ...prev, clientId: c.id, clientCnpj: c.cnpj || '', clientAddress: c.address || '' }));
                                setShowClientDropdown(false);
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-main)'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.nome}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.parentId ? 'Cliente Final' : 'Meu Cliente'} • {c.cnpj || 'Sem CNPJ'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">CNPJ do Local</label>
                  <input type="text" className="input-field" readOnly value={formData.clientCnpj} placeholder="Puxado automaticamente"/>
                </div>
                <div className="input-group">
                  <label className="input-label">Data Prevista de Conclusão</label>
                  <input type="date" className="input-field" value={formData.estimatedCompletion} onChange={e=>setFormData({...formData, estimatedCompletion:e.target.value})}/>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Endereço Completo (para Geolocalização)</label>
                <input type="text" className="input-field" readOnly value={formData.clientAddress} placeholder="Puxado automaticamente pelo cadastro do cliente"/>
              </div>

              <div className="input-group">
                <label className="input-label">Descrição da Atividade</label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  value={formData.description} 
                  onChange={e=>setFormData({...formData, description:e.target.value})}
                  placeholder="Detalhes técnicos do que deve ser realizado..."
                />
              </div>

              {(formData.status === 'Concluído' || formData.status === 'Aprovação' || formData.status === 'Encerrado') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'rgba(var(--success-rgb), 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--success-subtle)' }}>
                   <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--success-text)' }}>Data de Conclusão Real *</label>
                    <input type="date" className="input-field" required value={formData.completionDate} onChange={e=>setFormData({...formData, completionDate:e.target.value})}/>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--success-text)' }}>Hora da Conclusão *</label>
                    <input type="time" className="input-field" required value={formData.completionTime} onChange={e=>setFormData({...formData, completionTime:e.target.value})}/>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'flex-start' }}>
                <div className="input-group">
                  <label className="input-label">Valor Base (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input-field" 
                    value={formData.base_value} 
                    onChange={e=>setFormData({...formData, base_value:Number(e.target.value)})}
                  />
                  <div style={{ minHeight: '1.2rem' }}>
                    {formData.base_value === 0 && formData.collaborator_id && (
                      <span style={{fontSize:'0.7rem', color:'var(--info)', display: 'block', marginTop: '2px'}}>Custo zero para CLT/Fixo</span>
                    )}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Adicionais / KM (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input-field" 
                    value={formData.additional_value} 
                    onChange={e=>setFormData({...formData, additional_value:e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Status da OS</label>
                  <select className="input-field" value={formData.status} onChange={e=>setFormData({...formData, status:e.target.value})}>
                    <option value="Criação">Criação</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Em Execução">Em Execução</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Aprovação">Aprovação</option>
                    <option value="Gerar NF">Gerar NF</option>
                    <option value="Aprovar NF">Aprovar NF</option>
                    <option value="Pagamento">Pagamento</option>
                    <option value="Encerrado">Encerrado</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted">Valor Total Calculado:</span>
                <span className="text-h3" style={{ color: 'var(--success)' }}>
                  {formatCurrency(Number(formData.base_value) + Number(formData.additional_value))}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isHistoryModalOpen && selectedOSForHistory && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ maxWidth: '650px', width: '95%', padding: '2rem' }}>
            <button className="modal-close" onClick={() => setIsHistoryModalOpen(false)}><X size={20}/></button>
            <h2 className="text-h3" style={{ marginBottom: '1.5rem' }}>Linha do Tempo - {selectedOSForHistory.code || selectedOSForHistory.id.substring(0,6).toUpperCase()}</h2>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.1rem' }}>{getProjectName(selectedOSForHistory.project_id)}</div>
              <div className="text-muted">{getClientName(selectedOSForHistory.clientId)}</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Técnico:</strong> {getColabName(selectedOSForHistory.collaborator_id)}</span>
                <span className={`badge ${getStatusBadge(selectedOSForHistory.status)}`}>{selectedOSForHistory.status}</span>
              </div>
            </div>

            {selectedOSForHistory.photos && selectedOSForHistory.photos.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 className="text-sm font-semibold" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} /> Evidências do Técnico ({selectedOSForHistory.photos.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                  {selectedOSForHistory.photos.map((photo, idx) => (
                    <div key={idx} style={{ 
                      aspectRatio: '1', 
                      borderRadius: 'var(--radius-sm)', 
                      overflow: 'hidden', 
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }} 
                    className="hover-scale"
                    onClick={() => window.open(photo, '_blank')}>
                      <img src={photo} alt={`Evidência ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ position: 'relative', paddingLeft: '2rem', marginTop: '2rem' }}>
              <div style={{ position: 'absolute', left: '7px', top: '5px', bottom: '5px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
              {(selectedOSForHistory.history || []).map((ev, i) => (
                <div key={ev.id} style={{ position: 'relative', marginBottom: '2rem' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-2rem', 
                    top: '0.25rem', 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    backgroundColor: i === (selectedOSForHistory.history.length - 1) ? 'var(--primary)' : 'var(--border-color)',
                    border: '4px solid var(--bg-card)',
                    boxShadow: i === (selectedOSForHistory.history.length - 1) ? '0 0 0 4px var(--primary-subtle)' : 'none',
                    zIndex: 1
                  }}></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {formatDate(ev.timestamp.split('T')[0])} às {ev.timestamp.split('T')[1]?.substring(0,5) || ''}
                  </div>
                  <div style={{ fontWeight: 600, margin: '0.25rem 0', fontSize: '1rem' }}>{ev.status} • {ev.action}</div>
                  <div className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                    {ev.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontStyle: 'italic', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                    Responsável: {ev.user}
                  </div>
                </div>
              )).slice().reverse()}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'right', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsHistoryModalOpen(false)}>Fechar Linha do Tempo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
