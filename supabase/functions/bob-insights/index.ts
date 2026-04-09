import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type RecommendationType = "schedule" | "revenue" | "engagement";

interface Recommendation {
  title: string;
  description: string;
  type: RecommendationType;
}

interface CoachData {
  totalSessions?: number;
  totalRevenue?: number;
  avgPerDay?: number;
  mostActiveDay?: string;
  mostActiveWeek?: string;
  followerCount?: number;
  uniqueClients?: number;
  videoCount?: number;
  totalViews?: number;
  totalLikes?: number;
  completionRate?: number;
  bookingsByDay?: Record<string, number>;
  period?: string;
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const FALLBACK_TYPES: RecommendationType[] = ["schedule", "revenue", "engagement"];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toTitle = (text: string) =>
  text
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getTopBookingDays = (bookingsByDay: Record<string, number> = {}) =>
  Object.entries(bookingsByDay).sort((a, b) => b[1] - a[1]);

const buildFallbackRecommendations = (coachData: CoachData): Recommendation[] => {
  const topDays = getTopBookingDays(coachData.bookingsByDay);
  const [bestDay = [coachData.mostActiveDay || "your busiest day", 0], secondDay = ["another strong day", 0]] = topDays;
  const averageRevenuePerClient = coachData.uniqueClients
    ? Math.round((coachData.totalRevenue || 0) / coachData.uniqueClients)
    : 0;

  const scheduleDescription = bestDay[1] > 0
    ? `Open 1-2 extra slots on ${toTitle(bestDay[0])} and test a repeat slot on ${toTitle(secondDay[0])}. That's where demand is already strongest in your ${coachData.period || "recent"} data.`
    : `Set a consistent weekly window on ${coachData.mostActiveDay || "your most active day"} so clients learn when to book. A repeat schedule usually lifts conversion faster than scattered availability.`;

  const revenueDescription = (coachData.totalSessions || 0) > 0
    ? `You're averaging about ₪${averageRevenuePerClient || Math.round((coachData.totalRevenue || 0) / Math.max(coachData.totalSessions || 1, 1))} per client in this period. Package your busiest time blocks into premium or small-group offers to lift revenue without adding many more hours.`
    : `Start with one clear paid offer and one starter session price, then push traffic into those two options only. Simpler pricing makes it easier to convert your first bookings.`;

  const engagementDescription = (coachData.videoCount || 0) > 0
    ? `Your videos generated ${coachData.totalViews || 0} views and ${coachData.totalLikes || 0} likes. Post follow-up clips around the topics that already perform well and add a booking CTA in every caption to turn attention into sessions.`
    : `Post 2 short coach videos this week showing your training style and one client result. Video is still the fastest way to build trust when profile traffic is low.`;

  return [
    { title: "Expand busy-day slots", description: scheduleDescription, type: "schedule" },
    { title: "Lift revenue per client", description: revenueDescription, type: "revenue" },
    { title: "Turn views into bookings", description: engagementDescription, type: "engagement" },
  ];
};

const normalizeRecommendations = (input: unknown, coachData: CoachData): Recommendation[] => {
  const fallback = buildFallbackRecommendations(coachData);

  if (!Array.isArray(input)) return fallback;

  const cleaned = input
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => {
      const fallbackItem = fallback[index] || fallback[0];
      const type = FALLBACK_TYPES.includes(item.type as RecommendationType)
        ? (item.type as RecommendationType)
        : fallbackItem.type;

      return {
        title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : fallbackItem.title,
        description: typeof item.description === "string" && item.description.trim()
          ? item.description.trim()
          : fallbackItem.description,
        type,
      } satisfies Recommendation;
    })
    .slice(0, 3);

  while (cleaned.length < 3) {
    cleaned.push(fallback[cleaned.length]);
  }

  return cleaned;
};

const fetchAiRecommendations = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<Recommendation[] | null> => {
  let delay = 800;

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_recommendations",
              description: "Return 3 coach recommendations",
              parameters: {
                type: "object",
                properties: {
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
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_recommendations" } },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) return null;

      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.recommendations || null;
    }

    const errorText = await response.text();
    console.error("OpenRouter API error:", response.status, errorText);

    if (!RETRYABLE_STATUS.has(response.status)) {
      return null;
    }

    if (attempt < 2) {
      await wait(delay);
      delay *= 2;
    }
  }

  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const coachData: CoachData | undefined = body?.coachData;
    if (!coachData || typeof coachData !== "object") {
      return json({ error: "Invalid coachData payload." }, 400);
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const systemPrompt = `You are Bob, a friendly but professional AI coaching advisor. You analyze coach activity data and provide actionable recommendations to help coaches improve their schedule, increase bookings, and grow revenue.

RULES:
- Return EXACTLY 3 recommendations as a JSON array
- Each recommendation has: "title" (short, 6 words max), "description" (1-2 sentences, actionable), "type" ("schedule" | "revenue" | "engagement")
- Be specific — reference actual days, times, or numbers from the data
- Be encouraging but honest
- If data is sparse, suggest ways to get started

Return ONLY valid JSON array, no markdown, no explanation.`;

    const userPrompt = `Here is the coach's activity data:

Sessions: ${coachData.totalSessions} total, avg ${coachData.avgPerDay}/day
Revenue: ₪${coachData.totalRevenue}
Most active day: ${coachData.mostActiveDay}
Most active week: ${coachData.mostActiveWeek}
Followers: ${coachData.followerCount}
Unique clients: ${coachData.uniqueClients}
Videos posted: ${coachData.videoCount}
Total views: ${coachData.totalViews}
Total likes: ${coachData.totalLikes}
Video completion rate: ${coachData.completionRate}%
Bookings by day: ${JSON.stringify(coachData.bookingsByDay || {})}
Period: ${coachData.period}

Analyze this data and provide 3 prioritized recommendations.`;

    const aiRecommendations = await fetchAiRecommendations(
      OPENROUTER_API_KEY,
      systemPrompt,
      userPrompt,
    );

    const recommendations = normalizeRecommendations(aiRecommendations, coachData);

    return json({
      recommendations,
      source: aiRecommendations ? "ai" : "fallback",
    });
  } catch (e) {
    console.error("bob-insights error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
