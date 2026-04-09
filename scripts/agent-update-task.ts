import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rsevfeogormnorvcvxio.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXZmZW9nb3Jtbm9ydmN2eGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzQyNTEsImV4cCI6MjA5MDk1MDI1MX0.QnP03Rz5r8i6qDq64hOA06J_2PtqH9Ybrv70DyRP_sM'
);

// Usage: npx tsx scripts/agent-update-task.ts <task_id> <status>
// Status: pending, in_progress, completed, blocked
//
// Examples:
//   npx tsx scripts/agent-update-task.ts abc123 in_progress
//   npx tsx scripts/agent-update-task.ts abc123 completed

async function updateTask() {
  const [taskId, status] = process.argv.slice(2);

  if (!taskId || !status) {
    console.error('Usage: agent-update-task.ts <task_id> <status>');
    process.exit(1);
  }

  const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
  if (!validStatuses.includes(status)) {
    console.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  const updates: Record<string, string> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('agent_tasks')
    .update(updates)
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task:', error.message);
    process.exit(1);
  }

  // Log the status change
  await supabase.from('agent_activity').insert({
    task_id: taskId,
    type: 'task_update',
    summary: `Task status changed to ${status}`,
  });

  console.log(`✅ Task ${taskId} → ${status}`);
}

updateTask();
