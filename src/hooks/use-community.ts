import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDataMode } from "@/contexts/DataModeContext";

export const useCommunityMembership = (coachId: string | undefined) => {
  const { user } = useAuth();
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !coachId) { setLoading(false); return; }
    supabase
      .from("community_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("coach_id", coachId)
      .maybeSingle()
      .then(({ data }) => {
        setIsMember(!!data);
        setLoading(false);
      });
  }, [user, coachId]);

  const toggleMembership = useCallback(async () => {
    if (!user || !coachId) return;
    if (isMember) {
      await supabase
        .from("community_members")
        .delete()
        .eq("user_id", user.id)
        .eq("coach_id", coachId);
      setIsMember(false);
    } else {
      await supabase
        .from("community_members")
        .insert({ user_id: user.id, coach_id: coachId });
      setIsMember(true);
    }
  }, [user, coachId, isMember]);

  return { isMember, toggleMembership, loading };
};

export const useCommunityMemberCount = (coachId: string | undefined) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!coachId) return;
    supabase
      .from("community_members")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", coachId)
      .then(({ count: c }) => setCount(c || 0));
  }, [coachId]);

  return count;
};

export interface CommunityInfo {
  coachId: string;
  coachName: string;
  sport: string;
  image: string | null;
  tagline: string | null;
  memberCount: number;
  isVerified: boolean;
}

export const useFeaturedCommunities = () => {
  const [communities, setCommunities] = useState<CommunityInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { isRealMode } = useDataMode();

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, tagline, is_verified, followers")
        .order("followers", { ascending: false })
        .limit(10);
      if (isRealMode) query = query.eq("is_fake", false);
      const { data: coaches } = await query;

      if (!coaches || coaches.length === 0) { setLoading(false); return; }

      // Get member counts
      const ids = coaches.map((c) => String(c.id));
      const { data: members } = await supabase
        .from("community_members")
        .select("coach_id");

      const countMap: Record<string, number> = {};
      (members || []).forEach((m) => {
        countMap[m.coach_id] = (countMap[m.coach_id] || 0) + 1;
      });

      setCommunities(
        coaches.map((c) => ({
          coachId: String(c.id),
          coachName: c.coach_name,
          sport: c.sport,
          image: c.image_url,
          tagline: c.tagline,
          memberCount: countMap[String(c.id)] || 0,
          isVerified: c.is_verified,
        }))
      );
      setLoading(false);
    };
    fetch();
  }, [isRealMode]);

  return { communities, loading };
};

// Alias for Community page
export const useCommunity = () => {
  return useFeaturedCommunities();
};
