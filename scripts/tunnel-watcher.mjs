/**
 * Tunnel URL Watcher
 * Monitors the cloudflared log for URL changes and:
 * 1. Writes the URL to /tmp/openclaw-gateway-url.txt
 * 2. Saves it to Supabase agent_activity as a system record
 */
import { readFileSync, watchFile, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const LOG_FILE = '/tmp/openclaw-tunnel-err.log';
const URL_FILE = '/tmp/openclaw-gateway-url.txt';
const SUPABASE_URL = 'https://rsevfeogormnorvcvxio.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXZmZW9nb3Jtbm9ydmN2eGlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM3NDI1MSwiZXhwIjoyMDkwOTUwMjUxfQ.lEsXLw5MIrcbOEhLBQamP7XmUyZNv2-npWrMXnE7tBA';
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

let lastUrl = '';

function extractUrl(content) {
  const matches = content.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g);
  return matches ? matches[matches.length - 1] : null;
}

async function onUrlChange(newUrl) {
  if (newUrl === lastUrl) return;
  lastUrl = newUrl;
  console.log(`[watcher] New tunnel URL: ${newUrl}`);
  
  // Write to file for other scripts to read
  writeFileSync(URL_FILE, newUrl);
  
  // Log to Supabase
  await sb.from('agent_activity').insert({
    type: 'info',
    summary: `🔗 Gateway tunnel URL updated: ${newUrl}`,
    agent_id: '3ea81ac2-e6dd-4c81-b220-cb0bb5c0f012',
  });
  
  console.log(`[watcher] URL saved to ${URL_FILE} and Supabase`);
}

// Initial read
try {
  const content = readFileSync(LOG_FILE, 'utf8');
  const url = extractUrl(content);
  if (url) await onUrlChange(url);
} catch {}

// Watch for changes
watchFile(LOG_FILE, { interval: 5000 }, async () => {
  try {
    const content = readFileSync(LOG_FILE, 'utf8');
    const url = extractUrl(content);
    if (url) await onUrlChange(url);
  } catch {}
});

console.log('[watcher] Monitoring tunnel URL changes...');
