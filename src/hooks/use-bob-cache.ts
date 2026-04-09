import { supabase } from "@/integrations/supabase/client";
import type { CoachBusinessData } from "@/components/dashboard/BobAITab";
import { findPreset, matchPresetByText } from "@/lib/bob-presets";

export interface CachedAnswer {
  answer: string;
  source: "preset" | "cache" | "fresh";
}

export function useBobCache() {
  /** Get an answer — checks presets, then cache, then calls API */
  const getAnswer = async (
    coachId: string,
    questionText: string,
    coachData: CoachBusinessData,
    coachName: string,
    sport: string,
    healthScore: number
  ): Promise<CachedAnswer> => {
    // 1. Check presets first
    const preset = matchPresetByText(questionText);
    if (preset) {
      return { answer: preset.getAnswer(coachData), source: "preset" };
    }

    // 2. Check Supabase cache
    const questionKey = questionText.toLowerCase().trim();
    const { data: cached } = await (supabase
      .from("bob_cache" as any)
      .select("answer, expires_at")
      .eq("coach_id", coachId)
      .eq("question_key", questionKey)
      .maybeSingle() as any);

    if (cached && new Date(cached.expires_at) > new Date()) {
      return { answer: cached.answer as string, source: "cache" };
    }

    // 3. Cache miss — call API
    const context = `You are Bob, an AI business advisor for coaches on Circlo. Coach: ${coachName} (${sport}).
Stats: ${coachData.totalSessions} total sessions, $${coachData.totalRevenue} revenue, ${coachData.followerCount} followers, ${coachData.uniqueClients} unique clients, ${coachData.videoCount} videos, ${coachData.totalViews} views, ${coachData.rebookingRate}% rebooking rate, ${coachData.cancellationRate}% cancellation rate.
Health score: ${healthScore}/100. Give specific, actionable advice. Keep responses under 3 sentences.`;

    const { data, error } = await supabase.functions.invoke("bob-insights", {
      body: {
        coachData,
        chatMessage: questionText,
        systemContext: context,
      },
    });

    if (error || data?.error) {
      throw new Error("Couldn't get a response from Bob right now.");
    }

    const answer =
      data.chatResponse ||
      data.recommendations?.[0]?.description ||
      "I'd be happy to help! Could you be more specific?";

    // 4. Save to cache (fire-and-forget)
    await saveAnswer(coachId, questionKey, answer);

    return { answer, source: "fresh" };
  };

  /** Save an answer to the Supabase cache */
  const saveAnswer = async (coachId: string, questionKey: string, answer: string) => {
    await (supabase as any).from("bob_cache").upsert(
      {
        coach_id: coachId,
        question_key: questionKey.toLowerCase().trim(),
        answer,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "coach_id,question_key" }
    );
  };

  /** Get a preset answer instantly (no API or DB call) */
  const getPresetAnswer = (key: string, coachData: CoachBusinessData): string | null => {
    const preset = findPreset(key);
    return preset ? preset.getAnswer(coachData) : null;
  };

  return { getAnswer, saveAnswer, getPresetAnswer };
}
