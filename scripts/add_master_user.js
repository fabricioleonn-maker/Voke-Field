import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMasterUser() {
  console.log('--- Adicionando Usuário Master ---');
  
  const { data, error } = await supabase.from('users').upsert([
    { 
      id: 'usr-master', 
      nome: 'Fabricio Leon (Master)', 
      email: 'fabricio.leon@spacesolut.com.br', 
      password: '@895910Fa', 
      role: 'Administrador', 
      status: 'Ativo', 
      verified: true 
    }
  ]);

  if (error) {
    console.error('Erro ao adicionar mestre:', error);
  } else {
    console.log('Usuário Master adicionado com sucesso!');
  }
}

addMasterUser();
