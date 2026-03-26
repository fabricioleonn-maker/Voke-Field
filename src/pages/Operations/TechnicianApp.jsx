import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, auth } from '../../store/db';
import { Clock, Smartphone, MapPin, ClipboardList, Camera,
  CheckCircle, AlertTriangle, Play, Square, Coffee, AlertCircle, Navigation
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { 
  getBrasiliaDate, 
  getBrasiliaISO, 
  getBrasiliaTodayStr, 
  formatBrasiliaTime 
} from '../../utils/time';

export default function TechnicianApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [currentTech, setCurrentTech] = useState(null);
  const [allTechs, setAllTechs] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myClosings, setMyClosings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('os'); // 'os' ou 'fechamentos'
  const [currentGPS, setCurrentGPS] = useState(null);
  const [photoPreview, setPhotoPreview] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allOs, allColabs, allProjects, allClosings, allClients] = await Promise.all([
        api.os.list(),
        api.collaborators.list(),
        api.projects.list(),
        api.closings?.list() || Promise.resolve([]),
        api.clients.list()
      ]);

      setAllTechs(allColabs);
      setProjects(allProjects);
      setClients(allClients);

      if (currentTech) {
        // Filtrar OS do técnico (Somente ativas)
        setMyOrders(allOs.filter(os =>
          (os.technician_id === currentTech.id || os.collaborator_id === currentTech.id) &&
          ['Agendado', 'Em Execução'].includes(os.status)
        ));

        // Filtrar Fechamentos
        const filteredClosings = allClosings.filter(c =>
          c.collaboratorId === currentTech.id || (currentTech.providerId && c.providerId === currentTech.providerId)
        );
        setMyClosings(filteredClosings);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user && user.role === 'Técnico' && allTechs.length > 0) {
      const match = allTechs.find(t => t.nome === user.nome || t.email === user.email);
      if (match) setCurrentTech(match);
    }
  }, [allTechs]);
  
  // Auto-select technician from navigation state (Request from Scheduling)
  useEffect(() => {
    if (location.state?.techId && allTechs.length > 0) {
      const match = allTechs.find(t => String(t.id) === String(location.state.techId));
      if (match) setCurrentTech(match);
    }
  }, [location.state, allTechs]);

  // Heartbeat to track "Online" status (Requirement 1)
  useEffect(() => {
    if (currentTech) {
      const heartbeat = setInterval(async () => {
        try {
          await api.collaborators.update(currentTech.id, { lastSeen: Date.now() });
        } catch (err) {
          console.error("Heartbeat error:", err);
        }
      }, 30000); // 30s pulse
      return () => clearInterval(heartbeat);
    }
  }, [currentTech?.id]);

  useEffect(() => {
    loadData();
    // Pegar GPS real do navegador
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentGPS({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Erro GPS:", err),
        { enableHighAccuracy: true }
      );
    }
  }, [currentTech?.id]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371e3; // metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleAction = async (os, action) => {
    const project = projects.find(p => p.id === os.project_id);
    const client = clients.find(c => c.id === os.clientId);

    // Prioriza o GPS do Cliente Final (Local específico), se não houver, usa o do projeto
    const targetLat = client?.latitude || project?.latitude;
    const targetLng = client?.longitude || project?.longitude;

    const hasGPS = targetLat && targetLng;
    const dist = hasGPS
      ? calculateDistance(currentGPS?.lat, currentGPS?.lng, Number(targetLat), Number(targetLng))
      : 0;

    if (hasGPS && dist > 500) { // Aumentado para 500m de tolerância para locais grandes
      await toast.confirm(`Atenção: Você está a ${Math.round(dist)}m do local (${client?.nome || project?.name || 'Destino'}). É necessário estar em campo para ${action}.`, 'GPS Necessário', 'alert');
      return;
    }

    if (action === 'Finalizar' && photoPreview.length < 1) {
      await toast.confirm("É necessário anexar pelo menos 1 foto como evidência do serviço.", 'Evidência Obrigatória', 'alert');
      return;
    }

    const nextStatus = action === 'Iniciar' ? 'Em Execução' : 
                       action === 'Deslocamento' ? 'Em Deslocamento' : 'Concluído';
    const now = getBrasiliaDate();
    const updates = {
        ...os,
        status: nextStatus,
        [action === 'Iniciar' ? 'checkin_location' : action === 'Deslocamento' ? 'start_travel_location' : 'checkout_location']: currentGPS,
        [action === 'Deslocamento' ? 'start_travel_time' : '']: getBrasiliaISO(now),
        photos: action === 'Finalizar' ? photoPreview : (os.photos || []),
        ...(action === 'Finalizar' ? {
          completionDate: getBrasiliaTodayStr(now),
          completionTime: formatBrasiliaTime(now)
        } : {})
    };

    await api.os.update(os.id, updates);
    loadData();
    if (action === 'Finalizar') setPhotoPreview([]);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(prev => [...prev, reader.result].slice(-5));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadNF = async (closingId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      await api.closings.update(closingId, {
        nf_url: reader.result,
        status: 'Aprovar NF',
        nfUploadedAt: getBrasiliaISO()
      });
      toast.success("Nota Fiscal enviada com sucesso! O Fiscal irá validar seu documento.");
      loadData();
    };
    reader.readAsDataURL(file);
  };

  if (!currentTech) {
    return (
      <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }} className="card shadow-lg">
        <h2 className="text-h2" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Portal do Técnico</h2>
        <div className="input-group">
          <label className="input-label">Selecione seu nome para acessar:</label>
          <select
            className="input-field"
            onChange={(e) => {
              const tech = allTechs.find(t => String(t.id) === String(e.target.value));
              if (tech) setCurrentTech(tech);
            }}
          >
            <option value="">Selecione...</option>
            {allTechs.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
        <p className="text-muted text-sm" style={{ textAlign: 'center' }}>
          {auth.getCurrentUser()?.role === 'Técnico'
            ? 'Não conseguimos vincular seu usuário a um colaborador. Contate o RH.'
            : 'Este é um acesso simulado para demonstração do app.'}
        </p>
      </div>
    );
  }

  const [isLunch, setIsLunch] = useState(false);

  const toggleLunch = async () => {
    const tech = auth.getCurrentUser();
    if (!tech) return;

    if (!isLunch) {
       // Start Lunch
       await api.os_blocks.create({
         technicianId: tech.id,
         date: getBrasiliaTodayStr(),
         startTime: formatBrasiliaTime(),
         endTime: formatBrasiliaTime(getBrasiliaDate(new Date(Date.now() + 3600000))), // +1h
         type: 'ALMOÇO',
         description: 'Pausa para almoço registrada pelo portal'
       });
       setIsLunch(true);
       toast.success('Horário de almoço iniciado.');
    } else {
       // Manual end is just a state change for demo,
       // in real world we'd update the record.
       setIsLunch(false);
       toast.info('Pausa finalizada.');
    }
  };

  if (loading) return <div className="page-placeholder">Carregando portal...</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '3rem' }}>
      <header style={{ marginBottom: '1.5rem', textAlign: 'center', position: 'relative' }}>
        {auth.getCurrentUser()?.role !== 'Técnico' && (
          <button
            onClick={() => setCurrentTech(null)}
            style={{ position: 'absolute', top: 0, left: 0, padding: '0.25rem', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
          >
            Voltar
          </button>
        )}
        <h1 className="text-h2">Minhas OS</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', color: currentGPS ? 'var(--success-text)' : 'var(--danger-text)' }}>
          <MapPin size={14} />
          {currentGPS ? `GPS Ativo: ${currentTech.nome}` : 'Aguardando GPS...'}
        </div>
      </header>

      <nav style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('os')}
          style={{ flex: 1, padding: '0.8rem', border: 'none', background: 'transparent', borderBottom: activeTab === 'os' ? '2px solid var(--primary)' : 'none', fontWeight: activeTab === 'os' ? 600 : 400, color: activeTab === 'os' ? 'var(--primary)' : 'var(--text-muted)' }}
        >
          Trabalho
        </button>
        <button
          onClick={() => setActiveTab('fechamentos')}
          style={{ flex: 1, padding: '0.8rem', border: 'none', background: 'transparent', borderBottom: activeTab === 'fechamentos' ? '2px solid var(--primary)' : 'none', fontWeight: activeTab === 'fechamentos' ? 600 : 400, color: activeTab === 'fechamentos' ? 'var(--primary)' : 'var(--text-muted)' }}
        >
          Pagamentos
        </button>
      </nav>

      {activeTab === 'os' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myOrders.length === 0 && (
            <div className="card text-center" style={{ padding: '3rem 1rem' }}>
              <CheckCircle size={40} color="var(--success)" style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p className="text-muted">Tudo em dia! Nenhuma OS pendente por aqui.</p>
            </div>
          )}

          {myOrders.map(os => {
            const project = projects.find(p => p.id === os.project_id);
            const isRunning = os.status === 'Em Execução';

            return (
              <div key={os.id} className="card shadow-sm" style={{ padding: '1.25rem', borderLeft: `5px solid ${isRunning ? 'var(--primary)' : 'var(--warning)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isRunning ? 'var(--primary)' : 'var(--warning)' }}></div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>{os.status}</span>
                  </div>
                  <span className="text-sm text-muted">{getBrasiliaDate(new Date(os.date + 'T12:00:00')).toLocaleDateString('pt-BR')}</span>
                </div>

                <h3 className="text-h3" style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{project?.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                   <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} className="text-muted" />
                   <span className="text-sm text-muted">{os.client || 'Local não informado'}</span>
                </div>

                <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                  {os.description || 'Sem descrição da atividade.'}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  {os.status === 'Agendado' ? (
                    <button className="btn btn-warning" style={{ width: '100%', height: '48px', fontSize: '1rem', marginBottom: '1rem' }} onClick={() => handleAction(os, 'Deslocamento')}>
                      <Navigation size={18} /> Iniciar Deslocamento
                    </button>
                  ) : null}

                  {os.status === 'Em Deslocamento' || os.status === 'Agendado' ? (
                    <button className="btn btn-primary" style={{ width: '100%', height: '48px', fontSize: '1rem' }} onClick={() => handleAction(os, 'Iniciar')}>
                      <Play size={18} /> Iniciar Check-in
                    </button>
                  ) : isRunning ? (
                    <div style={{ width: '100%' }}>
                      <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Camera size={16} /> Fotos de Comprovação
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input type="file" multiple accept="image/*" className="input-field" style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} onChange={handlePhotoUpload} />
                          <div style={{ padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                             Toque para tirar fotos ou anexar
                          </div>
                        </div>
                      </div>

                      {photoPreview.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                          {photoPreview.map((p, i) => (
                            <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                              <img src={p} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} alt="evidence" />
                              <button
                                onClick={() => setPhotoPreview(prev => prev.filter((_, idx) => idx !== i))}
                                style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 18, height: 18, border: 'none', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Square size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button className="btn btn-success" style={{ width: '100%', height: '48px', fontSize: '1rem' }} onClick={() => handleAction(os, 'Finalizar')}>
                        <CheckCircle size={18} /> Finalizar Check-out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myClosings.length === 0 && <p className="text-center text-muted" style={{ padding: '2rem' }}>Nenhum fechamento disponível.</p>}
          {myClosings.map(cl => (
            <div key={cl.id} className="card shadow-sm" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{cl.month}/{cl.year}</div>
                  <div className="text-h3" style={{ color: 'var(--primary)' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cl.total)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                  <span className={`badge ${cl.status === 'Pago' ? 'badge-success' : cl.status === 'Aguardando NF' ? 'badge-info' : 'badge-warning'}`}>{cl.status}</span>
                  <button
                    onClick={() => navigate(`/operacoes/demonstrativo/${cl.id}`)}
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', border: 'none', background: 'transparent', textDecoration: 'underline', padding: 0 }}
                  >
                    Ver Demonstrativo
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                {cl.status === 'Aguardando NF' && (
                  <div>
                    <label className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                      <ClipboardList size={18} />
                      {cl.nf_url ? 'Substituir Nota Fiscal' : 'Anexar Nota Fiscal (NF)'}
                      <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => handleUploadNF(cl.id, e.target.files[0])} />
                    </label>
                  </div>
                )}
                {cl.status === 'Pendente' && (
                  <div className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                    Fechamento em análise pelo financeiro.
                  </div>
                )}
                {cl.status === 'Pago' && (
                  <div style={{ color: 'var(--success-text)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
                    Pagamento efetuado em {getBrasiliaDate(new Date(cl.paidAt)).toLocaleDateString()}.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="var(--primary)" />
          <div className="text-sm">
            <strong>Lembrete:</strong> O sistema utiliza sua geolocalização para validar o atendimento.
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button
            className={`btn ${isLunch ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', height: '48px', gap: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={toggleLunch}
          >
            <Coffee size={20} />
            {isLunch ? 'Finalizar Almoço' : 'Registrar Almoço'}
          </button>
        </div>
      </div>
    </div>
  );
}
