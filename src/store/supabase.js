import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const generateId = () => Math.random().toString(36).substr(2, 9);

export const COLUMNS = {
  CLIENTS: 'clients',
  PROJECTS: 'projects',
  PROVIDERS: 'providers',
  COLLABORATORS: 'collaborators',
  DEPARTMENTS: 'departments',
  POSITIONS: 'positions',
  SERVICES: 'services',
  USERS: 'users',
  OS: 'os',
  TIMESHEET: 'timesheet',
  PAYROLL: 'payroll',
  VACATIONS: 'vacations',
  AUDIT_LOGS: 'audit_logs',
  STATUS_MOVEMENTS: 'status_movements',
  ALERTS: 'alerts',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  OS_BLOCKS: 'os_blocks'
};

const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamelCase = (str) => str.replace(/_([a-z])/g, g => g[1].toUpperCase());

const mapObject = (obj, mapFn) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  return Object.keys(obj).reduce((acc, key) => {
    acc[mapFn(key)] = obj[key];
    return acc;
  }, {});
};

const buildSupabaseCrud = (tableName) => ({
  list: async () => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) throw error;
    return data.map(item => mapObject(item, toCamelCase));
  },
  getById: async (id) => {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) throw error;
    return mapObject(data, toCamelCase);
  },
  create: async (data) => {
    const dataWithId = { id: generateId(), ...data };
    const snakeData = mapObject(dataWithId, toSnakeCase);
    const { data: created, error } = await supabase.from(tableName).insert(snakeData).select().single();
    if (error) throw error;
    return mapObject(created, toCamelCase);
  },
  update: async (id, data) => {
    const snakeData = mapObject(data, toSnakeCase);
    const { data: updated, error } = await supabase.from(tableName).update(snakeData).eq('id', id).select().single();
    if (error) throw error;
    return mapObject(updated, toCamelCase);
  },
  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
});

export const supabaseApi = {
  clients: buildSupabaseCrud(COLUMNS.CLIENTS),
  projects: buildSupabaseCrud(COLUMNS.PROJECTS),
  providers: buildSupabaseCrud(COLUMNS.PROVIDERS),
  collaborators: buildSupabaseCrud(COLUMNS.COLLABORATORS),
  departments: buildSupabaseCrud(COLUMNS.DEPARTMENTS),
  positions: buildSupabaseCrud(COLUMNS.POSITIONS),
  services: buildSupabaseCrud(COLUMNS.SERVICES),
  users: buildSupabaseCrud(COLUMNS.USERS),
  os: buildSupabaseCrud(COLUMNS.OS),
  os_blocks: buildSupabaseCrud(COLUMNS.OS_BLOCKS),
  notifications: buildSupabaseCrud(COLUMNS.NOTIFICATIONS),
  timesheet: buildSupabaseCrud(COLUMNS.TIMESHEET),
  payroll: buildSupabaseCrud(COLUMNS.PAYROLL),
  vacations: buildSupabaseCrud(COLUMNS.VACATIONS),
  auditLogs: buildSupabaseCrud(COLUMNS.AUDIT_LOGS),
  statusMovements: buildSupabaseCrud(COLUMNS.STATUS_MOVEMENTS),
  alerts: buildSupabaseCrud(COLUMNS.ALERTS),
  settings: {
    get: async () => {
      const { data, error } = await supabase.from(COLUMNS.SETTINGS).select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || { tenantName: 'SPACE' };
    },
    update: async (data) => {
      const current = await supabaseApi.settings.get();
      if (current.id) {
        return supabaseApi.settings.updateById(current.id, data);
      } else {
        const { data: created, error } = await supabase.from(COLUMNS.SETTINGS).insert(data).select().single();
        if (error) throw error;
        return created;
      }
    },
    updateById: async (id, data) => {
      const { data: updated, error } = await supabase.from(COLUMNS.SETTINGS).update(data).eq('id', id).select().single();
      if (error) throw error;
      return updated;
    }
  }
};
