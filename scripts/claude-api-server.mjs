/**
 * Claude CLI API Server
 * Runs on port 18792, receives chat requests, executes via claude CLI
 * Routes through Cloudflare tunnel — dashboard hits this instead of Anthropic API
 * Cost: $0 (uses Claude Max plan)
 */
import http from 'http';
import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const PORT = 18792;
const CLAUDE_PATH = '/usr/local/bin/claude';
const DEFAULT_REPO = '/Users/openclaw/Projects/supabase-starter-kit';

// In-memory job queue
const jobs = new Map();

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function runClaude(systemPrompt, messages, maxTokens = 2048) {
  // Build conversation as a single prompt
  const history = messages
    .map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\n${history}\n\nAssistant:`
    : `${history}\n\nAssistant:`;

  try {
    const result = execSync(
      `${CLAUDE_PATH} -p ${JSON.stringify(fullPrompt)} --output-format text --max-turns 1`,
      { timeout: 120_000, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    return result.trim();
  } catch (err) {
    throw new Error(`Claude CLI error: ${err.message?.slice(0, 200)}`);
  }
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health') {
    res.writeHead(200, CORS);
    res.end(JSON.stringify({ ok: true, status: 'live', engine: 'claude-cli', plan: 'max' }));
    return;
  }

  // Chat completions (OpenAI-compatible format)
  if (req.method === 'POST' && (req.url === '/v1/chat/completions' || req.url === '/chat')) {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const { messages = [], system, max_tokens = 2048 } = body;

        // Extract system message if in messages array
        const systemMsg = system || messages.find(m => m.role === 'system')?.content || '';
        const chatMessages = messages.filter(m => m.role !== 'system');

        console.log(`[${new Date().toLocaleTimeString()}] Chat request — ${chatMessages.length} messages`);

        const reply = runClaude(systemMsg, chatMessages, max_tokens);

        // Return in OpenAI-compatible format
        res.writeHead(200, CORS);
        res.end(JSON.stringify({
          id: `chatcmpl-cli-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'claude-max-cli',
          choices: [{
            index: 0,
            message: { role: 'assistant', content: reply },
            finish_reason: 'stop',
          }],
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        }));

        console.log(`[${new Date().toLocaleTimeString()}] Done (${reply.length} chars)`);
      } catch (err) {
        console.error('Error:', err.message);
        res.writeHead(500, CORS);
        res.end(JSON.stringify({ error: { message: err.message, type: 'server_error' } }));
      }
    });
    return;
  }

  // Agent chat endpoint (Supabase Edge Function replacement)
  if (req.method === 'POST' && req.url === '/agent-chat') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const { message, agent_name, system_prompt, conversation_id } = JSON.parse(Buffer.concat(chunks).toString());

        const systemMsg = system_prompt || `You are ${agent_name || 'an AI agent'} working on the Circlo sports coaching platform. Be concise and technical.`;
        const reply = runClaude(systemMsg, [{ role: 'user', content: message }]);

        res.writeHead(200, CORS);
        res.end(JSON.stringify({ reply, agent: agent_name, conversation_id }));
      } catch (err) {
        res.writeHead(500, CORS);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Execute task — async job queue
  if (req.method === 'POST' && req.url === '/execute-task') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const { task, agent = 'dev', repo = DEFAULT_REPO, context = '' } = JSON.parse(Buffer.concat(chunks).toString());

        if (!task) {
          res.writeHead(400, CORS);
          res.end(JSON.stringify({ error: 'Missing required field: task' }));
          return;
        }

        const jobId = crypto.randomUUID();
        const job = {
          id: jobId,
          task,
          agent,
          repo,
          status: 'queued',
          createdAt: new Date().toISOString(),
          startedAt: null,
          completedAt: null,
          summary: null,
          commitHash: null,
          error: null,
        };
        jobs.set(jobId, job);

        console.log(`[${new Date().toLocaleTimeString()}] Task queued: ${jobId} — "${task.slice(0, 80)}"`);

        // Fire and forget — runs in background
        runTask(job, context);

        res.writeHead(202, CORS);
        res.end(JSON.stringify({ jobId, status: 'queued', message: 'Task accepted. Poll GET /task-status/' + jobId }));
      } catch (err) {
        res.writeHead(500, CORS);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Task status check
  if (req.method === 'GET' && req.url?.startsWith('/task-status/')) {
    const jobId = req.url.split('/task-status/')[1];
    const job = jobs.get(jobId);

    if (!job) {
      res.writeHead(404, CORS);
      res.end(JSON.stringify({ error: 'Job not found' }));
      return;
    }

    res.writeHead(200, CORS);
    res.end(JSON.stringify({
      id: job.id,
      status: job.status,
      task: job.task,
      agent: job.agent,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      summary: job.summary,
      commitHash: job.commitHash,
      error: job.error,
    }));
    return;
  }

  // List all jobs
  if (req.method === 'GET' && req.url === '/tasks') {
    res.writeHead(200, CORS);
    res.end(JSON.stringify([...jobs.values()].reverse().slice(0, 50)));
    return;
  }

  res.writeHead(404, CORS);
  res.end(JSON.stringify({ error: 'Not found' }));
});

