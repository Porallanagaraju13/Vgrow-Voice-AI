const path = require('path');
const fs = require('fs');

// Load env vars
const envPath = path.join(__dirname, '.env.local');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (err) {
  console.error('Could not load env:', err.message);
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  try {
    console.log('--- CONVERSATIONS (Inbound Call Logs) ---');
    const { data: convs, error: err1 } = await supabase.from('conversations').select('*');
    if (err1) throw err1;
    console.log(`Found ${convs.length} inbound conversation(s):`);
    convs.forEach((c, idx) => {
      console.log(`[${idx}] ID: ${c.id}, BusinessID: ${c.business_id}, AgentID: ${c.agent_id}, Status: ${c.status}, CreatedAt: ${c.created_at}`);
    });

    console.log('\n--- OUTBOUND CALLS ---');
    const { data: calls, error: err2 } = await supabase.from('outbound_calls').select('*');
    if (err2) throw err2;
    console.log(`Found ${calls.length} outbound call(s):`);
    calls.forEach((c, idx) => {
      console.log(`[${idx}] ID: ${c.id}, BusinessID: ${c.business_id}, LeadID: ${c.lead_id}, Status: ${c.status}, CreatedAt: ${c.created_at}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
