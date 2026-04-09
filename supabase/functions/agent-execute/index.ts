// ============================================================
// AGENT EXECUTE — Gives agents the ability to read, edit, and
// commit code directly to GitHub. No local Mac needed.
//
// Flow:
// 1. Receive task + agent info
// 2. Read relevant files from GitHub
// 3. Ask AI to generate code changes
// 4. Commit changes to GitHub via API
// 5. Log everything to Supabase
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") ?? "";
const GITHUB_REPO = Deno.env.get("GITHUB_REPO") ?? "JoshBuildApp/supabase-starter-kit";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── GitHub API helpers ──

async function githubGet(path: string) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function readFile(filePath: string): Promise<{ content: string; sha: string } | null> {
  const data = await githubGet(`contents/${filePath}`);
  if (!data || !data.content) return null;
  const content = atob(data.content.replace(/\n/g, ""));
  return { content, sha: data.sha };
}

async function writeFile(filePath: string, content: string, message: string, sha?: string) {
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: "main",
  };
  if (sha) body.sha = sha;

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function listFiles(dirPath: string): Promise<string[]> {
  const data = await githubGet(`contents/${dirPath}`);
  if (!Array.isArray(data)) return [];
  return data.map((f: { name: string; path: string }) => f.path);
}

// ── Model selection per agent role ──
// OpenClaw + Shield = Claude Sonnet (smart, $0.03/task)
// Dev, Pixel, Pulse, others = DeepSeek or Llama (free)

function selectModel(agent: any): string {
  const role = (agent?.role || "").toLowerCase();
  const name = (agent?.name || "").toLowerCase();

  // Boss and security need the best brain
  if (name === "openclaw" || role.includes("lead")) return "anthropic/claude-sonnet-4";
  if (name === "shield" || role.includes("security")) return "anthropic/claude-3.5-haiku";
  if (name === "vault" || name === "cipher") return "anthropic/claude-3.5-haiku";

  // Everyone else uses free/cheap models
  return "deepseek/deepseek-chat-v3-0324:free";
}

// ── AI call via OpenRouter (all models in one place) ──

