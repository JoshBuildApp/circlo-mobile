import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PushCampaign {
  id: string;
  name: string;
  title: string;
  body: string;
  url: string;
  segment_sports: string[];
  segment_roles: string[];
  scheduled_at: string | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  sent_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateCampaignInput = Pick<
  PushCampaign,
  "name" | "title" | "body" | "url" | "segment_sports" | "segment_roles" | "scheduled_at"
>;

export function usePushCampaigns() {
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("push_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCampaigns(data as PushCampaign[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createCampaign = async (input: CreateCampaignInput): Promise<PushCampaign | null> => {
    const status = input.scheduled_at ? "scheduled" : "draft";
    const { data, error } = await supabase
      .from("push_campaigns")
      .insert({ ...input, status })
      .select()
      .single();
    if (error) { console.error("[usePushCampaigns] create error:", error); return null; }
    const created = data as PushCampaign;
    setCampaigns((prev) => [created, ...prev]);
    return created;
  };

  const updateCampaign = async (
    id: string,
    updates: Partial<CreateCampaignInput & { status: PushCampaign["status"] }>
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("push_campaigns")
      .update(updates)
      .eq("id", id);
    if (error) { console.error("[usePushCampaigns] update error:", error); return false; }
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    return true;
  };

  const deleteCampaign = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("push_campaigns").delete().eq("id", id);
    if (error) { console.error("[usePushCampaigns] delete error:", error); return false; }
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  const sendCampaign = async (campaign: PushCampaign): Promise<boolean> => {
    // Mark as sending
    await updateCampaign(campaign.id, { status: "sending" });

    // Build the audience query
    const { data: tokens, error } = await supabase
      .from("push_notification_tokens")
      .select("user_id, token")
      .eq("is_active", true);

    if (error || !tokens) {
      await updateCampaign(campaign.id, { status: "failed" });
      return false;
    }

    // Filter by sport interest
    let eligibleUserIds: string[] = tokens.map((t) => t.user_id);

    if (campaign.segment_sports.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, interests")
        .in("user_id", eligibleUserIds);
      if (profiles) {
        const matchSet = new Set(
          profiles
            .filter((p) => p.interests?.some((i: string) => campaign.segment_sports.includes(i)))
            .map((p) => p.user_id)
        );
        eligibleUserIds = eligibleUserIds.filter((id) => matchSet.has(id));
      }
    }

    // Filter by role
    if (campaign.segment_roles.length > 0) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", eligibleUserIds);
      if (roles) {
        const matchSet = new Set(
          roles
            .filter((r) => campaign.segment_roles.includes(r.role))
            .map((r) => r.user_id)
        );
        eligibleUserIds = eligibleUserIds.filter((id) => matchSet.has(id));
      }
    }

    const eligibleSet = new Set(eligibleUserIds);
    const targetTokens = tokens.filter((t) => eligibleSet.has(t.user_id));

    if (targetTokens.length === 0) {
      await updateCampaign(campaign.id, { status: "sent" });
      return true;
    }

    // Queue each notification
    const payload = JSON.stringify({ title: campaign.title, body: campaign.body, url: campaign.url });
    const rows = targetTokens.map((t) => ({
      user_id: t.user_id,
      subscription: t.token,
      payload,
      status: "pending",
    }));

    const { error: queueError } = await (supabase.from as any)("notification_queue").insert(rows);
    if (queueError) {
      await updateCampaign(campaign.id, { status: "failed" });
      return false;
    }

    await updateCampaign(campaign.id, { status: "sent" });
    return true;
  };

  const countAudience = async (
    segmentSports: string[],
    segmentRoles: string[]
  ): Promise<number> => {
    const { data, error } = await supabase.rpc("count_campaign_audience", {
      p_segment_sports: segmentSports,
      p_segment_roles: segmentRoles,
    });
    if (error) return 0;
    return data as number;
  };

  return {
    campaigns,
    loading,
    refresh: fetch,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    countAudience,
  };
}
