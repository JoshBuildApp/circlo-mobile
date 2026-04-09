import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { coachProfileId } = await req.json();
    if (!coachProfileId) throw new Error("coachProfileId required");

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Gather data for last 7 days
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const todayStr = today.toISOString().split("T")[0];
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const prevWeekAgoStr = new Date(today.getTime() - 14 * 86400000).toISOString().split("T")[0];

    const [bookingsRes, prevBookingsRes, videosRes, followersRes] = await Promise.all([
      sb.from("bookings").select("date, price, time, status, training_type, user_id")
        .eq("coach_id", coachProfileId).gte("date", weekAgoStr).neq("status", "cancelled"),
      sb.from("bookings").select("date, price, status")
        .eq("coach_id", coachProfileId).gte("date", prevWeekAgoStr).lt("date", weekAgoStr).neq("status", "cancelled"),
      sb.from("coach_videos").select("views, likes_count, created_at")
        .eq("coach_id", coachProfileId).gte("created_at", weekAgo.toISOString()),
      sb.rpc("get_follower_count", { coach_id_input: coachProfileId }),
    ]);

    const bookings = bookingsRes.data || [];
    const prevBookings = prevBookingsRes.data || [];
    const videos = videosRes.data || [];
    const followerCount = typeof followersRes.data === "number" ? followersRes.data : 0;

    const thisWeekSessions = bookings.length;
    const prevWeekSessions = prevBookings.length;
    const thisWeekRevenue = bookings.reduce((s: number, b: any) => s + (b.price || 0), 0);
    const prevWeekRevenue = prevBookings.reduce((s: number, b: any) => s + (b.price || 0), 0);
    const uniqueClients = new Set(bookings.map((b: any) => b.user_id)).size;
    const newViews = videos.reduce((s: number, v: any) => s + (v.views || 0), 0);
    const newLikes = videos.reduce((s: number, v: any) => s + (v.likes_count || 0), 0);

    // Bookings by day of week
    const dayMap: Record<string, number> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayNames.forEach(d => { dayMap[d] = 0; });
    bookings.forEach((b: any) => {
      const d = new Date(b.date).getDay();
      dayMap[dayNames[d]]++;
    });

    // By training type
    const typeMap: Record<string, number> = {};
    bookings.forEach((b: any) => {
      const t = b.training_type || "personal";
      typeMap[t] = (typeMap[t] || 0) + 1;
    });

    // By hour
    const hourMap: Record<string, number> = {};
    bookings.forEach((b: any) => {
      const h = (b.time || "").split(":")[0];
      if (h) hourMap[h + ":00"] = (hourMap[h + ":00"] || 0) + 1;
    });

    const sessionGrowth = prevWeekSessions > 0
      ? Math.round(((thisWeekSessions - prevWeekSessions) / prevWeekSessions) * 100)
      : thisWeekSessions > 0 ? 100 : 0;
    const revenueGrowth = prevWeekRevenue > 0
      ? Math.round(((thisWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
      : thisWeekRevenue > 0 ? 100 : 0;

    const dataPrompt = `Weekly coaching data (${weekAgoStr} to ${todayStr}):
- Sessions this week: ${thisWeekSessions} (${sessionGrowth > 0 ? "+" : ""}${sessionGrowth}% vs last week)
- Revenue: ₪${thisWeekRevenue} (${revenueGrowth > 0 ? "+" : ""}${revenueGrowth}% vs last week)
- Unique clients: ${uniqueClients}
- Followers: ${followerCount}
- New content views: ${newViews}, likes: ${newLikes}
- Videos posted: ${videos.length}
- Bookings by day: ${JSON.stringify(dayMap)}
- By training type: ${JSON.stringify(typeMap)}
- By hour: ${JSON.stringify(hourMap)}`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: `You are Bob, a friendly AI coaching advisor. Generate a concise weekly performance report for a coach.

Return a JSON object using the tool provided. Include:
- summary: 2-3 sentence overview of the week
- highlights: array of 2-3 positive achievements (short strings)
- recommendations: array of 3 actionable next steps with title and description
- metrics: object with sessions, revenue, clients, growth (session % change), revenueGrowth (revenue % change)

Be encouraging but data-driven. Reference specific numbers and days.`,
          },
          { role: "user", content: dataPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_report",
              description: "Generate the weekly report",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  highlights: { type: "array", items: { type: "string" } },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        type: { type: "string", enum: ["schedule", "revenue", "engagement"] },
                      },
                      required: ["title", "description", "type"],
                      additionalProperties: false,
                    },
                  },
                  metrics: {
                    type: "object",
                    properties: {
                      sessions: { type: "number" },
                      revenue: { type: "number" },
                      clients: { type: "number" },
                      growth: { type: "number" },
                      revenueGrowth: { type: "number" },
                    },
                    required: ["sessions", "revenue", "clients", "growth", "revenueGrowth"],
                    additionalProperties: false,
                  },
                },
                required: ["summary", "highlights", "recommendations", "metrics"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Google AI API error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let report = {};

    if (toolCall?.function?.arguments) {
      report = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