async function askAI(systemPrompt: string, userMessage: string, agent?: any): Promise<string> {
  const model = selectModel(agent);

  if (OPENROUTER_API_KEY) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://circloclub.com",
        "X-Title": "Circlo Agent Dashboard",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 8192,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    }
    // If the model fails, try free fallback
    const fallbackRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 8192,
      }),
    });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return data.choices?.[0]?.message?.content || "";
    }
  }

  // Last resort: Anthropic direct
  if (ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.content?.[0]?.text || "";
    }
  }

  return "Error: No AI provider available";
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { task_id, agent_id } = await req.json();

    if (!task_id) {
      return new Response(JSON.stringify({ error: "task_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load task
    const { data: task } = await supabase.from("agent_tasks").select("*").eq("id", task_id).single();
    if (!task) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load ALL agents for smart routing
    const { data: allAgents } = await supabase.from("agents").select("*").order("created_at", { ascending: true });
    const agents = allAgents || [];

    // Smart agent routing — if assigned agent is busy, pass to next available on same team
    let agent;

    if (agent_id) {
      const assigned = agents.find((a: any) => a.id === agent_id);
      if (assigned && assigned.status !== "busy") {
        // Assigned agent is available — use them
        agent = assigned;
      } else if (assigned) {
        // Assigned agent is BUSY — find next available with same role/team
        const sameTeam = agents.filter((a: any) =>
          a.id !== agent_id &&
          a.status !== "busy" &&
          (a.role === assigned.role || a.team === assigned.team)
        );
        if (sameTeam.length > 0) {
          agent = sameTeam[0];
          // Log the handoff
          await supabase.from("agent_activity").insert({
            type: "task_update",
            summary: `${assigned.name} is busy — task passed to ${sameTeam[0].name}`,
            task_id, agent_id: sameTeam[0].id,
          });
        } else {
          // No same-team agent available — find ANY available agent (not OpenClaw)
          const anyAvailable = agents.find((a: any) =>
            a.status !== "busy" && a.name !== "OpenClaw"
          );
          agent = anyAvailable || assigned; // fallback to busy agent if nobody is free
          if (anyAvailable) {
            await supabase.from("agent_activity").insert({
              type: "task_update",
              summary: `No ${assigned.role} available — task passed to ${anyAvailable.name}`,
              task_id, agent_id: anyAvailable.id,
            });
          }
        }
      }
    }

    if (!agent) {
      // No agent specified — find any available agent (not OpenClaw for low priority)
      const taskPriority = task.priority || "medium";
      if (taskPriority === "low") {
        agent = agents.find((a: any) => a.status !== "busy" && a.name !== "OpenClaw");
      }
      if (!agent) {
        agent = agents.find((a: any) => a.status !== "busy") || agents[0];
      }
    }

    const agentName = agent?.name || "Dev";

    // Set agent to busy + task to in_progress
    if (agent?.id) await supabase.from("agents").update({ status: "busy" }).eq("id", agent.id);
    await supabase.from("agent_tasks").update({ status: "in_progress", assigned_to: agent?.id, updated_at: new Date().toISOString() }).eq("id", task_id);

    // Log start
    await supabase.from("agent_activity").insert({
      type: "task_update",
      summary: `${agentName} started executing: "${task.title}"`,
      task_id, agent_id: agent?.id,
    });

    // ── Step 1: Read relevant files ──
    // Determine which files to read based on task description
    const fileHints = task.description?.match(/src\/[^\s,'"]+/g) || [];
    const filesToRead = fileHints.length > 0 ? fileHints : [];

    // Also list key directories for context
    const srcFiles = await listFiles("src/pages");
    const componentFiles = await listFiles("src/components");
    const hookFiles = await listFiles("src/hooks");

    // Read the specific files mentioned in the task
    const fileContents: Record<string, string> = {};
    for (const f of filesToRead.slice(0, 5)) { // Max 5 files to keep token usage reasonable
      const file = await readFile(f);
      if (file) fileContents[f] = file.content;
    }

    // ── Step 2: Ask AI to generate changes ──
    const systemPrompt = `You are ${agentName}, an AI agent that writes production-ready code for the Circlo project.

CRITICAL: You must respond with EXACT file changes in this format:

===FILE: path/to/file.tsx===
(entire new file content here)
===END===

Rules:
- React 18 + TypeScript + Tailwind + shadcn/ui + Supabase
- Use @/ path aliases for imports
- Use cn() from @/lib/utils for conditional classes
- Handle all Supabase errors
- Mobile-first responsive (base=mobile, md:=desktop)
- Never edit src/integrations/supabase/types.ts
- Never edit src/components/ui/ unless fixing a bug

Available files in project:
Pages: ${srcFiles.join(", ")}
Components: ${componentFiles.slice(0, 20).join(", ")}
Hooks: ${hookFiles.join(", ")}`;

    const fileContext = Object.entries(fileContents).length > 0
      ? "\n\nCurrent file contents:\n" + Object.entries(fileContents).map(([path, content]) =>
          `\n===CURRENT: ${path}===\n${content.slice(0, 3000)}\n===END===`
        ).join("")
      : "";

    const userMessage = `Task: ${task.title}\nDescription: ${task.description || "No description"}\nPriority: ${task.priority}${fileContext}\n\nGenerate the code changes needed. Use the ===FILE: path=== format for each file you want to create or modify.`;

    const aiResponse = await askAI(systemPrompt, userMessage, agent);

    // ── Step 3: Parse and commit changes ──
    const fileRegex = /===FILE:\s*(.+?)===\n([\s\S]*?)===END===/g;
    let match;
    let filesChanged = 0;
    const changedFiles: string[] = [];

    while ((match = fileRegex.exec(aiResponse)) !== null) {
      const filePath = match[1].trim();
      const newContent = match[2].trim();

      // Read existing file to get SHA (needed for updates)
      const existing = await readFile(filePath);
      const commitMsg = `${agentName}: ${task.title} — update ${filePath.split("/").pop()}`;

      const success = await writeFile(filePath, newContent, commitMsg, existing?.sha);
      if (success) {
        filesChanged++;
        changedFiles.push(filePath);
      }
    }

    // ── Step 4: Log results ──
    const now = new Date().toISOString();

    if (filesChanged > 0) {
      // Log file changes
      await supabase.from("agent_activity").insert({
        type: "commit",
        summary: `${agentName} committed ${filesChanged} file(s): ${changedFiles.join(", ")}`,
        task_id, agent_id: agent?.id,
        details: { files: changedFiles },
      });

      // Update agent stats
      if (agent?.id) {
        await supabase.from("agents").update({
          commits_count: (agent.commits_count || 0) + 1,
          tasks_completed: (agent.tasks_completed || 0) + 1,
          status: "online",
        }).eq("id", agent.id);
      }

      // Mark task completed
      await supabase.from("agent_tasks").update({
        status: "completed", completed_at: now, updated_at: now,
      }).eq("id", task_id);

      await supabase.from("agent_activity").insert({
        type: "task_update",
        summary: `${agentName} completed: "${task.title}" (${filesChanged} files changed)`,
        task_id, agent_id: agent?.id,
      });
    } else {
      // No files changed — agent gave advice but couldn't generate proper file format
      await supabase.from("agent_activity").insert({
        type: "task_update",
        summary: `${agentName} analyzed: "${task.title}" but no files were changed`,
        task_id, agent_id: agent?.id,
      });

      // Set agent back to online
      if (agent?.id) await supabase.from("agents").update({ status: "online" }).eq("id", agent.id);
    }

    // Save the AI response to chat for reference
    await supabase.from("agent_chat").insert({
      conversation_id: `execute-${task_id}`,
      agent_id: agent?.id,
      role: "assistant",
      content: filesChanged > 0
        ? `✅ Completed "${task.title}"\n\nChanged ${filesChanged} file(s):\n${changedFiles.map(f => `- ${f}`).join("\n")}\n\nChanges pushed to GitHub.`
        : `Analyzed "${task.title}" but couldn't generate file changes. Here's my analysis:\n\n${aiResponse.slice(0, 1000)}`,
    });

    return new Response(JSON.stringify({
      success: true,
      task_id,
      agent_name: agentName,
      files_changed: filesChanged,
      files: changedFiles,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("agent-execute error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
