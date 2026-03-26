import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Search,
  Filter,
  Plus,
  Info,
  Coffee,
  MoreVertical,
  MapPin,
  Phone,
  Activity,
  CalendarDays,
  LayoutGrid,
  X,
  Smartphone,
  CheckCircle,
  Play,
  Maximize2,
  Edit3,
  ArrowRightLeft,
  XCircle,
  GripVertical,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../store/db';
import { useToast } from '../../components/Toast';
import {
  getBrasiliaDate,
  getBrasiliaTodayStr,
  getBrasiliaDecimalHour,
  formatBrasiliaTime
} from '../../utils/time';

const HOURS = [];
for (let i = 0; i < 24; i++) {
  HOURS.push((6 + i) % 24);
}

const CATEGORIES = [
  { id: 'clt', label: 'CLT', color: '#db2777' },
  { id: 'pj_fixo', label: 'FIXO', color: '#a855f7' },
  { id: 'pj_freelancer', label: 'FREELANCER', color: '#ec4899' },
];

// Timeline width: 100px per hour * 24 hours = 2400px
const TIMELINE_WIDTH = 2400;
const PX_PER_HOUR = TIMELINE_WIDTH / 24;

const BLOCK_TYPES = [
  { value: 'TREINAMENTO', label: 'Treinamento' },
  { value: 'REUNIÃO', label: 'Reunião' },
  { value: 'ALMOÇO', label: 'Almoço (Extra/Deslocamento)' },
  { value: 'FALTA_JUSTIFICADA', label: 'Falta Justificada' },
  { value: 'OUTROS', label: 'Outros' },
];

