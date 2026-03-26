import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('--- Iniciando Seed Supabase ---');

  // Helper to insert if not exists (very basic for this script)
  const insert = async (table, data) => {
    const { error } = await supabase.from(table).upsert(data);
    if (error) console.error(`Error seeding ${table}:`, error);
    else console.log(`Seeded ${table}`);
  };

  // 1. Users
  await insert('users', [
    { id: 'usr-admin', nome: 'Administrador', email: 'admin@voke.com.br', password: 'admin', role: 'Administrador', status: 'Ativo', verified: true },
    { id: 'usr-teste', nome: 'Usuário de Teste Externo', email: 'teste@voke.com.br', password: 'teste', role: 'Gestor', status: 'Ativo', verified: true }
  ]);

  // 2. Departments
  const depts = [
    { id: 'dept-ops', nome: 'Operações' },
    { id: 'dept-proj', nome: 'Projetos' },
    { id: 'dept-rh', nome: 'RH' }
  ];
  await insert('departments', depts);

  // 3. Positions
  await insert('positions', [
    { id: 'pos-1', nome: 'Técnico Senior', setor_id: 'dept-ops', salario_base: 4500, requer_cnh: true, tem_periculosidade: true, status: 'Ativo' },
    { id: 'pos-2', nome: 'Coordenadora de Projetos', setor_id: 'dept-proj', salario_base: 8000, requer_cnh: false, tem_periculosidade: false, status: 'Ativo' },
    { id: 'pos-3', nome: 'Técnico de Infraestrutura', setor_id: 'dept-ops', salario_base: 3500, requer_cnh: true, tem_periculosidade: false, status: 'Ativo' }
  ]);

  // 4. Clients
  await insert('clients', [
    { id: 'cli-arklok', nome: 'Arklok', cnpj: '00.111.222/0001-33', status: 'Ativo', is_umbrella: true, sigla: 'ARK' },
    { id: 'cli-meli', nome: 'Mercado Livre', cnpj: '44.555.666/0001-77', parent_id: 'cli-arklok', address: 'Av. das Nações Unidas, 3003', status: 'Ativo', latitude: -23.63, longitude: -46.72 },
    { id: 'cli-amazon', nome: 'Amazon BR', cnpj: '88.999.000/0001-11', parent_id: 'cli-arklok', address: 'Rodovia Anhanguera, km 26', status: 'Ativo', latitude: -23.45, longitude: -46.78 },
    { id: 'cli-base', nome: 'Base Vila Olimpia', cnpj: '00.000.000/0001-00', address: 'Vila Olimpia, SP', status: 'Ativo', latitude: -23.59, longitude: -46.68 }
  ]);

  // 5. Projects
  await insert('projects', [
    { 
       id: 'proj-1', name: 'Sustentação Arklok PJ', client_id: 'cli-arklok', status: 'Ativo', period_type: 'mensal',
       services: [{ name: 'Chamado Avulso', price: 150.00 }, { name: 'Instalação Coletor', price: 250.00 }, { name: 'Manutenção Preventiva', price: 100.00 }]
    },
    { 
       id: 'proj-2', name: 'Projeto Voke CLT', client_id: 'cli-arklok', status: 'Ativo', period_type: 'periodo', start_date: '2024-01-01', end_date: '2024-12-31',
       services: [{ name: 'Consultoria', price: 500.00 }, { name: 'Treinamento', price: 300.00 }]
    }
  ]);

  // 6. Providers
  await insert('providers', [
    { id: 'prov-1', razao_social: 'Voke Soluções Tecnológicas', cnpj: '11.111.111/0001-11', email: 'voke@teste.com', status: 'Ativo' },
    { id: 'prov-2', razao_social: 'TecnoServices LTDA', cnpj: '22.222.222/0001-22', email: 'tecno@teste.com', status: 'Ativo' },
    { id: 'prov-3', razao_social: 'InforTech Brasil', cnpj: '33.333.333/0001-33', email: 'info@teste.com', status: 'Ativo' }
  ]);

  // 7. Collaborators
  await insert('collaborators', [
    { id: 'col-1', nome: 'Carlos Lima (FIXO)', email: 'carlos@teste.com', cpf: '333.333.333-33', modalidade_contrato: 'pj_fixo', provider_id: 'prov-3', cargo: 'Técnico Senior', status: 'Ativo', lunch_start: '13:00', lunch_end: '14:00' },
    { id: 'col-2', nome: 'Ana Oliveira (CLT)', email: 'ana@teste.com', cpf: '444.444.444-44', modalidade_contrato: 'clt', cargo: 'Coordenadora de Projetos', status: 'Ativo', lunch_start: '12:00', lunch_end: '13:00' },
    { id: 'col-3', nome: 'Pedro Souza (CLT)', email: 'pedro@teste.com', cpf: '555.555.555-55', modalidade_contrato: 'clt', cargo: 'Técnico de Infraestrutura', status: 'Ativo', lunch_start: '12:00', lunch_end: '13:00' }
  ]);

  // 8. Services Catalog
  await insert('services', [
    { id: 'srv-1', nome: 'Chamado Avulso (Visita)', base_price: 150.00 },
    { id: 'srv-2', nome: 'Instalação de PDV', base_price: 250.00 },
    { id: 'srv-3', nome: 'Configuração de Rede', base_price: 180.00 },
    { id: 'srv-4', nome: 'Manutenção Preventiva', base_price: 120.00 }
  ]);

  // 9. OS for Today
  const today = new Date().toISOString().split('T')[0];
  await insert('os', [
    { 
      id: 'os-today-1', 
      code: 'ARK0001', 
      client_id: 'cli-meli', 
      collaborator_id: 'col-1', 
      date: today, 
      scheduled_time: '09:00', 
      status: 'Em Execução',
      latitude: -23.63, 
      longitude: -46.72,
      description: 'Manutenção de Coletores'
    },
    { 
      id: 'os-today-2', 
      code: 'ARK0002', 
      client_id: 'cli-amazon', 
      collaborator_id: 'col-2', 
      date: today, 
      scheduled_time: '14:00', 
      status: 'Agendado',
      latitude: -23.45, 
      longitude: -46.78,
      description: 'Configuração de Rede'
    }
  ]);

  console.log('--- Seed Finalizado ---');
}

seed();
