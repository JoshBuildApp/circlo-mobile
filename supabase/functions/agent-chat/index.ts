import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const CLAUDE_CLI_SERVER_URL = Deno.env.get("CLAUDE_CLI_SERVER_URL") ?? ""; // Local CLI server = $0
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/**
 * Tiered model selection based on task complexity
 * Low priority  → Haiku (fast, cheap)
 * Medium/High   → Sonnet (balanced)
 * Urgent/complex → Opus (most capable)
 */
function selectModel(agent: any, tasks: any[]): string {
  // If agent has a specific model set, respect it
  if (agent.model && agent.model !== "claude-sonnet-4-20250514") return agent.model;

  // Find the highest priority task assigned to this agent
  const agentTasks = tasks.filter((t: any) => t.assigned_to === agent.id && t.status === "in_progress");
  const topTask = agentTasks[0];

  if (!topTask) return "claude-haiku-3-5-20241022"; // idle — use cheapest

  const priority = topTask.priority || "medium";
  const description = (topTask.description || "").toLowerCase();

  // Complex keywords that warrant Opus
  const complexKeywords = ["architecture", "security", "audit", "rls", "migration", "refactor", "performance", "algorithm"];
  const isComplex = complexKeywords.some(k => description.includes(k));

  if (priority === "urgent" && isComplex) return "claude-opus-4-5";
  if (priority === "urgent" || priority === "high") return "claude-sonnet-4-20250514";
  if (priority === "medium") return "claude-sonnet-4-20250514";
  return "claude-haiku-3-5-20241022"; // low priority
}

// OpenClaw Gateway integration
const OPENCLAW_GATEWAY_URL = Deno.env.get("OPENCLAW_GATEWAY_URL") ?? "";
const OPENCLAW_GATEWAY_TOKEN = Deno.env.get("OPENCLAW_GATEWAY_TOKEN") ?? "";
const OPENCLAW_AGENT_ID = "3ea81ac2-e6dd-4c81-b220-cb0bb5c0f012";

const BASE_CONTEXT = `## Circlo Project Context
Circlo is a sports coaching marketplace app built by Guy Avnaim.
- Athletes find coaches, book sessions, watch videos, join communities.
- Tech: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase
- Brand: "Circlo" (capital C). Teal #00D4AA, Orange #FF6B2C, Navy #1A1A2E
- 12 sports: Padel, Fitness, Tennis, Boxing, Soccer, Basketball, Yoga, Swimming, Running, MMA, CrossFit, Martial Arts
- 4 roles: user, coach, admin, developer
- 27 pages, 60+ components, 28 custom hooks, 4 context providers
- Database: Supabase PostgreSQL with RLS on all tables
- Key tables: profiles, user_roles, coach_profiles, coach_videos, bookings, availability, messages, notifications, communities, trainee_progress, badges, products, reviews

## Key Architecture
- State: React Context (AuthContext, ThemeContext, DataModeContext, DevGateContext) — NO Redux/Zustand
- Data fetching: Custom hooks in src/hooks/ using Supabase client
- UI: Tailwind utility classes + cn() helper, shadcn/ui primitives in components/ui/
- Auth: Supabase email/password, roles in user_roles table
- Security: RLS on all tables, payment fields protected by RPC, coach status fields admin-only
- Routing: React Router v6, lazy loaded pages in App.tsx
- Patterns: Batch enrichment, optimistic UI, real-time subscriptions with cleanup

## Key Files
- src/App.tsx — routes + provider tree
- src/contexts/AuthContext.tsx — auth + roles
- src/integrations/supabase/client.ts — Supabase connection
- src/integrations/supabase/types.ts — auto-generated (DO NOT edit)
- src/components/ui/ — shadcn primitives (DO NOT edit unless fixing bugs)

## Rules
- Always use @/ path aliases for imports
- Tailwind only, no CSS modules
- Handle all Supabase errors
- Never bypass RLS
- Never use any type
- Mobile-first responsive (base = mobile, md: = desktop)`;

