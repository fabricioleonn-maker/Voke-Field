import { supabaseApi, COLUMNS, supabase } from './supabase';
import { getBrasiliaISO, getBrasiliaTodayStr } from '../utils/time';

const generateId = () => Math.random().toString(36).substr(2, 9);

export async function resetDatabase() {
  localStorage.removeItem('auth_user');
  window.location.href = '/login';
}

export const auth = {
    async login(email, password) {
      const { data: users, error } = await supabase.from(COLUMNS.USERS).select('*').eq('email', email).eq('password', password);
      if (error || !users || users.length === 0) throw new Error('Invalid credentials');
      
      const user = users[0];
      if (user.verified === false) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        return { status: 'verification_required', email, code };
      }

      localStorage.setItem('auth_user', JSON.stringify(user));
      return { status: 'success', user };
    },
    async verifyAccount(email, code, expectedCode) {
      if (code !== expectedCode) throw new Error('Código inválido');
      
      const { data: updated, error } = await supabase
        .from(COLUMNS.USERS)
        .update({ verified: true })
        .eq('email', email)
        .select()
        .single();
      
      if (error) throw error;
      
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return updated;
    },
    logout() {
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    },
    getCurrentUser() {
      const user = localStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    }
};

export const api = {
  ...supabaseApi,
  os: {
    ...supabaseApi.os,
    create: async (data) => {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const clients = await supabaseApi.clients.list();
      const osList = await supabaseApi.os.list();
      
      let client = clients.find(c => c.id === data.clientId);
      let parentClient = client;
      if (client?.parentId) {
        parentClient = clients.find(c => c.id === client.parentId) || client;
      }
      
      const sigla = (parentClient?.sigla || 'OS').toUpperCase();
      
      let nextNum = '0001';
      if (parentClient) {
        const clientFamilyIds = clients.filter(c => c.id === parentClient.id || c.parentId === parentClient.id).map(c => c.id);
        const count = osList.filter(o => clientFamilyIds.includes(o.clientId)).length;
        nextNum = (count + 1).toString().padStart(4, '0');
      } else {
        nextNum = (osList.length + 1).toString().padStart(4, '0');
      }
      const osCode = `${sigla}${nextNum}`;

      const initialHistory = [{
        id: generateId(),
        timestamp: getBrasiliaISO(),
        user: user.nome || 'Sistema',
        action: 'Criação',
        status: data.status || 'Criação',
        description: `Ordem de serviço ${osCode} criada no sistema.`
      }];

      return supabaseApi.os.create({ ...data, code: osCode, history: initialHistory });
    },
    update: async (id, data) => {
      const oldOS = await supabaseApi.os.getById(id); // Need to add getById to supabaseApi
      if (!oldOS) throw new Error('OS not found');
      
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      let newHistory = [...(oldOS.history || [])];
      const changes = [];
      const ignoreFields = ['history', 'updatedAt', 'total_value', 'code', 'createdAt', 'closingId', 'isApproved', 'photos'];
      
      const [clients, projects, collaborators, services] = await Promise.all([
        supabaseApi.clients.list(),
        supabaseApi.projects.list(),
        supabaseApi.collaborators.list(),
        supabaseApi.services.list()
      ]);

      const getName = (collection, itemId, field = 'nome') => {
        const item = collection.find(i => i.id === itemId);
        return item ? (item[field] || item.name || 'Desconhecido') : 'N/A';
      };

      for (const key in data) {
        if (ignoreFields.includes(key)) continue;
        const oldVal = oldOS[key];
        const newVal = data[key];

        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          let label = key;
          let oldDisplay = oldVal;
          let newDisplay = newVal;

          if (key === 'projectId') {
            label = 'Projeto';
            oldDisplay = getName(projects, oldVal, 'name');
            newDisplay = getName(projects, newVal, 'name');
          } else if (key === 'collaboratorId') {
            label = 'Técnico';
            oldDisplay = getName(collaborators, oldVal);
            newDisplay = getName(collaborators, newVal);
          } else if (key === 'clientId') {
            label = 'Cliente';
            oldDisplay = getName(clients, oldVal);
            newDisplay = getName(clients, newVal);
          } else if (key === 'serviceId') {
            label = 'Serviço';
            oldDisplay = getName(services, oldVal);
            newDisplay = getName(services, newVal);
          } else if (key === 'status') label = 'Status';
          else if (key === 'date') label = 'Data';
          else if (key === 'scheduledTime') label = 'Horário';
          else if (key === 'baseValue') label = 'Valor Base';
          else if (key === 'additionalValue') label = 'Valor Adicional';
          else if (key === 'description') label = 'Descrição';
          else if (key === 'location') label = 'Local/Endereço';

          changes.push(`${label}: ${oldDisplay || 'vazio'} -> ${newDisplay || 'vazio'}`);
        }
      }

      if (changes.length > 0) {
        newHistory.push({
          id: generateId(),
          timestamp: getBrasiliaISO(),
          user: user.nome || 'Sistema',
          action: 'Edição',
          description: `Alterações: ${changes.join('; ')}`
        });
      }
      
      return supabaseApi.os.update(id, { ...data, history: newHistory });
    },
    addHistory: async (id, entry) => {
      const os = await supabaseApi.os.getById(id);
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const newHistory = [...(os.history || []), {
        id: generateId(),
        timestamp: getBrasiliaISO(),
        user: user.nome || 'Sistema',
        ...entry
      }];
      return supabaseApi.os.update(id, { history: newHistory });
    }
  },
  notifications: {
    ...supabaseApi.notifications,
    notifyRole: async (role, message, link) => {
      const users = await supabaseApi.users.list();
      const targets = users.filter(u => u.role === role);
      for (const t of targets) {
        await supabaseApi.notifications.create({
          userId: t.id,
          message,
          link,
          read: false,
          type: 'role_alert'
        });
      }
    },
    notifyUser: (userId, message, link) => supabaseApi.notifications.create({
      userId,
      message,
      link,
      read: false,
      type: 'user_alert'
    })
  }
};

export async function seedInitialData() {
  // Seeding handled by external script for Supabase
  console.log('Seed Initial Data - Skip (Already handled in Supabase)');
}
