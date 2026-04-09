import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rsevfeogormnorvcvxio.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXZmZW9nb3Jtbm9ydmN2eGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzQyNTEsImV4cCI6MjA5MDk1MDI1MX0.QnP03Rz5r8i6qDq64hOA06J_2PtqH9Ybrv70DyRP_sM'
);

// Usage: npx tsx scripts/agent-log-health.ts <type> <status> [details_json]
// Types: build, git, server
//
// Examples:
//   npx tsx scripts/agent-log-health.ts build pass '{"duration":"4.2s"}'
//   npx tsx scripts/agent-log-health.ts build fail '{"errors":"Type error in CoachCard.tsx"}'
//   npx tsx scripts/agent-log-health.ts git updated '{"branch":"main","lastCommit":"abc1234","message":"Add filter"}'
//   npx tsx scripts/agent-log-health.ts server running '{"port":8080}'

async function logHealth() {
  const [type, status, detailsJson] = process.argv.slice(2);

  if (!type || !status) {
    console.error('Usage: agent-log-health.ts <type> <status> [details_json]');
    process.exit(1);
  }

  const { error } = await supabase.from('agent_status').insert({
    type,
    status,
    details: detailsJson ? JSON.parse(detailsJson) : null,
  });

  if (error) {
    console.error('Error logging health:', error.message);
    process.exit(1);
  }

  console.log(`✅ Health: [${type}] ${status}`);
}

logHealth();
