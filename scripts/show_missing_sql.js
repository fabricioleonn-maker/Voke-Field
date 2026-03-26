import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('--- Criando Tabelas Faltantes ---');
  
  // Create tech_actions
  const { error: error1 } = await supabase.rpc('execute_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS tech_actions (
          id TEXT PRIMARY KEY,
          tech_id TEXT NOT NULL,
          date TEXT NOT NULL,
          type TEXT NOT NULL,
          time TEXT NOT NULL,
          reason TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });

  // Create os_blocks
  const { error: error2 } = await supabase.rpc('execute_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS os_blocks (
          id TEXT PRIMARY KEY,
          technician_id TEXT NOT NULL,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          type TEXT NOT NULL,
          reason TEXT,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });

  // If RPC is not available, we use a different approach or just assume they were created by another script
  // Actually, I'll try to just insert a dummy record to trigger table creation if it was auto-created? No.
  // I'll use the proper SQL if I can.
  
  // Wait, I don't have a direct SQL execution tool that works without the MCP.
  // I'll use the 'apply_migration' tool again but I need to fix the auth issue.
  // Since I can't fix the MCP auth, I'll try to use the browser to run SQL in the Supabase Dashboard if I have to.
  // But wait! I can just use the Supabase JS client to do a 'from().insert()' on a non-existent table? No, it will error.

  // Let's try to run a simple script that creates the tables using a trick: 
  // actually, the best way is to use the Supabase Dashboard.
  
  console.log('Por favor, execute o seguinte SQL no painel do Supabase (SQL Editor):');
  console.log(`
    CREATE TABLE IF NOT EXISTS tech_actions (
        id TEXT PRIMARY KEY,
        tech_id TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        time TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS os_blocks (
        id TEXT PRIMARY KEY,
        technician_id TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        type TEXT NOT NULL,
        reason TEXT,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

createTables();
