import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Briefcase, FileText, Download, Filter, Search, MapPin, Eye, Edit2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../../store/db';

// Fix for default marker icon in leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function DashboardColaboradores() {
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState([]);
  const [filter, setFilter] = useState('Total'); // Total, Ativos, CLT, PJ
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filters
  const [estadoFilter, setEstadoFilter] = useState('');
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [formatoFilter, setFormatoFilter] = useState('');
  const [cargoFilter, setCargoFilter] = useState('');
  
  const [mapCenter, setMapCenter] = useState([-15.7801, -47.9292]);
  const [mapZoom, setMapZoom] = useState(4);
  const [viewColab, setViewColab] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await api.collaborators.list();
      // Add mock coordinates to real data if missing, so map works
      const mappedData = data.map(c => ({
        ...c,
        formato: (c.modalidadeContrato || c.formato || c.tipo || 'CLT').toUpperCase(),
        cargo: c.cargo || 'Não definido',
        lat: parseFloat(c.latitude || c.lat) || (-15.7801 + (Math.random() * 10 - 5)), 
        lng: parseFloat(c.longitude || c.lng) || (-47.9292 + (Math.random() * 10 - 5))
      }));
      setCollaborators(mappedData);
    }
    loadData();
  }, []);

  // Calculate KPIs
  const totalColaboradores = collaborators.length;
  const totalAtivos = collaborators.filter(c => c.status === 'Ativo').length;
  const totalClt = collaborators.filter(c => c.formato === 'CLT').length;
  const totalPj = collaborators.filter(c => c.formato === 'PJ').length;

  // Filter data
  const filteredData = collaborators.filter(colaborador => {
    // Top KPI status/format filtering
    const isCLT = colaborador.formato === 'CLT' || colaborador.tipo === 'CLT';
    const isPJ = colaborador.formato === 'PJ' || colaborador.tipo === 'PJ';

    if (filter === 'Ativos' && colaborador.status !== 'Ativo') return false;
    if (filter === 'CLT' && !isCLT) return false;
    if (filter === 'PJ' && !isPJ) return false;
    
    // Advanced filters
    if (estadoFilter && colaborador.estado !== estadoFilter) return false;
    if (cidadeFilter && !colaborador.cidade?.toLowerCase().includes(cidadeFilter.toLowerCase())) return false;
    if (formatoFilter && colaborador.formato !== formatoFilter) return false;
    if (cargoFilter && colaborador.cargo !== cargoFilter) return false;

    // Search input
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      if (!colaborador.nome?.toLowerCase().includes(lowerSearch) && 
          !colaborador.cpf?.includes(lowerSearch) &&
          !colaborador.cargo?.toLowerCase().includes(lowerSearch)) {
        return false;
      }
    }
    return true;
  });

  // Extract unique states for dropdown
  const states = [...new Set(collaborators.map(c => c.estado).filter(s => s && s !== 'Todos'))].sort();
  const cargos = [...new Set(collaborators.map(c => c.cargo).filter(Boolean))].sort();

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
            <Users size={24} style={{ color: '#3b82f6' }} /> Dashboard Técnicos
          </h1>
          <p className="text-muted">Visão geral e localização dos colaboradores no Brasil</p>
        </div>
      </div>

      {/* KPI Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div 
          onClick={() => setFilter('Total')}
          className="card" 
          style={{ 
            backgroundColor: filter === 'Total' ? '#2563eb' : '#eff6ff', 
            color: filter === 'Total' ? 'white' : '#1e3a8a',
            border: `1px solid ${filter === 'Total' ? '#1d4ed8' : '#bfdbfe'}`,
            padding: '1.5rem', 
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Users size={32} style={{ opacity: 0.9, marginBottom: '0.5rem' }} />
          <div className="text-sm font-medium" style={{ opacity: 0.9, textAlign: 'center' }}>Total de Colaboradores</div>
          <div className="text-h1" style={{ marginTop: '0.5rem' }}>{totalColaboradores}</div>
          <div className="text-xs" style={{ opacity: 0.7, marginTop: '0.5rem' }}>Clique para filtrar</div>
        </div>

        <div 
          onClick={() => setFilter('Ativos')}
          className="card" 
          style={{ 
            backgroundColor: filter === 'Ativos' ? '#10b981' : '#f0fdf4', 
            color: filter === 'Ativos' ? 'white' : '#064e3b',
            border: `1px solid ${filter === 'Ativos' ? '#059669' : '#bbf7d0'}`,
            padding: '1.5rem', 
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <UserCheck size={32} style={{ opacity: 0.9, marginBottom: '0.5rem' }} />
          <div className="text-sm font-medium" style={{ opacity: 0.9, textAlign: 'center' }}>Ativos</div>
          <div className="text-h1" style={{ marginTop: '0.5rem' }}>{totalAtivos}</div>
          <div className="text-xs" style={{ opacity: 0.7, marginTop: '0.5rem' }}>Clique para filtrar</div>
        </div>

        <div 
          onClick={() => setFilter('CLT')}
          className="card" 
          style={{ 
            backgroundColor: filter === 'CLT' ? '#8b5cf6' : '#faf5ff', 
            color: filter === 'CLT' ? 'white' : '#4c1d95',
            border: `1px solid ${filter === 'CLT' ? '#7c3aed' : '#e9d5ff'}`,
            padding: '1.5rem', 
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Briefcase size={32} style={{ opacity: 0.9, marginBottom: '0.5rem' }} />
          <div className="text-sm font-medium" style={{ opacity: 0.9, textAlign: 'center' }}>CLT</div>
          <div className="text-h1" style={{ marginTop: '0.5rem' }}>{totalClt}</div>
          <div className="text-xs" style={{ opacity: 0.7, marginTop: '0.5rem' }}>Clique para filtrar</div>
        </div>

        <div 
          onClick={() => setFilter('PJ')}
          className="card" 
          style={{ 
            backgroundColor: filter === 'PJ' ? '#f59e0b' : '#fffbeb', 
            color: filter === 'PJ' ? 'white' : '#78350f',
            border: `1px solid ${filter === 'PJ' ? '#d97706' : '#fde68a'}`,
            padding: '1.5rem', 
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <FileText size={32} style={{ opacity: 0.9, marginBottom: '0.5rem' }} />
          <div className="text-sm font-medium" style={{ opacity: 0.9, textAlign: 'center' }}>PJ</div>
          <div className="text-h1" style={{ marginTop: '0.5rem' }}>{totalPj}</div>
          <div className="text-xs" style={{ opacity: 0.7, marginTop: '0.5rem' }}>Clique para filtrar</div>
        </div>
      </div>

      {/* Map Section */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden', height: '450px' }}>
        <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
          <MapController center={mapCenter} zoom={mapZoom} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filteredData.map(colab => (
            <Marker key={colab.id} position={[colab.lat, colab.lng]}>
              <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                <div style={{ minWidth: '220px', padding: '4px', fontSize: '13px' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>{colab.nome}</div>
                  <p style={{ margin: '4px 0' }}><strong>Telefone:</strong> {colab.telefone}</p>
                  <p style={{ margin: '4px 0' }}><strong>Email:</strong> {colab.email}</p>
                  <p style={{ margin: '4px 0' }}><strong>Cargo:</strong> {colab.cargo}</p>
                  {colab.especialidade && <p style={{ margin: '4px 0' }}><strong>Especialidade:</strong> {colab.especialidade}</p>}
                  <p style={{ margin: '4px 0' }}><strong>Contrato:</strong> {colab.formato}</p>
                  <p style={{ margin: '4px 0' }}><strong>Status:</strong> {colab.status || 'Ativo'}</p>
                  <p style={{ margin: '4px 0' }}><strong>Empresa base:</strong> {colab.empresa || 'SPACE'}</p>
                  <p style={{ margin: '4px 0', whiteSpace: 'normal' }}><strong>Endereço:</strong> {colab.endereco} {colab.cidade ? `- ${colab.cidade}` : ''} {colab.estado ? `/${colab.estado}` : ''}</p>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Table Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                className={`btn ${showFilters ? 'btn-primary' : 'btn-neutral'}`}
                onClick={() => setShowFilters(!showFilters)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: showFilters ? '#1e293b' : '#334155', color: 'white', height: '42px' }}
              >
                <Filter size={16} /> {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Search size={16} />
                </div>
                <input 
                  type="text" 
                  placeholder="Buscar técnico..." 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem', minWidth: '300px', height: '42px' }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="responsive-grid grid-4" style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Estado</label>
                  <select className="input-field" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
                    <option value="">Todos</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Cidade</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Filtrar por cidade..." 
                    value={cidadeFilter} 
                    onChange={e => setCidadeFilter(e.target.value)} 
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Cargo</label>
                  <select className="input-field" value={cargoFilter} onChange={e => setCargoFilter(e.target.value)}>
                    <option value="">Todos</option>
                    {cargos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Contrato</label>
                  <select className="input-field" value={formatoFilter} onChange={e => setFormatoFilter(e.target.value)}>
                    <option value="">Todas</option>
                    <option value="CLT">CLT</option>
                    <option value="PJ">PJ</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <button className="btn" style={{ backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> Exportar CSV
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Cargo</th>
                <th>Empresa</th>
                <th>Status</th>
                <th style={{ width: '15%' }}>Contrato</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500, color: '#1e293b' }}>{c.nome}</td>
                    <td style={{ color: '#475569' }}>{c.cpf}</td>
                    <td style={{ color: '#475569' }}>{c.cargo}</td>
                    <td>
                      <span className="badge" style={{ 
                        backgroundColor: c.empresa === 'SPACE' ? '#e0e7ff' : '#dbeafe', 
                        color: c.empresa === 'SPACE' ? '#4f46e5' : '#2563eb' 
                      }}>
                        {c.empresa || 'FCOM'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        backgroundColor: c.status === 'Ativo' ? '#dcfce7' : '#fee2e2', 
                        color: c.status === 'Ativo' ? '#16a34a' : '#ef4444' 
                      }}>
                        {c.status || 'Ativo'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        backgroundColor: '#f1f5f9', 
                        color: '#64748b' 
                      }}>
                        {c.formato}
                      </span>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-neutral text-xs" style={{ color: '#3b82f6', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '0.5rem' }} onClick={() => setViewColab(c)}>
                        <Eye size={12}/> Visualizar
                      </button>
                      <button className="btn btn-neutral text-xs" style={{ color: '#10b981', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => { setMapCenter([c.lat, c.lng]); setMapZoom(10); window.scrollTo({ top: 300, behavior: 'smooth' }); }}>
                        <MapPin size={12}/> Mapa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div style={{ padding: '3rem 0', textAlign: 'center', color: '#94a3b8' }}>
                      <Users size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                      <div className="text-lg font-medium" style={{ color: '#64748b' }}>Nenhum colaborador encontrado</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visualizar Colaborador */}
      {viewColab && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%', position: 'relative' }}>
            <h2 className="text-h3" style={{ marginBottom: '1.5rem', paddingRight: '40px' }}>Detalhes do Colaborador</h2>
            
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                onClick={() => navigate(`/colaboradores?edit=${viewColab.id}`)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex' }}
                title="Editar Colaborador"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => setViewColab(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
                title="Fechar"
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p><strong>Nome:</strong> {viewColab.nome}</p>
              <p><strong>CPF:</strong> {viewColab.cpf}</p>
              <p><strong>Email:</strong> {viewColab.email}</p>
              <p><strong>Telefone:</strong> {viewColab.telefone}</p>
              <p><strong>Cargo:</strong> {viewColab.cargo}</p>
              {viewColab.especialidade && <p><strong>Especialidade:</strong> {viewColab.especialidade}</p>}
              <p><strong>Contrato:</strong> {viewColab.formato}</p>
              <p><strong>Status:</strong> {viewColab.status || 'Ativo'}</p>
              <p><strong>Empresa base:</strong> {viewColab.empresa || 'SPACE'}</p>
              <p><strong>Endereço:</strong> {viewColab.endereco} {viewColab.cidade ? `- ${viewColab.cidade}` : ''} {viewColab.estado ? `/${viewColab.estado}` : ''}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
