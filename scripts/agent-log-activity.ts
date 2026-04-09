import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rsevfeogormnorvcvxio.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXZmZW9nb3Jtbm9ydmN2eGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzQyNTEsImV4cCI6MjA5MDk1MDI1MX0.QnP03Rz5r8i6qDq64hOA06J_2PtqH9Ybrv70DyRP_sM'
);

// Usage: npx tsx scripts/agent-log-activity.ts <type> <summary> [task_id] [details_json]
// Types: commit, file_change, build, task_update, error, chat
//
// Examples:
//   npx tsx scripts/agent-log-activity.ts commit "Added price filter to Discover"
//   npx tsx scripts/agent-log-activity.ts build "Build #42 passed" "" '{"duration":"4.2s"}'
//   npx tsx scripts/agent-log-activity.ts file_change "Modified Discover.tsx" "task-uuid" '{"files":["src/pages/Discover.tsx"]}'

async function logActivity() {
  const [type, summary, taskId, detailsJson] = process.argv.slice(2);

  if (!type || !summary) {
    console.error('Usage: agent-log-activity.ts <type> <summary> [task_id] [details_json]');
    process.exit(1);
  }

  const { error } = await supabase.from('agent_activity').insert({
    type,
    summary,
    task_id: taskId || null,
    details: detailsJson ? JSON.parse(detailsJson) : null,
  });

  if (error) {
    console.error('Error logging activity:', error.message);
    process.exit(1);
  }

  console.log(`✅ Logged: [${type}] ${summary}`);
}

logActivity();