function buildSystemPrompt(agent: any, tasks: any[], activity: any[]): string {
  let prompt = `You are ${agent.name}, an AI agent working for Guy Avnaim on Circlo.

## Your Identity
- Name: ${agent.name}
- Role: ${agent.role}
${agent.specialty ? `- Specialty: ${agent.specialty}` : ""}
- Bio: ${agent.bio}
- Mission: ${agent.mission}

## Your Personality
- Talk like a direct, efficient teammate. Casual but professional.
- No generic AI pleasantries. No "Certainly!", no "Great question!". Just get to work.
- Keep responses concise. Use bullet points.
- If something is unclear, ask a smart question.
- If you see a problem, flag it proactively.
- When giving code, make it production-ready — no placeholders, no TODOs.

${agent.system_prompt ? `## Custom Instructions\n${agent.system_prompt}\n` : ""}

${BASE_CONTEXT}`;

  if (tasks.length > 0) {
    prompt += `\n\n## Current Tasks\n`;
    tasks.forEach((t) => {
      prompt += `- [${t.status}] [${t.priority}] ${t.title}${t.description ? ` — ${t.description}` : ""}\n`;
    });
  }

  if (activity.length > 0) {
    prompt += `\n\n## Recent Activity\n`;
    activity.forEach((a) => {
      prompt += `- [${a.type}] ${a.summary}\n`;
    });
  }

  prompt += `\n\n## How You Work
You respond via the Agent Dashboard. Guy manages tasks and chats with you here.
When Guy gives you a coding task:
1. Break it down into clear steps
2. Write the actual code (full files or diffs)
3. Explain what you changed and why
4. Flag any follow-up work needed
Always write code that follows Circlo conventions. Reference actual files and paths.`;

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
      },
    });
  }

  try {
    const { message, conversation_id = "default", agent_id } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load the agent profile
    let agent;
    if (agent_id) {
      const { data } = await supabase.from("agents").select("*").eq("id", agent_id).single();
      agent = data;
    }
    if (!agent) {
      // Smart auto-assign based on message content
      const msg = message.toLowerCase();
      let targetRole = "Senior Developer"; // default to Dev
      if (msg.includes("design") || msg.includes("ui") || msg.includes("style") || msg.includes("mobile") || msg.includes("animation") || msg.includes("pixel")) {
        targetRole = "Designer";
      } else if (msg.includes("security") || msg.includes("rls") || msg.includes("auth") || msg.includes("sanitize") || msg.includes("shield")) {
        targetRole = "Security";
      } else if (msg.includes("test") || msg.includes("qa") || msg.includes("build") || msg.includes("bug") || msg.includes("pulse")) {
        targetRole = "QA Tester";
      }
      const { data } = await supabase.from("agents").select("*").eq("role", targetRole).limit(1).single();
      agent = data;
    }
    if (!agent) {
      // Final fallback to Dev
      const { data } = await supabase.from("agents").select("*").order("created_at", { ascending: true }).limit(1).single();
      agent = data;
    }
    if (!agent) {
      agent = { name: "Dev", bio: "AI developer", mission: "Build Circlo", role: "developer", specialty: "Full-stack" };
    }

    // Update agent status to busy
    if (agent.id) {
      await supabase.from("agents").update({ status: "busy" }).eq("id", agent.id);
    }

    // Save the user message
    await supabase.from("agent_chat").insert({
      conversation_id,
      agent_id: agent.id || null,
      role: "user",
      content: message,
    });

    // Load conversation history
    const { data: history } = await supabase
      .from("agent_chat")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(40);

    // Load tasks assigned to this agent (or all pending tasks)
    const tasksQuery = supabase
      .from("agent_tasks")
      .select("title, description, status, priority")
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: true })
      .limit(10);
    if (agent.id) {
      tasksQuery.or(`assigned_to.eq.${agent.id},assigned_to.is.null`);
    }
    const { data: tasks } = await tasksQuery;

    // Load recent activity
    const { data: activity } = await supabase
      .from("agent_activity")
      .select("type, summary")
      .order("created_at", { ascending: false })
      .limit(5);

    // Build the system prompt from agent profile + context
    const systemPrompt = buildSystemPrompt(agent, tasks || [], activity || []);

    // Route to OpenClaw gateway if this is the OpenClaw agent and gateway is configured
    const isOpenClaw = agent.id === OPENCLAW_AGENT_ID;
    let reply: string;

    if (isOpenClaw && OPENCLAW_GATEWAY_URL && OPENCLAW_GATEWAY_TOKEN) {
      // ── OpenClaw live routing via OpenAI-compatible gateway API ──
      console.log("Routing to OpenClaw gateway...");
      const openClawMessages = (history || []).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const gwResponse = await fetch(`${OPENCLAW_GATEWAY_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENCLAW_GATEWAY_TOKEN}`,
        },
        body: JSON.stringify({
          model: "openclaw/main",
          messages: [
            { role: "system", content: `You are OpenClaw, Guy's always-on AI crew member on the Circlo dashboard. You have full context of the codebase and tasks. Be direct, technical, and action-oriented. Source: Circlo Agent Dashboard.` },
            ...openClawMessages,
          ],
          stream: false,
        }),
      });

      if (!gwResponse.ok) {
        const errText = await gwResponse.text();
        console.error("OpenClaw gateway error:", errText);
        reply = `OpenClaw gateway unreachable (${gwResponse.status}). Make sure the Mac mini is online and the gateway is running.`;
      } else {
        const gwData = await gwResponse.json();
        reply = gwData.choices?.[0]?.message?.content || "(no reply from gateway)";
      }
    } else {
      // ── Route: CLI Server ($0) > OpenRouter (cheap) > Anthropic (expensive) ──
      const messages = [
        { role: "system", content: systemPrompt },
        ...(history || []).map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))
      ];

      // Map model names to OpenRouter format
      const modelMap: Record<string, string> = {
        "claude-haiku-3-5-20241022": "anthropic/claude-haiku-3-5",
        "claude-sonnet-4-20250514": "anthropic/claude-sonnet-4-5",
        "claude-opus-4-5": "anthropic/claude-opus-4-5",
      };
      const rawModel = selectModel(agent, tasks || []);
      const orModel = modelMap[rawModel] || "anthropic/claude-sonnet-4-5";

      let reply_text = "";

      // Option 1: Free CLI server on Mac mini
      if (CLAUDE_CLI_SERVER_URL) {
        try {
          const cliRes = await fetch(`${CLAUDE_CLI_SERVER_URL}/agent-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: messages[messages.length - 1]?.content || "",
              agent_name: agent.name,
              system_prompt: systemPrompt,
              conversation_id,
            }),
          });
          if (cliRes.ok) {
            const cliData = await cliRes.json();
            reply_text = cliData.reply || "";
            console.log(`[CLI] ${agent.name} responded via Claude Max CLI - $0 cost`);
          }
        } catch (e) {
          console.log("CLI server unavailable, falling back...", e);
        }
      }

      // Option 2: OpenRouter (cheap fallback)
      const apiKey = OPENROUTER_API_KEY || ANTHROPIC_API_KEY;
      const apiUrl = OPENROUTER_API_KEY
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://api.anthropic.com/v1/messages";

      if (!reply_text && OPENROUTER_API_KEY) {
        // OpenRouter (OpenAI-compatible)
        const orResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://circloclub.com",
            "X-Title": "Circlo Agent Dashboard",
          },
          body: JSON.stringify({ model: orModel, messages, max_tokens: 4096 }),
        });
        if (!orResponse.ok) {
          const errText = await orResponse.text();
          console.error("OpenRouter error:", errText);
          reply_text = "I encountered an error. Please try again.";
        } else {
          const orData = await orResponse.json();
          reply_text = orData.choices?.[0]?.message?.content || "No response.";
        }
      } else if (!reply_text) {
        // Fallback: Anthropic direct
        const claudeMessages = messages.filter(m => m.role !== "system");
        const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: rawModel, max_tokens: 4096, system: systemPrompt, messages: claudeMessages }),
        });
        if (!claudeResponse.ok) {
          reply_text = "AI response failed.";
        } else {
          const d = await claudeResponse.json();
          reply_text = d.content?.[0]?.text || "No response.";
        }
      }
      reply = reply_text;
    }

    // Save the response
    await supabase.from("agent_chat").insert({
      conversation_id,
      agent_id: agent.id || null,
      role: "assistant",
      content: reply,
    });

    // Log activity
    await supabase.from("agent_activity").insert({
      agent_id: agent.id || null,
      type: "chat",
      summary: `${agent.name} responded to: "${message.slice(0, 50)}${message.length > 50 ? "..." : ""}"`,
    });

    // Set agent back to online
    if (agent.id) {
      await supabase.from("agents").update({ status: "online" }).eq("id", agent.id);
    }

    return new Response(JSON.stringify({ reply, conversation_id, agent_name: agent.name }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
