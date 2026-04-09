import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rsevfeogormnorvcvxio.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXZmZW9nb3Jtbm9ydmN2eGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzQyNTEsImV4cCI6MjA5MDk1MDI1MX0.QnP03Rz5r8i6qDq64hOA06J_2PtqH9Ybrv70DyRP_sM';
const ENDPOINT = `${SUPABASE_URL}/functions/v1/agent-chat`;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    console.log(`  ✅ ${name} (${Date.now() - start}ms)`);
  } catch (err) {
    console.log(`  ❌ ${name} — ${err}`);
  }
}

async function run() {
  console.log('\n🧪 Edge Function Tests\n');
  const testConvId = `test-${Date.now()}`;

  // Test 1: Valid message
  await test('Valid message returns reply', async () => {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test message — respond with OK', conversation_id: testConvId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.reply) throw new Error('No reply field');
    if (!data.conversation_id) throw new Error('No conversation_id');
    if (!data.agent_name) throw new Error('No agent_name');
  });

  // Test 2: Empty message returns 400
  await test('Empty message returns 400', async () => {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 3: Messages saved to DB
  await test('Messages saved to agent_chat', async () => {
    const { data } = await sb
      .from('agent_chat')
      .select('*')
      .eq('conversation_id', testConvId)
      .order('created_at', { ascending: true });
    if (!data || data.length < 2) throw new Error(`Expected 2+ messages, got ${data?.length || 0}`);
    if (data[0].role !== 'user') throw new Error('First message should be user');
    if (data[1].role !== 'assistant') throw new Error('Second message should be assistant');
  });

  // Test 4: Activity logged
  await test('Activity logged to agent_activity', async () => {
    const { data } = await sb
      .from('agent_activity')
      .select('*')
      .eq('type', 'chat')
      .order('created_at', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) throw new Error('No chat activity found');
  });

  // Cleanup test messages
  await sb.from('agent_chat').delete().eq('conversation_id', testConvId);

  console.log('\n✅ All tests complete\n');
}

run();
