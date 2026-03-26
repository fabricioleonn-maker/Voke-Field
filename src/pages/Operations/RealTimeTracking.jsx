import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  Clock, 
  Map as MapIcon, 
  Smartphone, 
  Coffee, 
  User, 
  Search,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Activity,
  Filter,
  ArrowRight
} from 'lucide-react';
import { api } from '../../store/db';
import { 
  getBrasiliaDate, 
  getBrasiliaTodayStr, 
  getBrasiliaDecimalHour, 
  formatBrasiliaFullTime 
} from '../../utils/time';

const HOURS = [];
for (let i = 0; i < 24; i++) {
  HOURS.push((6 + i) % 24);
}

const getLocalToday = (d) => {
  return getBrasiliaTodayStr(d);
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const l1 = Number(lat1);
  const o1 = Number(lon1);
  const l2 = Number(lat2);
  const o2 = Number(lon2);
  
  if (!l1 || !o1 || !l2 || !o2 || l1 === 0 || l2 === 0) return 5; // Default 5km if missing or zero

  const R = 6371; // km
  const dLat = (l2 - l1) * Math.PI / 180;
  const dLon = (o2 - o1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(l1 * Math.PI / 180) * Math.cos(l2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function RealTimeTracking() {
  const [technicians, setTechnicians] = useState([]);
  const [osList, setOsList] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(getBrasiliaDate());
  const [selectedOS, setSelectedOS] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
      setCurrentTime(getBrasiliaDate());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [allColabs, allOS, allBlocks, allClients, allActions] = await Promise.all([
        api.collaborators.list(),
        api.os.list(),
        api.os_blocks.list(),
        api.clients.list(),
        api.techActions.list()
      ]);

      // Map client names and locations to OS
      const osWithDetails = allOS.map(os => {
        const client = allClients.find(c => String(c.id) === String(os.client_id || os.clientId));
        return {
          ...os,
          clientName: client?.nome || 'N/A',
          latitude: client?.latitude || os.latitude,
          longitude: client?.longitude || os.longitude
        };
      });

      // Filter relevant collaborators (CLT/PJ fixo etc)
      const relevantColabs = allColabs.filter(c => {
        const mod = (c.modalidadeContrato || '').toLowerCase();
        return !mod || ['clt', 'pj_fixo', 'pj_freelancer', 'pj', 'independente', 'freelancer', 'fixo'].includes(mod);
      });

      setTechnicians(relevantColabs);
      setOsList(osWithDetails);
      setBlocks(allBlocks);
      setClients(allClients); // Need clients for base location
      setActions(allActions);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const [actions, setActions] = useState([]);

  const [clients, setClients] = useState([]);
  const today = getLocalToday();
  
  const getTimelineSegments = (techId) => {
    const current = getBrasiliaDate();
    const todayStr = getBrasiliaTodayStr();
    const tomorrowDate = getBrasiliaDate();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = getBrasiliaTodayStr(tomorrowDate);
    const hourNow = getBrasiliaDecimalHour(current);

    const techOS = osList.filter(o => {
      const oid = o.collaborator_id || o.technicianId || o.technician_id;
      return String(oid) == String(techId) && (o.date === todayStr || o.date === tomorrowStr);
    }).sort((a, b) => (a.scheduledTime || '00:00').localeCompare(b.scheduledTime || '00:00'));

    const techBlocks = blocks.filter(b => String(b.technicianId) == String(techId) && (b.date === todayStr || b.date === tomorrowStr));
    
    const segments = [];
    
    // Tech Schedule
    const techInfo = technicians.find(t => String(t.id) === String(techId)) || {};
    const workingDays = techInfo.workingDays || [1, 2, 3, 4, 5]; // Default: Mon-Fri
    let shiftStartStr = techInfo.shiftStart || '08:00';
    let shiftEndStr = techInfo.shiftEnd || '18:00';

    const TOLERANCE_ABSENCE = 0.51; // 31 minutes
    
    // Base location (usually "Base Vila Olimpia")
    const baseLoc = clients.find(c => c.nome?.includes('Base')) || { latitude: -23.59, longitude: -46.68 };
    
    // Check if today is a working day
    // JS getDay(): 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
    const currentDayOfWeek = current.getDay(); 
    let isWorkingDay = workingDays.includes(currentDayOfWeek);
    const saturdayMode = techInfo.saturdayMode || 'custom';

    if (currentDayOfWeek === 6 && isWorkingDay) {
       if (saturdayMode === 'half') {
         shiftEndStr = '12:00';
       } else if (saturdayMode === 'custom') {
         shiftStartStr = techInfo.saturdayStart || '08:00';
         shiftEndStr = techInfo.saturdayEnd || '12:00';
       } else if (saturdayMode === 'alternate') {
         const weekId = Math.floor((current.getTime() - current.getTimezoneOffset() * 60000) / (7 * 24 * 60 * 60 * 1000));
         if (weekId % 2 !== 0) {
           isWorkingDay = false;
         }
       }
    }

    const [hStart, mStart] = shiftStartStr.split(':');
    const SHIFT_START = parseInt(hStart) + (parseInt(mStart || 0) / 60);

    const [hEnd, mEnd] = shiftEndStr.split(':');
    const SHIFT_END = parseInt(hEnd) + (parseInt(mEnd || 0) / 60);

    if (!isWorkingDay) {
       segments.push({
         type: 'rest',
         start: Math.min(SHIFT_START, 8),
         duration: Math.max(10, SHIFT_END - Math.min(SHIFT_START, 8)),
         label: 'Dia de Descanso',
         color: '#e2e8f0', // Light gray
         borderColor: '#cbd5e1',
         isRest: true
       });
       return segments;
    }

    // 1. Check for Absence (Request 7.3)
    // If it's SHIFT_START + 00:31 and no activity started (no check-in or displacement)
    const techActions = actions.filter(a => String(a.techId) === String(techId) && a.date === todayStr);
    const hasFaltaAction = techActions.some(a => a.type === 'FALTA');
    
    const firstOS = techOS[0];
    const techStarted = techActions.some(a => ['CHECK-IN', 'DESLOCAMENTO'].includes(a.type.toUpperCase()));
    
    if (hourNow > (SHIFT_START + TOLERANCE_ABSENCE) && !techStarted && !hasFaltaAction && todayStr === today) {
       // Only if no OS is already in progress or completed
       const inField = techOS.some(o => ['Em Execução', 'Concluído', 'Aprovação'].includes(o.status));
       if (!inField) {
         
         const toleranceTimeStr = (() => {
           let min = parseInt(mStart || 0) + 31;
           let hr = parseInt(hStart);
           if (min >= 60) {
             hr += 1;
             min -= 60;
           }
           return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
         })();

         segments.push({
           type: 'action',
           start: SHIFT_START,
           duration: Math.min(hourNow - SHIFT_START, 24),
           label: 'FALTA AUTOMÁTICA (30m TOLERÂNCIA)',
           color: '#ef4444',
           isAction: true,
           reason: `Técnico não iniciou atividade até as ${toleranceTimeStr}`
         });
         return segments;
       }
    }

    let pointer = SHIFT_START;
    let lastLoc = baseLoc;

    techOS.forEach((os, index) => {
      if (!os.scheduledTime) return;
      const [h, m] = os.scheduledTime.split(':');
      let targetStart = parseInt(h) + (parseInt(m || 0) / 60);
      if (targetStart < 6 && os.date !== todayStr) targetStart += 24;

      // Calculate travel time (Request 5 and 7.1) - Apenas a partir da segunda OS (index > 0)
      let totalTravelNeeded = 0;
      let dist = 0;
      
      if (index > 0) {
        dist = calculateDistance(lastLoc.latitude, lastLoc.longitude, os.latitude, os.longitude);
        // Heuristic: 40km/h + 15 min margin (margem de folga)
        const travelCommute = (dist / 40); 
        const travelMargin = (15 / 60); 
        totalTravelNeeded = travelCommute + travelMargin;
      }
      
      const travelStart = targetStart - totalTravelNeeded;

      // 1. Idle time (Ocioso) - Request 6
      if (travelStart > pointer) {
        segments.push({
          type: 'idle',
          start: pointer,
          duration: travelStart - pointer,
          label: 'Tempo Ocioso',
          color: '#ffffff',
          borderColor: '#cbd5e1',
          isIdle: true
        });
      }

      // 2. Travel time (Deslocamento) - Request 5 & 7 (Apenas entre OSs)
      if (index > 0) {
        const actualTravelStart = Math.max(pointer, travelStart);
        const actualTravelDuration = targetStart - actualTravelStart;
        
        if (actualTravelDuration > 0) {
          segments.push({
            type: 'travel',
            start: actualTravelStart,
            duration: actualTravelDuration,
            label: `Deslocamento (${Math.round(dist)}km)`,
            color: '#fde047',
            borderColor: '#eab308'
          });
        }
      }

      // 3. OS activity
      // Duration is 2h by default (Request 3.3) or until checkout
      let duration = 2.0;
      if (os.status === 'Concluído' || os.status === 'Aprovação' || os.status === 'Encerrado') {
          // If we had real checkin/checkout times in OS object, we'd use them.
          // For now, keep 2h or use a slightly varied duration if history exists
          const checkout = os.history?.find(h => h.status === 'Concluído')?.timestamp;
          if (checkout) {
              const checkDate = new Date(checkout);
              const checkHour = getBrasiliaDecimalHour(checkDate);
              duration = Math.max(0.5, checkHour - targetStart);
          }
      }

      segments.push({
        type: 'os',
        start: targetStart,
        duration,
        label: `${os.code || 'OS'} - ${os.clientName || os.client || 'N/A'}`,
        status: os.status,
        code: os.code,
        clientName: os.clientName || os.client || 'N/A',
        description: os.description,
        color: os.status === 'Concluído' || os.status === 'Aprovação' || os.status === 'Encerrado' ? '#10b981' : (os.status === 'Em Execução' ? '#3b82f6' : '#94a3b8')
      });

      pointer = targetStart + duration;
      lastLoc = { latitude: os.latitude, longitude: os.longitude };
    });

    // Handle blocks (Lunch etc) - overlay OR insert
    techBlocks.forEach(b => {
      let start = parseInt(b.startTime.split(':')[0]) + (parseInt(b.startTime.split(':')[1]) / 60);
      let end = parseInt(b.endTime.split(':')[0]) + (parseInt(b.endTime.split(':')[1]) / 60);
      if (start < 6 && b.date !== todayStr) start += 24;
      if (end < 6 && b.date !== todayStr) end += 24;

      segments.push({
        type: 'block',
        start,
        duration: end - start,
        label: b.type,
        color: '#64748b'
      });
    });

    // Handle Manager Actions (Overlay)
    techActions.forEach(a => {
      let start = parseInt(a.time.split(':')[0]) + (parseInt(a.time.split(':')[1]) / 60);
      let duration = 0.5; // Default 30 min marking for these points? Or until end?
      // If type is DISPENSADO, it might be until end of day (e.g. 5:00 next day)
      if (a.type === 'DISPENSADO') duration = 30 - start; 
      
      segments.push({
        type: 'action',
        start,
        duration: Math.max(0.5, duration),
        label: a.type,
        reason: a.reason,
        color: a.type === 'FALTA' ? '#ef4444' : a.type === 'FALTA_PARCIAL' ? '#991b1b' : '#06b6d4',
        isAction: true
      });
    });

    return segments;
  };

  const getCurrentPos = () => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    let val = h + (m / 60);
    
    // Adjust for 06:00 offset
    if (val < 6) val += 24;
    
    const percentage = ((val - 6) / 24) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const getTechStatus = (techId) => {
    const tech = technicians.find(t => String(t.id) === String(techId));
    const isActuallyOnline = tech?.lastSeen && (Date.now() - tech.lastSeen < 120000); // 2 min tolerance

    const todayStr = getBrasiliaTodayStr();
    const techOS = osList.filter(o => {
      const oid = o.collaborator_id || o.technicianId || o.technician_id;
      return String(oid) == String(techId) && o.date === todayStr;
    });
    
    const now = getBrasiliaDecimalHour(currentTime);
    
    // Find OS that is currently within its scheduled time (plus some buffer)
    const active = techOS.find(os => {
      if (!os.scheduledTime) return false;
      const [h, m] = os.scheduledTime.split(':');
      const start = parseInt(h) + (parseInt(m || 0) / 60);
      return now >= start && now <= start + 1.5;
    });

    const techBlocks = blocks.filter(b => String(b.technicianId) == String(techId) && b.date === todayStr);
    const inPause = techBlocks.find(b => {
      if (!b.startTime || !b.endTime) return false;
      const start = parseInt(b.startTime.split(':')[0]) + (parseInt(b.startTime.split(':')[1]) / 60);
      const end = parseInt(b.endTime.split(':')[0]) + (parseInt(b.endTime.split(':')[1]) / 60);
      return now >= start && now <= end;
    });

    let status = { label: 'Offline', color: '#94a3b8', isOnline: isActuallyOnline };

    if (active) {
       status = { 
         label: active.status === 'Em Execução' ? 'Em Atendimento' : 'Em Trânsito', 
         color: '#3b82f6',
         isOnline: isActuallyOnline 
       };
    } else if (inPause) {
       status = { label: 'Em Pausa', color: '#64748b', isOnline: isActuallyOnline };
    } else if (isActuallyOnline) {
       status = { label: 'Disponível', color: '#10b981', isOnline: isActuallyOnline };
    }

    return status;
  };

  return (
    <div className="content-wrapper" style={{ backgroundColor: '#f8fafc' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="text-h2">Rastro do Dia</h1>
          <p className="text-muted">Acompanhamento horizontal das atividades e deslocamentos em tempo real</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="stat-card" style={{ padding: '0.75rem 1.25rem', flexDirection: 'row', alignItems: 'center', gap: '1rem', border: '1px solid #e2e8f0' }}>
            <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '0.5rem', borderRadius: '8px' }}>
              <Activity size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {technicians.filter(t => getTechStatus(t.id).isOnline).length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Técnicos Online</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1.25rem', flexDirection: 'row', alignItems: 'center', gap: '1rem', border: '1px solid #e2e8f0' }}>
            <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '0.5rem', borderRadius: '8px' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {technicians.filter(t => !getTechStatus(t.id).isOnline).length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>Técnicos Offline</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1.25rem', minWidth: '150px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Horário Local (Brasília)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
              {formatBrasiliaFullTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Pesquisar técnico..." 
              className="input-field" 
              style={{ paddingLeft: '2.75rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b', marginRight: '1rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }}></span> Atendimento
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fde047' }}></span> Deslocamento
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#64748b' }}></span> Pausa
            </div>
            <button className="btn btn-secondary"><Filter size={18} /> Filtros</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '1000px' }}>
            {/* Header Timeline */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ width: '250px', padding: '1rem', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>Técnico</div>
              <div style={{ flex: 1, position: 'relative', height: '45px' }}>
                {HOURS.map((h, i) => (
                  <div key={i} style={{ 
                    position: 'absolute', 
                    left: `${(i * 100) / 24}%`, 
                    top: 0, 
                    bottom: 0, 
                    width: '1px', 
                    background: '#e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '12px' }}>{h.toString().padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            {technicians.filter(t => (t.nome || '').toLowerCase().includes((searchTerm || '').toLowerCase())).map(tech => {
              const segments = getTimelineSegments(tech.id);
              
              const workingDays = tech.workingDays || [1, 2, 3, 4, 5];
              let isWorkingDay = currentTime && workingDays.includes(currentTime.getDay());
              
              let shiftStartStr = tech.shiftStart || '08:00';
              let shiftEndStr = tech.shiftEnd || '18:00';
              const saturdayMode = tech.saturdayMode || 'custom';

              if (currentTime && currentTime.getDay() === 6 && isWorkingDay) {
                 if (saturdayMode === 'half') {
                   shiftEndStr = '12:00';
                 } else if (saturdayMode === 'custom') {
                   shiftStartStr = tech.saturdayStart || '08:00';
                   shiftEndStr = tech.saturdayEnd || '12:00';
                 } else if (saturdayMode === 'alternate') {
                   const weekId = Math.floor((currentTime.getTime() - currentTime.getTimezoneOffset() * 60000) / (7 * 24 * 60 * 60 * 1000));
                   if (weekId % 2 !== 0) {
                     isWorkingDay = false;
                   }
                 }
              }

              const [hS, mS] = shiftStartStr.split(':');
              const shiftStartVal = parseInt(hS) + (parseInt(mS || 0) / 60);
              const [hE, mE] = shiftEndStr.split(':');
              const shiftEndVal = parseInt(hE) + (parseInt(mE || 0) / 60);

              const leftStart = ((shiftStartVal - 6) / 24) * 100;
              const leftEnd = ((shiftEndVal - 6) / 24) * 100;

              return (
                <div key={tech.id} style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', minHeight: '80px', alignItems: 'center' }}>
                  <div style={{ width: '250px', padding: '1rem', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden' }}>
                      {tech.foto ? <img src={tech.foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} style={{ margin: '10px', color: '#94a3b8' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tech.nome}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{tech.cargo || 'Field Engineer'}</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '40px', margin: '0 1rem' }}>
                    {/* Background grid */}
                    {HOURS.map((h, i) => (
                      <div key={i} style={{ position: 'absolute', left: `${(i * 100) / 24}%`, top: 0, bottom: 0, width: '1px', background: '#f1f5f9' }}></div>
                    ))}

                    {/* Segments */}
                    {segments.map((seg, idx) => (
                        <div 
                          key={idx}
                          className="timeline-segment"
                          style={{
                            position: 'absolute',
                            left: `${((seg.start - 6) / 24) * 100}%`,
                            width: `${(seg.duration / 24) * 100}%`,
                            top: '4px',
                            bottom: '4px',
                            backgroundColor: seg.color,
                            border: seg.borderColor ? `1px dashed ${seg.borderColor}` : '1px solid rgba(0,0,0,0.05)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 8px',
                            fontSize: '0.65rem',
                            color: seg.isIdle ? '#94a3b8' : 'white',
                            fontWeight: 700,
                            overflow: 'visible',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            zIndex: seg.type === 'os' ? 2 : 1,
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            if (seg.type === 'os') {
                               // Find the full OS object to get all details
                               const fullOS = osList.find(o => o.code === seg.code || (o.id && String(o.id) === String(seg.id)));
                               setSelectedOS(fullOS || seg);
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
                            {seg.type === 'os' && <Activity size={10} style={{ marginRight: '4px', flexShrink: 0 }} />}
                            {seg.type === 'block' && !seg.isIdle && <Coffee size={10} style={{ marginRight: '4px', flexShrink: 0 }} />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{seg.label}</span>
                          </div>

                          <div className="os-tooltip">
                            <div style={{ fontWeight: 700, marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>{seg.label}</div>
                            <div style={{ marginBottom: '2px' }}><strong>Duração:</strong> {Math.floor(seg.duration)}h {Math.round((seg.duration % 1) * 60)}m</div>
                            
                            {seg.type === 'os' ? (
                              <>
                                <div style={{ marginBottom: '2px' }}><strong>ID:</strong> {seg.code}</div>
                                <div style={{ marginBottom: '2px' }}><strong>Cliente Final:</strong> {seg.clientName}</div>
                                <div style={{ marginBottom: '2px' }}><strong>Status:</strong> {seg.status}</div>
                                <div style={{ opacity: 0.9, marginTop: '4px', fontStyle: 'italic', whiteSpace: 'normal' }}>{seg.description}</div>
                              </>
                            ) : seg.isAction ? (
                              <div style={{ opacity: 0.9, marginTop: '4px', whiteSpace: 'normal' }}><strong>Motivo:</strong> {seg.reason}</div>
                            ) : seg.isIdle ? (
                              <div style={{ opacity: 0.8, marginTop: '4px' }}>Tempo de espera ou disponibilidade entre atendimentos.</div>
                            ) : seg.type === 'travel' ? (
                              <div style={{ opacity: 0.8, marginTop: '4px' }}>Deslocamento previsto considerando tráfego e margem de 15min.</div>
                            ) : (
                              <div style={{ opacity: 0.8, marginTop: '4px' }}>Bloqueio de agenda ou pausa registrada.</div>
                            )}
                          </div>
                        </div>
                    ))}

                    {/* Shift Indicators */}
                    {isWorkingDay && (
                      <>
                        {/* Start Shift (Green) */}
                        <div style={{ 
                          position: 'absolute', 
                          left: `${leftStart}%`, 
                          top: '-10px', 
                          bottom: '-10px', 
                          width: '2px', 
                          backgroundColor: '#10b981', 
                          zIndex: 10,
                          boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                        }} title={`Início da Jornada: ${shiftStartStr}`}>
                          <div style={{ position: 'absolute', top: '-5px', left: '-4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                        </div>

                        {/* End Shift (Red) */}
                        <div style={{ 
                          position: 'absolute', 
                          left: `${leftEnd}%`, 
                          top: '-10px', 
                          bottom: '-10px', 
                          width: '2px', 
                          backgroundColor: '#ef4444', 
                          zIndex: 10,
                          boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
                        }} title={`Término da Jornada: ${shiftEndStr}`}>
                          <div style={{ position: 'absolute', top: '-5px', left: '-4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                        </div>
                      </>
                    )}
                    
                    {/* Current Time Indicator (Global-like) */}
                    <div style={{ 
                      position: 'absolute', 
                      left: `${getCurrentPos()}%`, 
                      top: '0px', 
                      bottom: '0px', 
                      width: '2px', 
                      backgroundColor: 'rgba(59, 130, 246, 0.5)', 
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* OS Details Modal */}
      {selectedOS && (
        <div className="modal-overlay" onClick={() => setSelectedOS(null)}>
          <div className="card modal-card" style={{ maxWidth: '500px', width: '95%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedOS(null)}>&times;</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#0ea5e915', color: '#0ea5e9', padding: '0.75rem', borderRadius: '12px' }}>
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-h3" style={{ marginBottom: 0 }}>{selectedOS.project || selectedOS.label}</h2>
                <p className="text-muted">{selectedOS.code || 'OS'}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                <User size={16} className="text-muted" /> <strong>Técnico:</strong> {technicians.find(t => String(t.id) === String(selectedOS.collaborator_id || selectedOS.technician_id))?.nome || 'N/A'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                <Clock size={16} className="text-muted" /> <strong>Horário:</strong> {selectedOS.scheduledTime || 'N/A'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                <MapIcon size={16} className="text-muted" /> <strong>Cliente:</strong> {selectedOS.clientName || selectedOS.client || 'N/A'}
              </div>
              <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
                <strong>Descrição:</strong><br/>
                {selectedOS.description || 'Sem descrição.'}
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedOS(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
        }
        .modal-card {
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalSlideUp 0.3s ease-out;
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #64748b;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .modal-close:hover {
          background: #f1f5f9;
          color: #1e293b;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .timeline-segment:hover {
          filter: brightness(1.1);
          z-index: 10;
        }
        .timeline-segment:hover .os-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .os-tooltip {
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%) translateY(5px);
          z-index: 1000;
          background: #1e293b;
          color: white;
          padding: 12px;
          border-radius: 8px;
          width: 240px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          font-size: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          text-align: left;
          line-height: 1.4;
        }
        .os-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -6px;
          border-width: 6px;
          border-style: solid;
          border-color: #1e293b transparent transparent transparent;
        }
      `}</style>
    </div>
  );
}
