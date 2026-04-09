/**
 * OpenClaw Bridge
 * Polls agent_chat for messages addressed to OpenClaw,
 * forwards them to the OpenClaw gateway, and posts replies back.
 *
 * Usage: npx tsx scripts/openclaw-bridge.ts
 * Or run as a background daemon via openclaw cron.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rsevfeogormnorvcvxio.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXZmZW9nb3Jtbm9ydmN2eGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzQyNTEsImV4cCI6MjA5MDk1MDI1MX0.QnP03Rz5r8i6qDq64hOA06J_2PtqH9Ybrv70DyRP_sM';
const OPENCLAW_AGENT_ID = '3ea81ac2-e6dd-4c81-b220-cb0bb5c0f012';

// OpenClaw gateway (local)
const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

if (!OPENCLAW_TOKEN) {
  console.error('❌ OPENCLAW_TOKEN env var not set. Run: export OPENCLAW_TOKEN=<your-gateway-token>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setStatus(status: 'online' | 'busy' | 'offline') {
  await supabase.from('agents').update({
    status,
    updated_at: new Date().toISOString()
  }).eq('id', OPENCLAW_AGENT_ID);
}

async function logActivity(type: string, summary: string, taskId?: string, details?: Record<string, unknown>) {
  await supabase.from('agent_activity').insert({
    type,
    summary,
    agent_id: OPENCLAW_AGENT_ID,
    task_id: taskId || null,
    details: details || null,
  });
}

async function postReply(conversationId: string, content: string) {
  const { error } = await supabase.from('agent_chat').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content,
    agent_id: OPENCLAW_AGENT_ID,
  });
  if (error) console.error('Failed to post reply:', error.message);
}

async function forwardToOpenClaw(message: string, conversationId: string): Promise<string> {
  try {
    const res = await fetch(`${OPENCLAW_URL}/api/agent/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        message,
        session: `dashboard-${conversationId}`,
        source: 'circlo-dashboard',
      }),
    });
    if (!res.ok) throw new Error(`Gateway returned ${res.status}`);
    const data = await res.json() as { reply?: string };
    return data.reply || '(no reply)';
  } catch (err) {
    console.error('OpenClaw gateway error:', err);
    return `I'm here but couldn't reach my own gateway. Error: ${(err as Error).message}`;
  }
}

async function processPendingMessages() {
  // Fetch unprocessed user messages for OpenClaw's conversation
  const { data: messages, error } = await supabase
    .from('agent_chat')
    .select('*')
    .eq('agent_id', OPENCLAW_AGENT_ID)
    .eq('role', 'user')
    .is('processed_at', null)
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) { console.error('Fetch error:', error.message); return; }
  if (!messages || messages.length === 0) return;

  await setStatus('busy');

  for (const msg of messages) {
    console.log(`[bridge] Processing message: "${msg.content.slice(0, 60)}..."`);

    // Mark as processing immediately
    await supabase.from('agent_chat')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', msg.id);

    const reply = await forwardToOpenClaw(msg.content, msg.conversation_id);
    await postReply(msg.conversation_id, reply);
    await logActivity('chat', `Replied in dashboard chat: "${msg.content.slice(0, 50)}"`);
  }

  await setStatus('online');
}

async function heartbeat() {
  await supabase.from('agents').update({
    status: 'online',
    updated_at: new Date().toISOString()
  }).eq('id', OPENCLAW_AGENT_ID);
}

// Main loop
async function main() {
  console.log('🦾 OpenClaw Bridge starting...');
  await setStatus('online');
  await logActivity('task_update', 'OpenClaw bridge started — connected and online');

  // Heartbeat every 60s
  setInterval(heartbeat, 60_000);

  // Poll for messages every 5s
  setInterval(processPendingMessages, 5_000);

  // Also use Supabase realtime for instant response
  supabase
    .channel('openclaw-bridge')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'agent_chat',
      filter: `agent_id=eq.${OPENCLAW_AGENT_ID}`,
    }, (payload) => {
      const row = payload.new as { role: string };
      if (row.role === 'user') {
        setTimeout(processPendingMessages, 500);
      }
    })
    .subscribe();

  console.log('✅ Bridge running. Listening for messages from the dashboard...');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Bridge shutting down...');
  await setStatus('offline');
  await logActivity('task_update', 'OpenClaw bridge stopped');
  process.exit(0);
});

process.on('SIGINT', async () => {
  await setStatus('offline');
  process.exit(0);
});

main().catch(console.error);
