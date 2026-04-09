import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rsevfeogormnorvcvxio.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXZmZW9nb3Jtbm9ydmN2eGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzQyNTEsImV4cCI6MjA5MDk1MDI1MX0.QnP03Rz5r8i6qDq64hOA06J_2PtqH9Ybrv70DyRP_sM'
);

async function checkTasks() {
  const { data: tasks, error } = await supabase
    .from('agent_tasks')
    .select('*')
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error.message);
    return;
  }

  if (!tasks?.length) {
    console.log('✅ No pending tasks.');
    return;
  }

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));

  console.log(`\n📋 ${tasks.length} task(s) waiting:\n`);
  tasks.forEach(t => {
    const icon = t.status === 'in_progress' ? '🔄' : '⏳';
    const pri = t.priority.toUpperCase().padEnd(7);
    console.log(`${icon} [${pri}] ${t.title}`);
    if (t.description) console.log(`            ${t.description}`);
    console.log(`            ID: ${t.id}\n`);
  });
}

checkTasks();
