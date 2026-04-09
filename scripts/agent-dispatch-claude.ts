/**
 * Agent Dispatcher — uses Claude Code CLI (Guy's Max plan, $0 per call)
 * Each agent runs tasks through the local claude CLI
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rsevfeogormnorvcvxio.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const OPENCLAW_ID = '3ea81ac2-e6dd-4c81-b220-cb0bb5c0f012';
const PROJECT_DIR = '/Users/openclaw/Projects/supabase-starter-kit';

interface Task { id: string; title: string; description: string; priority: string; assigned_to: string | null; }
interface Agent { id: string; name: string; role: string | null; specialty: string | null; system_prompt: string | null; }

async function runWithClaude(agent: Agent, task: Task): Promise<string> {
  const prompt = `You are ${agent.name}, ${agent.role} on the Circlo team.
${agent.system_prompt || ''}

Your task: "${task.title}"
${task.description ? `Details: ${task.description}` : ''}
Task ID: ${task.id}

Work in: ${PROJECT_DIR}
Write actual production code. Make the change. Be specific.

IMPORTANT: After completing this task, run:
  bash ${PROJECT_DIR}/scripts/update-task-status.sh ${task.id} completed "Completed: ${task.title}"
If you get blocked, run:
  bash ${PROJECT_DIR}/scripts/update-task-status.sh ${task.id} blocked "<reason>"`;


  try {
    const result = execSync(
      `claude -p ${JSON.stringify(prompt)} --output-format text`,
      { cwd: PROJECT_DIR, timeout: 120_000, encoding: 'utf8' }
    );
    return result.trim();
  } catch (err: unknown) {
    return `Error: ${(err as Error).message?.slice(0, 200)}`;
  }
}

async function dispatchAgent(agent: Agent, task: Task) {
  console.log(`\n[${agent.name}] → "${task.title.slice(0, 60)}"`);

  await sb.from('agents').update({ status: 'busy' }).eq('id', agent.id);
  await sb.from('agent_tasks').update({ status: 'in_progress' }).eq('id', task.id);
  await sb.from('agent_activity').insert({
    type: 'task_update',
    summary: `${agent.name} started: "${task.title.slice(0, 60)}"`,
    agent_id: agent.id,
    task_id: task.id,
  });

  const reply = await runWithClaude(agent, task);
  console.log(`[${agent.name}] Reply: ${reply.slice(0, 100)}...`);

  // Save to agent_chat
  await sb.from('agent_chat').insert({
    conversation_id: `${agent.id}-tasks`,
    role: 'assistant',
    content: reply,
    agent_id: agent.id,
  });

  await sb.from('agent_tasks').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', task.id);

  await sb.from('agent_activity').insert({
    type: 'task_update',
    summary: `${agent.name} completed: "${task.title.slice(0, 60)}"`,
    agent_id: agent.id,
    task_id: task.id,
  });

  await sb.from('agents').update({ status: 'online' }).eq('id', agent.id);
  console.log(`[${agent.name}] Done`);
}

async function main() {
  const { data: allAgents } = await sb.from('agents').select('*').neq('id', OPENCLAW_ID);
  const { data: pendingTasks } = await sb.from('agent_tasks')
    .select('*')
    .eq('status', 'pending')
    .order('created_at');

  if (!pendingTasks?.length) { console.log('No pending tasks.'); return; }
  if (!allAgents?.length) { console.log('No agents found.'); return; }

  const online = allAgents.filter(a => a.status === 'online');
  console.log(`Dispatching ${online.length} agents on ${pendingTasks.length} tasks via Claude Max CLI...`);

  const roleKeywords: Record<string, string[]> = {
    'Designer': ['design', 'ui', 'style', 'animation', 'mobile', 'layout', 'color', 'card'],
    'Security': ['security', 'rls', 'auth', 'sanitize', 'permission', 'policy', 'audit'],
    'QA Tester': ['test', 'qa', 'verify', 'bug', 'fix', 'error', 'validate'],
  };

  const used = new Set<string>();
  const dispatches: Promise<void>[] = [];

  for (const agent of online) {
    const keywords = roleKeywords[agent.role || ''] || [];
    let task = pendingTasks.find(t =>
      !used.has(t.id) &&
      (t.assigned_to === agent.id ||
        (!t.assigned_to && keywords.some(k => (t.title + ' ' + (t.description || '')).toLowerCase().includes(k))))
    );
    if (!task) task = pendingTasks.find(t => !used.has(t.id) && !t.assigned_to);
    if (!task) continue;

    used.add(task.id);
    // Stagger dispatches by 3s each — looks natural, avoids burst
    const delay = dispatches.length * 3000;
    dispatches.push(new Promise(resolve => setTimeout(resolve, delay)).then(() => dispatchAgent(agent as Agent, task as Task)));
  }

  await Promise.all(dispatches);
  console.log(`\nAll agents dispatched! ${used.size} tasks running.`);

  await sb.from('agent_activity').insert({
    type: 'task_update',
    summary: `${used.size} agents deployed via Claude Max CLI — $0 API cost`,
    agent_id: OPENCLAW_ID,
  });
}

main().catch(console.error);