// Helper to get day of month
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const getLocalToday = (d) => {
  return getBrasiliaTodayStr(d);
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const l1 = Number(lat1);
  const o1 = Number(lon1);
  const l2 = Number(lat2);
  const o2 = Number(lon2);
  if (!l1 || !o1 || !l2 || !o2 || l1 === 0 || l2 === 0) return 5;
  const R = 6371;
  const dLat = (l2 - l1) * Math.PI / 180;
  const dLon = (o2 - o1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(l1 * Math.PI / 180) * Math.cos(l2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function MiniCalendar({ selectedDate, onSelectDate }) {
  const dateStr = selectedDate || getBrasiliaTodayStr();
  const date = getBrasiliaDate(new Date(dateStr + 'T12:00:00'));
  const [viewDate, setViewDate] = useState(date);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = viewDate.toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const prevMonth = () => setViewDate(getBrasiliaDate(new Date(year, month - 1, 1)));
  const nextMonth = () => setViewDate(getBrasiliaDate(new Date(year, month + 1, 1)));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isSelected = (d) => {
    if (!d) return false;
    const check = getLocalToday(new Date(year, month, d));
    return check === selectedDate;
  };

  const isToday = (d) => {
    if (!d) return false;
    const today = getLocalToday();
    const check = getLocalToday(new Date(year, month, d));
    return check === today;
  };

  return (
    <div className="mini-calendar" style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={prevMonth} className="btn-icon"><ChevronLeft size={16} /></button>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{capitalizedMonth} {year}</span>
        <button onClick={nextMonth} className="btn-icon"><ChevronRight size={16} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} style={{ padding: '5px' }}>{d}</div>)}
        {days.map((d, i) => (
          <div
            key={i}
            onClick={() => d && onSelectDate(new Date(year, month, d).toLocaleDateString('en-CA'))}
            style={{
              padding: '8px 0',
              cursor: d ? 'pointer' : 'default',
              borderRadius: '6px',
              backgroundColor: isSelected(d) ? '#3b82f6' : 'transparent',
              color: isSelected(d) ? 'white' : (isToday(d) ? '#3b82f6' : 'inherit'),
              fontWeight: isSelected(d) || isToday(d) ? 700 : 400,
              fontSize: '0.8rem'
            }}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Scheduling() {
  const navigate = useNavigate();
  const toast = useToast();
  const timelineScrollRef = useRef(null);
  const [date, setDate] = useState(getLocalToday());
  const [collaborators, setCollaborators] = useState([]);
  const [osList, setOsList] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedOS, setSelectedOS] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategories, setActiveCategories] = useState(CATEGORIES.map(c => c.id));
  const [currentTime, setCurrentTime] = useState(getBrasiliaDate());

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null); // { os, x, y }
  const [editingTime, setEditingTime] = useState(null); // { osId, value }
  const [transferMenu, setTransferMenu] = useState(null); // { osId }

  // Drag state
  const [dragging, setDragging] = useState(null); // { osId, techId, startX, origHour }

  // Block Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    technicianId: '',
    date: getLocalToday(),
    startTime: '08:00',
    endTime: '12:00',
    type: 'TREINAMENTO',
    reason: ''
  });

  const isToday = date === getBrasiliaTodayStr();
  const isPast = date < getBrasiliaTodayStr();

  // Auto-refresh every 30s if viewing today
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (date === getBrasiliaTodayStr()) {
        loadData();
        setCurrentTime(getBrasiliaDate());
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [date]);

  const hasAutoScrolled = useRef(false);

  // Scroll to 07:30 on mount (0px = 06:00, so 150px offset)
  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      if (timelineScrollRef.current && !hasAutoScrolled.current) {
        // Only scroll if the container actually has the overflowing content inside
        if (timelineScrollRef.current.scrollWidth > timelineScrollRef.current.clientWidth) {
          timelineScrollRef.current.scrollTo({ left: 150, behavior: 'smooth' });
          hasAutoScrolled.current = true;
          clearInterval(interval);
        }
      }
      attempts++;
      if (attempts > 50) clearInterval(interval); // Give up after 5 seconds
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => { setContextMenu(null); setTransferMenu(null); };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const loadData = async () => {
    const current = getBrasiliaDate(new Date(date + 'T12:00:00'));
    const next = getBrasiliaDate(new Date(current));
    next.setDate(next.getDate() + 1);
    const nextDateStr = getBrasiliaTodayStr(next);

    const [allColabs, allOS, allBlocks, allClients] = await Promise.all([
      api.collaborators.list(),
      api.os.list(),
      api.os_blocks.list(),
      api.clients.list()
    ]);

    // Map client names to OS
    const osWithClients = allOS.map(os => {
      const clientIdStr = String(os.client_id || os.clientId);
      const matchedClient = allClients.find(c => String(c.id) === clientIdStr);
      return {
        ...os,
        clientName: matchedClient?.nome || os.client || 'N/A'
      };
    });

    setCollaborators(allColabs);
    setOsList(osWithClients);
    setBlocks(allBlocks);
    setClients(allClients);
    console.log('[Agenda] Loaded:', osWithClients.length, 'OS, viewing date:', date);
    console.log('[Agenda] OS dates:', osWithClients.map(o => ({ code: o.code, date: o.date, normalizedDate: normalizeDate(o.date), colabId: o.collaborator_id || o.technicianId })));
    console.log('[Agenda] Blocks:', allBlocks.length, allBlocks.map(b => ({ techId: b.technicianId, date: b.date, type: b.type })));
    console.log('[Agenda] Collaborators lunch:', allColabs.map(c => ({ name: c.nome, lunchStart: c.lunchStart, lunchEnd: c.lunchEnd })));
    loadTechActions();
  };

  const [techActions, setTechActions] = useState([]);
  const loadTechActions = async () => {
    const list = await api.techActions.list();
    setTechActions(list.filter(a => a.date === date));
  };

  const handleTechAction = async (techId, type) => {
    const reason = window.prompt(`Motivo para ${type}:`, '');
    if (reason === null) return;

    await api.techActions.create({
      techId,
      date,
      type,
      reason,
      time: formatBrasiliaTime()
    });
    toast.success(`Ação ${type} registrada com sucesso.`);
    loadTechActions();
  };

  const [editingEndTime, setEditingEndTime] = useState(null);

  // --- Conflict Validation ---
  const checkTimeConflict = (techId, newTime, osId, osAddress) => {
    const techOS = osList.filter(o => {
      const oid = o.collaborator_id || o.technicianId || o.technician_id;
      return String(oid) === String(techId) && normalizeDate(o.date) === date && String(o.id) !== String(osId);
    });

    for (const existingOS of techOS) {
      if (!existingOS.scheduledTime) continue;
      if (existingOS.scheduledTime === newTime) {
        const sameAddress = osAddress && existingOS.address && osAddress === existingOS.address;
        const sameClient = osAddress && existingOS.clientId && String(existingOS.clientId) === String(osAddress);
        if (!sameAddress && !sameClient) {
          return existingOS;
        }
      }
    }
    return null;
  };

  const normalizeDate = (d) => {
    if (!d) return '';
    if (d.includes('/')) {
      const parts = d.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return d;
  };

  // --- OS Management Handlers ---
  const updateOSTime = async (osId, newTime, newEndTime) => {
    try {
      const os = osList.find(o => String(o.id) === String(osId));
      const techId = os?.collaborator_id || os?.technicianId || os?.technician_id;

      const conflict = checkTimeConflict(techId, newTime, osId, os?.address);
      if (conflict) {
        toast.error(`Conflito! O técnico já tem a OS ${conflict.code || conflict.id} agendada para ${newTime} em outro endereço.`);
        return;
      }

      const updates = { scheduledTime: newTime };
      if (newEndTime) updates.endDate = `${date}T${newEndTime}:00`;

      await api.os.update(osId, updates);
      toast.success(`Horário atualizado com sucesso`);
      setContextMenu(null);
      setEditingTime(null);
      setEditingEndTime(null);
      loadData();
    } catch (err) {
      toast.error('Erro ao atualizar horário.');
    }
  };

  const transferOS = async (osId, newTechId) => {
    try {
      const techName = collaborators.find(c => String(c.id) === String(newTechId))?.nome || '';
      await api.os.update(osId, { collaborator_id: newTechId, technicianId: newTechId, technician_id: newTechId });
      toast.success(`OS transferida para ${techName}`);
      setContextMenu(null);
      setTransferMenu(null);
      loadData();
    } catch (err) {
      toast.error('Erro ao transferir OS.');
    }
  };

  const cancelOS = async (osId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta OS?')) return;
    try {
      await api.os.update(osId, { status: 'Cancelado' });
      toast.success('OS cancelada.');
      setContextMenu(null);
      loadData();
    } catch (err) {
      toast.error('Erro ao cancelar OS.');
    }
  };

  // --- Drag & Drop ---
  const handleDragStart = (e, os, techId) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ osId: os.id, techId, code: os.code, scheduledTime: os.scheduledTime }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetTechId, timelineEl) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const rect = timelineEl.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineEl.scrollLeft;
      // Convert pixel position to hour (06:00 = 0px, 07:00 = PX_PER_HOUR, etc.)
      const decimalHour = 6 + (x / PX_PER_HOUR);
      const newHour = Math.floor(decimalHour);
      const newMinutes = Math.round((decimalHour - newHour) * 60 / 15) * 15; // Snap to 15min
      const newTime = `${newHour.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;

      // Validate conflict
      const draggedOS = osList.find(o => String(o.id) === String(data.osId));
      const conflict = checkTimeConflict(targetTechId, newTime, data.osId, draggedOS?.address);
      if (conflict) {
        toast.error(`Conflito! O técnico já tem a OS ${conflict.code || conflict.id} agendada para ${newTime} em outro endereço.`);
        return;
      }

      const updates = { scheduledTime: newTime };
      if (String(data.techId) !== String(targetTechId)) {
        updates.collaborator_id = targetTechId;
        updates.technicianId = targetTechId;
        updates.technician_id = targetTechId;
      }

      await api.os.update(data.osId, updates);

      const techName = collaborators.find(c => String(c.id) === String(targetTechId))?.nome || '';
      toast.success(`OS ${data.code} movida para ${techName} às ${newTime}`);
      loadData();
    } catch (err) {
      toast.error('Erro ao mover OS.');
    }
  };

  // --- Tech Status Helper ---
  const getTechStatus = (techId) => {
    const actions = techActions.filter(a => String(a.techId) === String(techId));
    const falta = actions.find(a => a.type === 'FALTA');
    const faltaParcial = actions.find(a => a.type === 'FALTA_PARCIAL');
    const dispensado = actions.find(a => a.type === 'DISPENSADO');
    if (falta) return { type: 'FALTA', label: 'FALTA', color: '#ef4444', bgColor: '#fef2f2' };
    if (faltaParcial) return { type: 'FALTA_PARCIAL', label: 'FALTA PARCIAL', color: '#991b1b', bgColor: '#fef2f2' };
    if (dispensado) return { type: 'DISPENSADO', label: 'DISPENSADO', color: '#06b6d4', bgColor: '#ecfeff' };

    // Virtual absence calculation
    const hourNow = date === getBrasiliaTodayStr()
      ? getBrasiliaDecimalHour(getBrasiliaDate())
      : (date < getBrasiliaTodayStr() ? 24 : 0);

    if (hourNow > 0) {
      const techInfo = collaborators.find(t => String(t.id) === String(techId)) || {};
      let shiftStartStr = techInfo.shiftStart || '08:00';
      const viewDateObj = getBrasiliaDate(new Date(date + 'T12:00:00'));
      const isWorkingDay = (techInfo.workingDays || [1, 2, 3, 4, 5]).includes(viewDateObj.getDay());

      if (viewDateObj.getDay() === 6 && isWorkingDay) {
        if ((techInfo.saturdayMode || 'custom') === 'custom') {
          shiftStartStr = techInfo.saturdayStart || '08:00';
        }
      }

      const [hStart, mStart] = shiftStartStr.split(':');
      const SHIFT_START = parseInt(hStart) + (parseInt(mStart || 0) / 60);
      const techStarted = actions.some(a => ['CHECK-IN', 'DESLOCAMENTO'].includes(a.type.toUpperCase()));

      const inField = osList.some(o => {
        const oid = o.collaborator_id || o.technicianId || o.technician_id;
        return String(oid) === String(techId) && normalizeDate(o.date) === date && ['Em Execução', 'Concluído', 'Aprovação'].includes(o.status);
      });

      if (isWorkingDay && hourNow > (SHIFT_START + 0.5) && !techStarted && !inField) {
        return { type: 'FALTA', label: 'FALTA (NÃO INICIOU)', color: '#ef4444', bgColor: '#fef2f2' };
      }
    }

    return null;
  };

  const getTimelineSegments = (techId) => {
    const viewDateObj = getBrasiliaDate(new Date(date + 'T12:00:00'));
    const tomorrowObj = new Date(viewDateObj);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = getBrasiliaTodayStr(tomorrowObj);

    // We don't really care about "hourNow" for calculating absence here since it's historical/future scheduling,
    // but we'll use a mocked logic if viewing today.
    const hourNow = date === getBrasiliaTodayStr()
      ? getBrasiliaDecimalHour(getBrasiliaDate())
      : (date < getBrasiliaTodayStr() ? 24 : 0);

    const techOS = osList.filter(o => {
      const oid = o.collaborator_id || o.technicianId || o.technician_id;
      const oDate = normalizeDate(o.date);
      return String(oid) == String(techId) && (oDate === date || oDate === tomorrowStr);
    }).sort((a, b) => (a.scheduledTime || '00:00').localeCompare(b.scheduledTime || '00:00'));

    const techBlocks = blocks.filter(b => {
      const bDate = normalizeDate(b.date);
      return String(b.technicianId) == String(techId) && (bDate === date || bDate === tomorrowStr);
    });

    const segments = [];
    const techInfo = collaborators.find(t => String(t.id) === String(techId)) || {};
    const workingDays = techInfo.workingDays || [1, 2, 3, 4, 5];
    let shiftStartStr = techInfo.shiftStart || '08:00';
    let shiftEndStr = techInfo.shiftEnd || '18:00';

    const baseLoc = clients.find(c => c.nome?.includes('Base')) || { latitude: -23.59, longitude: -46.68 };

    const viewDayOfWeek = viewDateObj.getDay();
    let isWorkingDay = workingDays.includes(viewDayOfWeek);
    const saturdayMode = techInfo.saturdayMode || 'custom';

    if (viewDayOfWeek === 6 && isWorkingDay) {
      if (saturdayMode === 'half') shiftEndStr = '12:00';
      else if (saturdayMode === 'custom') {
        shiftStartStr = techInfo.saturdayStart || '08:00';
        shiftEndStr = techInfo.saturdayEnd || '12:00';
      } else if (saturdayMode === 'alternate') {
        const weekId = Math.floor((viewDateObj.getTime() - viewDateObj.getTimezoneOffset() * 60000) / (7 * 24 * 60 * 60 * 1000));
        if (weekId % 2 !== 0) isWorkingDay = false;
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
        color: '#f8fafc',
        borderColor: '#e2e8f0',
        isRest: true
      });
      return segments;
    }

    let pointer = SHIFT_START;
    let lastLoc = baseLoc;

    techOS.forEach((os, index) => {
      if (!os.scheduledTime) return;
      const [h, m] = os.scheduledTime.split(':');
      let targetStart = parseInt(h) + (parseInt(m || 0) / 60);
      if (targetStart < 6 && os.date !== date) targetStart += 24;

      let totalTravelNeeded = 0;
      let dist = 0;
      if (index > 0) {
        dist = calculateDistance(lastLoc.latitude, lastLoc.longitude, os.latitude, os.longitude);
        totalTravelNeeded = (dist / 40) + (15 / 60);
      }

      const travelStart = targetStart - totalTravelNeeded;

      if (travelStart > pointer) {
        segments.push({
          type: 'idle',
          start: pointer,
          duration: travelStart - pointer,
          label: 'Tempo Ocioso',
          color: '#f1f5f9',
          borderColor: '#cbd5e1',
          isIdle: true
        });
      }

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

      let duration = 2.0;

      if (os.endDate) {
        try {
          const endObj = new Date(os.endDate);
          const endHour = getBrasiliaDecimalHour(endObj);
          duration = Math.max(0.5, endHour - targetStart);
        } catch (e) { }
      }

      if (os.status === 'Concluído' || os.status === 'Aprovação' || os.status === 'Encerrado') {
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
        endTime: os.endDate ? os.endDate.split('T')[1]?.substring(0, 5) : null,
        color: os.status === 'Concluído' || os.status === 'Aprovação' || os.status === 'Encerrado' ? '#10b981' : (os.status === 'Em Execução' ? '#3b82f6' : '#475569'),
        id: os.id
      });

      pointer = targetStart + duration;
      lastLoc = { latitude: os.latitude, longitude: os.longitude };
    });

    techBlocks.forEach(b => {
      let start = parseInt(b.startTime.split(':')[0]) + (parseInt(b.startTime.split(':')[1]) / 60);
      let end = parseInt(b.endTime.split(':')[0]) + (parseInt(b.endTime.split(':')[1]) / 60);
      const bDate = normalizeDate(b.date);
      if (start < 6 && bDate !== date) start += 24;
      if (end < 6 && bDate !== date) end += 24;
      const isLunch = b.type === 'ALMOÇO';
      segments.push({
        type: 'block',
        start,
        duration: end - start,
        label: b.type,
        color: isLunch ? '#22c55e' : '#64748b',
        reason: b.reason || b.description
      });
    });

    // Auto-generate lunch block from collaborator settings if no lunch block exists for this day
    const hasLunchBlock = techBlocks.some(b => b.type === 'ALMOÇO');

    let lStartStr = techInfo.lunchStart;
    let lEndStr = techInfo.lunchEnd;
    const modalidade = (techInfo.modalidadeContrato || '').toLowerCase();

    // Fallback: If CLT or FIXO, guarantee a default lunch block even if not registered
    if ((!lStartStr || !lEndStr) && (modalidade === 'clt' || modalidade === 'fixo')) {
      lStartStr = '12:00';
      lEndStr = '13:00';
    }

    if (!hasLunchBlock && isWorkingDay && lStartStr && lEndStr) {
      const lStart = parseInt(lStartStr.split(':')[0]) + (parseInt(lStartStr.split(':')[1] || 0) / 60);
      const lEnd = parseInt(lEndStr.split(':')[0]) + (parseInt(lEndStr.split(':')[1] || 0) / 60);
      segments.push({
        type: 'block',
        start: lStart,
        duration: lEnd - lStart,
        label: 'ALMOÇO',
        color: '#22c55e',
        reason: 'Horário de almoço (Automático)'
      });
    }

    techActions.filter(a => String(a.techId) === String(techId)).forEach(a => {
      let start = parseInt(a.time.split(':')[0]) + (parseInt(a.time.split(':')[1]) / 60);
      let duration = a.type === 'DISPENSADO' ? 30 - start : 0.5;
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

  const filteredColabs = collaborators.filter(c => {
    const matchesSearch = (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
    let modalidade = (c.modalidadeContrato || 'clt').toLowerCase();

    if (modalidade === 'pj' || modalidade === 'independente' || modalidade === 'freelancer') {
      modalidade = 'pj_freelancer';
    } else if (modalidade === 'fixo') {
      modalidade = 'pj_fixo';
    }

    if (activeCategories.length > 0 && !activeCategories.includes(modalidade)) return false;

    // Regra Freelancer: só aparece se tiver OS, Bloqueio ou Ação no dia (ou madrugada seguinte)
    if (modalidade === 'pj_freelancer') {
      const viewDateObj = getBrasiliaDate(new Date(date + 'T12:00:00'));
      const tomorrowObj = new Date(viewDateObj);
      tomorrowObj.setDate(tomorrowObj.getDate() + 1);
      const tomorrowStr = getBrasiliaTodayStr(tomorrowObj);

      const hasOS = osList.some(o => {
        const oid = o.collaborator_id || o.technicianId || o.technician_id;
        return String(oid) === String(c.id) && (o.date === date || o.date === tomorrowStr);
      });
      const hasBlock = blocks.some(b => String(b.technicianId) === String(c.id) && (b.date === date || b.date === tomorrowStr));
      const hasAction = techActions.some(a => String(a.techId) === String(c.id) && (a.date === date || a.date === tomorrowStr));

      if (!hasOS && !hasBlock && !hasAction) return false;
    }

    return matchesSearch;
  });


  const toggleCategory = (catId) => {
    if (activeCategories.includes(catId)) {
      setActiveCategories(activeCategories.filter(id => id !== catId));
    } else {
      setActiveCategories([...activeCategories, catId]);
    }
  };

  return (
    <div className="content-wrapper" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>

        {/* Sidebar Left */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <MiniCalendar selectedDate={date} onSelectDate={setDate} />

          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Profissionais</h3>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Pesquisar profissional"
                className="input-field"
                style={{ paddingLeft: '2.2rem', fontSize: '0.8rem', height: '36px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={activeCategories.length === CATEGORIES.length}
                  onChange={() => setActiveCategories(activeCategories.length === CATEGORIES.length ? [] : CATEGORIES.map(c => c.id))}
                />
                <strong>Todos</strong>
              </label>
              {CATEGORIES.map(cat => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: '#64748b' }}>
                  <input
                    type="checkbox"
                    checked={activeCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Grid Area */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Top Bar */}
          <div className="card" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDate(getLocalToday())} style={{ padding: '0.5rem 1rem' }}>Hoje</button>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsBlockModalOpen(true)}>
                <Plus size={18} /> Bloquear Horário
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Pesquisar agendamento"
                  className="input-field"
                  style={{ width: '240px', paddingLeft: '2.5rem', height: '38px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-icon"><LayoutGrid size={20} /></button>
                <button className="btn-icon"><Maximize2 size={20} /></button>
              </div>
            </div>
          </div>

          {/* Schedule Grid - Horizontal Timeline */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div ref={timelineScrollRef} style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Header Timeline */}
                <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 20 }}>
                  <div style={{ width: '250px', minWidth: '250px', padding: '1rem', fontWeight: 700, borderRight: '1px solid #e2e8f0', fontSize: '0.85rem', position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 30 }}>Profissional</div>
                  <div style={{ width: `${TIMELINE_WIDTH}px`, position: 'relative', height: '45px', marginLeft: '20px' }}>
                    {HOURS.map((h, i) => (
                      <div key={i} style={{
                        position: 'absolute',
                        left: `${i * PX_PER_HOUR}px`,
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        background: '#e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '14px', fontWeight: 600 }}>{h.toString().padStart(2, '0')}:00</span>
                      </div>
                    ))}
                    {/* Now indicator in header */}
                    {isToday && (() => {
                      const nowH = getBrasiliaDecimalHour(currentTime);
                      const nowLeft = (nowH - 6) * PX_PER_HOUR;
                      if (nowLeft < 0 || nowLeft > TIMELINE_WIDTH) return null;
                      return <div style={{ position: 'absolute', left: `${nowLeft}px`, top: 0, bottom: 0, width: '2px', background: '#ef4444', zIndex: 15 }}>
                        <div style={{ position: 'absolute', top: 0, left: '-7px', background: '#ef4444', color: 'white', fontSize: '0.55rem', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                          {`${Math.floor(nowH).toString().padStart(2, '0')}:${Math.round((nowH % 1) * 60).toString().padStart(2, '0')}`}
                        </div>
                      </div>;
                    })()}
                  </div>
                </div>

                {/* Rows */}
                {filteredColabs.map(c => {
                  const segments = getTimelineSegments(c.id);
                  const techStatus = getTechStatus(c.id);
                  const hasAbsence = techStatus && (techStatus.type === 'FALTA' || techStatus.type === 'FALTA_PARCIAL');
                  const viewDateObj = getBrasiliaDate(new Date(date + 'T12:00:00'));

                  const workingDays = c.workingDays || [1, 2, 3, 4, 5];
                  let isWorkingDay = workingDays.includes(viewDateObj.getDay());

                  let shiftStartStr = c.shiftStart || '08:00';
                  let shiftEndStr = c.shiftEnd || '18:00';
                  const saturdayMode = c.saturdayMode || 'custom';

                  if (viewDateObj.getDay() === 6 && isWorkingDay) {
                    if (saturdayMode === 'half') shiftEndStr = '12:00';
                    else if (saturdayMode === 'custom') {
                      shiftStartStr = c.saturdayStart || '08:00';
                      shiftEndStr = c.saturdayEnd || '12:00';
                    } else if (saturdayMode === 'alternate') {
                      const weekId = Math.floor((viewDateObj.getTime() - viewDateObj.getTimezoneOffset() * 60000) / (7 * 24 * 60 * 60 * 1000));
                      if (weekId % 2 !== 0) isWorkingDay = false;
                    }
                  }

                  const [hS, mS] = shiftStartStr.split(':');
                  const shiftStartVal = parseInt(hS) + (parseInt(mS || 0) / 60);
                  const [hE, mE] = shiftEndStr.split(':');
                  const shiftEndVal = parseInt(hE) + (parseInt(mE || 0) / 60);

                  const shiftLeftPx = (shiftStartVal - 6) * PX_PER_HOUR;
                  const shiftRightPx = (shiftEndVal - 6) * PX_PER_HOUR;

                  // Row height: 60px normally, 80px if has absence (dual-lane)
                  const rowHeight = hasAbsence ? 80 : 60;

                  let timelineRef = null;

                  return (
                    <div key={c.id} style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', minHeight: `${rowHeight}px`, alignItems: 'center', backgroundColor: hasAbsence ? techStatus.bgColor : 'white' }}>
                      {/* Tech Info Column */}
                      <div style={{ width: '250px', minWidth: '250px', padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'sticky', left: 0, zIndex: 10, backgroundColor: hasAbsence ? techStatus.bgColor : 'white' }}>
                        <div style={{ position: 'relative' }}>
                          <div
                            onClick={() => navigate('/operacoes/tecnico', { state: { techId: c.id } })}
                            style={{
                              width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden', cursor: 'pointer',
                              border: techStatus ? `3px solid ${techStatus.color}` : '1px solid #e2e8f0'
                            }}
                            title="Ver Portal do Técnico"
                          >
                            {c.foto ? <img src={c.foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={18} style={{ margin: '11px', color: '#94a3b8' }} />}
                          </div>
                          {techStatus && (
                            <div style={{
                              position: 'absolute', bottom: '-4px', left: '-4px', right: '-4px',
                              background: techStatus.color, color: 'white', fontSize: '0.5rem', fontWeight: 800,
                              textAlign: 'center', borderRadius: '3px', padding: '1px 0', lineHeight: 1.2,
                              letterSpacing: '0.3px'
                            }}>
                              {techStatus.label}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            onClick={() => navigate('/operacoes/tecnico', { state: { techId: c.id } })}
                            style={{ fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', color: techStatus ? techStatus.color : '#1e293b' }}
                            title="Ver Portal do Técnico"
                          >
                            {c.nome}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', gap: '3px', marginTop: '3px' }}>
                            <span
                              title="Dispensar"
                              onClick={(e) => { e.stopPropagation(); handleTechAction(c.id, 'DISPENSADO'); }}
                              style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', cursor: 'pointer', fontWeight: 600 }}
                            >Disp</span>
                            <span
                              title="Falta Parcial"
                              onClick={(e) => { e.stopPropagation(); handleTechAction(c.id, 'FALTA_PARCIAL'); }}
                              style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', cursor: 'pointer', fontWeight: 600 }}
                            >Parc</span>
                            <span
                              title="Falta"
                              onClick={(e) => { e.stopPropagation(); handleTechAction(c.id, 'FALTA'); }}
                              style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', cursor: 'pointer', fontWeight: 600 }}
                            >Falt</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Area */}
                      <div
                        ref={el => timelineRef = el}
                        style={{ width: `${TIMELINE_WIDTH}px`, position: 'relative', height: `${rowHeight - 16}px`, margin: '8px 0', marginLeft: '20px' }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, c.id, timelineRef)}
                      >
                        {/* Background grid lines */}
                        {HOURS.map((h, i) => (
                          <div key={i} style={{ position: 'absolute', left: `${i * PX_PER_HOUR}px`, top: 0, bottom: 0, width: '1px', background: '#f1f5f9' }}></div>
                        ))}

                        {/* Shift background */}
                        {isWorkingDay && (
                          <div style={{
                            position: 'absolute',
                            left: `${shiftLeftPx}px`,
                            width: `${shiftRightPx - shiftLeftPx}px`,
                            top: 0, bottom: 0,
                            backgroundColor: 'rgba(59, 130, 246, 0.03)',
                            borderLeft: '2px solid #10b981',
                            borderRight: '2px solid #ef4444',
                            zIndex: 0
                          }}></div>
                        )}

                        {/* Absence overlay (bottom half) */}
                        {hasAbsence && isWorkingDay && (
                          <div style={{
                            position: 'absolute',
                            left: `${shiftLeftPx}px`,
                            width: `${shiftRightPx - shiftLeftPx}px`,
                            top: '50%', bottom: 0,
                            backgroundColor: `${techStatus.color}15`,
                            borderTop: `2px dashed ${techStatus.color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1
                          }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: techStatus.color, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '2px' }}>
                              {techStatus.label}
                            </span>
                          </div>
                        )}

                        {/* OS segments (top half if absence, full height otherwise) */}
                        {segments.filter(seg => seg.type !== 'action').map((seg, idx) => {
                          const leftPx = (seg.start - 6) * PX_PER_HOUR;
                          const widthPx = seg.duration * PX_PER_HOUR;
                          const isOS = seg.type === 'os';
                          const fullOS = isOS ? osList.find(o => o.code === seg.code || (o.id && String(o.id) === String(seg.id))) : null;
                          const segHeight = hasAbsence && !seg.isRest ? '50%' : '100%';

                          return (
                            <div
                              key={idx}
                              className="timeline-segment"
                              draggable={isOS}
                              onDragStart={isOS ? (e) => handleDragStart(e, fullOS || seg, c.id) : undefined}
                              style={{
                                position: 'absolute',
                                left: `${leftPx}px`,
                                width: `${Math.max(widthPx, 8)}px`,
                                top: hasAbsence && seg.isRest ? 0 : (hasAbsence ? '2px' : '4px'),
                                height: segHeight,
                                backgroundColor: seg.isIdle ? 'white' : seg.color,
                                border: seg.borderColor ? `1px dashed ${seg.borderColor}` : '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 6px',
                                fontSize: '0.62rem',
                                color: seg.isIdle ? '#94a3b8' : 'white',
                                fontWeight: 700,
                                overflow: 'visible',
                                whiteSpace: 'nowrap',
                                boxShadow: isOS ? '0 2px 4px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.05)',
                                zIndex: isOS ? 5 : (seg.type === 'block' ? 3 : 1),
                                cursor: isOS ? 'grab' : 'default',
                                transition: 'all 0.15s ease'
                              }}
                              onClick={(e) => {
                                if (isOS && fullOS) {
                                  e.stopPropagation();
                                  setContextMenu({ os: fullOS, x: e.clientX, y: e.clientY });
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
                                {isOS && <GripVertical size={10} style={{ marginRight: '3px', flexShrink: 0, opacity: 0.6 }} />}
                                {seg.type === 'block' && !seg.isIdle && <Coffee size={9} style={{ marginRight: '3px', flexShrink: 0 }} />}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{seg.label}</span>
                                {isOS && seg.status && <span style={{ marginLeft: '4px', fontSize: '0.55rem', opacity: 0.8 }}>({seg.status})</span>}
                              </div>

                              <div className="os-tooltip">
                                <div style={{ fontWeight: 700, marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>{seg.label}</div>
                                <div style={{ marginBottom: '2px' }}><strong>Duração:</strong> {Math.floor(seg.duration)}h {Math.round((seg.duration % 1) * 60)}m</div>

                                {isOS ? (
                                  <>
                                    <div style={{ marginBottom: '2px' }}><strong>ID:</strong> {seg.code}</div>
                                    <div style={{ marginBottom: '2px' }}><strong>Cliente:</strong> {seg.clientName}</div>
                                    <div style={{ marginBottom: '2px' }}><strong>Status:</strong> {seg.status}</div>
                                    <div style={{ opacity: 0.9, marginTop: '4px', fontStyle: 'italic', whiteSpace: 'normal' }}>{seg.description}</div>
                                    <div style={{ marginTop: '6px', fontSize: '0.6rem', opacity: 0.7, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                                      Clique para opções • Arraste para mover
                                    </div>
                                  </>
                                ) : seg.isIdle ? (
                                  <div style={{ opacity: 0.8 }}>Tempo ocioso entre atendimentos.</div>
                                ) : seg.type === 'travel' ? (
                                  <div style={{ opacity: 0.8 }}>Deslocamento previsto.</div>
                                ) : seg.reason ? (
                                  <div style={{ opacity: 0.8 }}><strong>Motivo:</strong> {seg.reason}</div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}

                        {/* Now indicator (vertical red line) */}
                        {isToday && (() => {
                          const nowH = getBrasiliaDecimalHour(currentTime);
                          const nowLeft = (nowH - 6) * PX_PER_HOUR;
                          if (nowLeft < 0 || nowLeft > TIMELINE_WIDTH) return null;
                          return <div style={{ position: 'absolute', left: `${nowLeft}px`, top: '-4px', bottom: '-4px', width: '2px', background: '#ef4444', zIndex: 12, borderRadius: '1px' }}></div>;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Context Menu (on OS click) */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            border: '1px solid #e2e8f0',
            minWidth: '220px',
            overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{contextMenu.os.project || contextMenu.os.code}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{contextMenu.os.clientName} • {contextMenu.os.scheduledTime}</div>
          </div>

          <button onClick={() => { setSelectedOS(contextMenu.os); setContextMenu(null); }}
            style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#334155' }}
            onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <Eye size={16} /> Ver Detalhes
          </button>

          {/* Inline time edit */}
          {editingTime && editingTime.osId === contextMenu.os.id ? (
            <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', width: '35px' }}>Início:</span>
                <input type="time" value={editingTime.value} onChange={e => setEditingTime({ ...editingTime, value: e.target.value })}
                  style={{ flex: 1, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', width: '35px' }}>Fim:</span>
                <input type="time" value={editingEndTime?.value || ''} onChange={e => setEditingEndTime({ ...editingEndTime, value: e.target.value })}
                  style={{ flex: 1, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                />
              </div>
              <button
                onClick={() => updateOSTime(contextMenu.os.id, editingTime.value, editingEndTime?.value)}
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', marginTop: '4px' }}
              >
                Salvar Horários
              </button>
            </div>
          ) : (
            <button onClick={() => {
              setEditingTime({ osId: contextMenu.os.id, value: contextMenu.os.scheduledTime || '08:00' });

              const defaultEnd = contextMenu.os.endDate ? contextMenu.os.endDate.split('T')[1].substring(0, 5) : (() => {
                let startH = parseInt((contextMenu.os.scheduledTime || '08:00').split(':')[0]);
                return `${String(Math.min(23, startH + 2)).padStart(2, '0')}:${(contextMenu.os.scheduledTime || '08:00').split(':')[1] || '00'}`;
              })();
              setEditingEndTime({ osId: contextMenu.os.id, value: defaultEnd });
            }}
              style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#334155' }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              <Edit3 size={16} /> Editar Horários
            </button>
          )}

          {/* Transfer tech */}
          {transferMenu && transferMenu.osId === contextMenu.os.id ? (
            <div style={{ padding: '8px 16px', borderTop: '1px solid #f1f5f9' }}>
              <select
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                onChange={(e) => { if (e.target.value) transferOS(contextMenu.os.id, e.target.value); }}
                defaultValue=""
              >
                <option value="" disabled>Selecionar técnico...</option>
                {collaborators.filter(t => String(t.id) !== String(contextMenu.os.collaborator_id || contextMenu.os.technicianId)).map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
          ) : (
            <button onClick={() => setTransferMenu({ osId: contextMenu.os.id })}
              style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#334155' }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              <ArrowRightLeft size={16} /> Transferir Técnico
            </button>
          )}

          <button onClick={() => cancelOS(contextMenu.os.id)}
            style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#ef4444', borderTop: '1px solid #f1f5f9' }}
            onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <XCircle size={16} /> Cancelar OS
          </button>
        </div>
      )}

      {/* OS Details Modal */}
      {selectedOS && (
        <div className="modal-overlay" onClick={() => setSelectedOS(null)}>
          <div className="card modal-card" style={{ maxWidth: '500px', width: '95%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedOS(null)}><X size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#0ea5e915', color: '#0ea5e9', padding: '0.75rem', borderRadius: '12px' }}>
                <CalendarIcon size={24} />
              </div>
              <div>
                <h2 className="text-h3" style={{ marginBottom: 0 }}>{selectedOS.project || selectedOS.code}</h2>
                <p className="text-muted">{selectedOS.code}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="info-row">
                <User size={16} /> <strong>Técnico:</strong> {selectedOS.technicianName || collaborators.find(t => String(t.id) === String(selectedOS.collaborator_id || selectedOS.technicianId))?.nome || 'N/A'}
              </div>
              <div className="info-row">
                <Clock size={16} /> <strong>Horário:</strong> {selectedOS.scheduledTime}
              </div>
              <div className="info-row">
                <MapPin size={16} /> <strong>Endereço:</strong> {selectedOS.address || 'Não informado'}
              </div>
              <div className="info-row">
                <Activity size={16} /> <strong>Status:</strong> {selectedOS.status}
              </div>
              <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.9rem' }}>
                <strong>Descrição:</strong><br />
                {selectedOS.description}
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedOS(null)}>Fechar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                setEditingTime({ osId: selectedOS.id, value: selectedOS.scheduledTime || '08:00' });
                setSelectedOS(null);
                setContextMenu({ os: selectedOS, x: window.innerWidth / 2, y: window.innerHeight / 2 });
              }}>Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* Block Schedule Modal */}
      {isBlockModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBlockModalOpen(false)}>
          <div className="card modal-card" style={{ maxWidth: '500px', width: '95%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsBlockModalOpen(false)}><X size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '0.75rem', borderRadius: '12px' }}>
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-h3" style={{ marginBottom: 0 }}>Bloquear Horário</h2>
                <p className="text-muted">Adicionar pausa, treinamento ou indisponibilidade</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // In a real scenario, integrate directly with api.os_blocks.create
                // For now, let's simulate updating state then saving
                // We mock an ID for instant feedback
                const newBlock = { ...blockFormData, id: Math.random().toString(36).substr(2, 9), technicianId: blockFormData.technicianId };
                await api.os_blocks.create(newBlock);
                setBlocks([...blocks, newBlock]);
                setIsBlockModalOpen(false);
                toast.success('Horário bloqueado com sucesso!');
                loadData();
              } catch (err) {
                toast.error('Erro ao bloquear horário.');
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Técnico/Profissional *</label>
                  <select
                    className="input-field"
                    required
                    value={blockFormData.technicianId}
                    onChange={e => setBlockFormData({ ...blockFormData, technicianId: e.target.value })}
                  >
                    <option value="">Selecione um técnico...</option>
                    {collaborators.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Data *</label>
                  <input
                    type="date"
                    className="input-field"
                    required
                    value={blockFormData.date}
                    onChange={e => setBlockFormData({ ...blockFormData, date: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Início *</label>
                    <input
                      type="time"
                      className="input-field"
                      required
                      value={blockFormData.startTime}
                      onChange={e => setBlockFormData({ ...blockFormData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Término *</label>
                    <input
                      type="time"
                      className="input-field"
                      required
                      value={blockFormData.endTime}
                      onChange={e => setBlockFormData({ ...blockFormData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Bloqueio *</label>
                  <select
                    className="input-field"
                    required
                    value={blockFormData.type}
                    onChange={e => setBlockFormData({ ...blockFormData, type: e.target.value })}
                  >
                    <option value="TREINAMENTO">Treinamento</option>
                    <option value="REUNIÃO">Reunião</option>
                    <option value="ALMOÇO">Almoço (Extra/Deslocamento)</option>
                    <option value="FALTA_JUSTIFICADA">Falta Justificada</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo / Detalhes *</label>
                  <textarea
                    className="input-field"
                    required
                    placeholder="Descreva brevemente o motivo deste bloqueio..."
                    rows="3"
                    value={blockFormData.reason}
                    onChange={e => setBlockFormData({ ...blockFormData, reason: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsBlockModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirmar Bloqueio</button>
              </div>
            </form>
          </div>
        </div>
      )}


      <style>{`
        .mini-calendar div:hover {
          background-color: #f1f5f9;
        }
        .info-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
        }
        .btn-icon {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-icon:hover {
          background: #f1f5f9;
          color: #1e293b;
        }
        .scheduling-os-card:hover .os-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .os-tooltip {
          position: absolute;
          top: 10px;
          left: 105%;
          z-index: 1000;
          background: #1e293b;
          color: white;
          padding: 12px;
          border-radius: 8px;
          width: 240px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(5px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          font-size: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.1);
          text-align: left;
          line-height: 1.4;
        }
        .os-tooltip::before {
          content: "";
          position: absolute;
          top: 15px;
          right: 100%;
          border-width: 6px;
          border-style: solid;
          border-color: transparent #1e293b transparent transparent;
        }
      `}</style>
    </div>
  );
}