/** Run a coding task via claude CLI in the target repo */
async function runTask(job, context) {
  job.status = 'running';
  job.startedAt = new Date().toISOString();

  try {
    // Load CLAUDE.md if it exists in the repo
    let claudeMd = '';
    const claudeMdPath = path.join(job.repo, 'CLAUDE.md');
    if (existsSync(claudeMdPath)) {
      claudeMd = readFileSync(claudeMdPath, 'utf8');
    }

    // Build the full prompt
    const prompt = [
      claudeMd ? `<context>\n${claudeMd}\n</context>\n` : '',
      context ? `Additional context: ${context}\n\n` : '',
      `TASK: ${job.task}`,
      '',
      'After completing the task, output a one-line summary starting with "SUMMARY:" describing what you did.',
    ].filter(Boolean).join('\n');

    console.log(`[${new Date().toLocaleTimeString()}] Running task ${job.id} in ${job.repo}`);

    // Spawn claude CLI with bypass permissions for autonomous execution
    const result = await new Promise((resolve, reject) => {
      const proc = spawn(CLAUDE_PATH, [
        '-p', prompt,
        '--output-format', 'text',
        '--permission-mode', 'bypassPermissions',
      ], {
        cwd: job.repo,
        timeout: 600_000, // 10 minute max
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', d => { stdout += d.toString(); });
      proc.stderr.on('data', d => { stderr += d.toString(); });

      proc.on('close', code => {
        if (code !== 0) {
          reject(new Error(`Claude exited with code ${code}: ${stderr.slice(0, 500)}`));
        } else {
          resolve(stdout);
        }
      });

      proc.on('error', reject);
    });

    // Extract summary from output
    const summaryMatch = result.match(/SUMMARY:\s*(.+)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : result.slice(-200).trim();

    // Auto-commit
    let commitHash = null;
    try {
      // Check if there are changes to commit
      const status = execSync('git status --porcelain', { cwd: job.repo, encoding: 'utf8' }).trim();
      if (status) {
        const commitMsg = `Agent(${job.agent}): ${summary.slice(0, 72)}`;
        execSync('git add -A', { cwd: job.repo });
        execSync(`git commit -m ${JSON.stringify(commitMsg)}`, { cwd: job.repo });
        commitHash = execSync('git rev-parse --short HEAD', { cwd: job.repo, encoding: 'utf8' }).trim();

        // Push to origin
        execSync('git push origin main', { cwd: job.repo, timeout: 30_000 });
        console.log(`[${new Date().toLocaleTimeString()}] Pushed commit ${commitHash}`);
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] No changes to commit`);
      }
    } catch (gitErr) {
      console.error(`[${new Date().toLocaleTimeString()}] Git error: ${gitErr.message}`);
      // Task still succeeded even if git fails
    }

    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    job.summary = summary;
    job.commitHash = commitHash;

    console.log(`[${new Date().toLocaleTimeString()}] Task ${job.id} completed: ${summary.slice(0, 100)}`);
  } catch (err) {
    job.status = 'failed';
    job.completedAt = new Date().toISOString();
    job.error = err.message?.slice(0, 500);
    console.error(`[${new Date().toLocaleTimeString()}] Task ${job.id} failed: ${err.message}`);
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Claude CLI API Server running on :${PORT}`);
  console.log(`   Engine: claude CLI (Max plan)`);
  console.log(`   Cost: $0 per request`);
  console.log(`   Endpoints:`);
  console.log(`   - POST /v1/chat/completions (OpenAI-compatible)`);
  console.log(`   - POST /agent-chat (agent-specific)`);
  console.log(`   - POST /execute-task (task dispatcher)`);
  console.log(`   - GET  /task-status/:jobId`);
  console.log(`   - GET  /tasks (list all)`);
  console.log(`   - GET  /health`);
});

process.on('SIGTERM', () => { server.close(); process.exit(0); });
process.on('SIGINT', () => { server.close(); process.exit(0); });
