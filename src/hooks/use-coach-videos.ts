import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDataMode } from "@/contexts/DataModeContext";

export interface CoachVideo {
  id: string;
  coach_id: string;
  user_id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: string;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
}

/** Fetch all videos, optionally filtered by coach_id */
export const useCoachVideos = (coachId?: string) => {
  const [videos, setVideos] = useState<CoachVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const { isRealMode } = useDataMode();

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("coach_videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (coachId) {
      query = query.eq("coach_id", coachId);
    }

    if (isRealMode) {
      query = query.eq("is_fake", false);
    }

    const { data } = await query;
    if (data) setVideos(data as CoachVideo[]);
    setLoading(false);
  }, [coachId, isRealMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { videos, loading, refresh };
};

/** Fetch videos for multiple coach IDs */
export const useCoachVideosByIds = (coachIds: string[]) => {
  const [videos, setVideos] = useState<CoachVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coachIds.length === 0) {
      setVideos([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("coach_videos")
        .select("*")
        .in("coach_id", coachIds)
        .order("created_at", { ascending: false });
      if (data) setVideos(data as CoachVideo[]);
      setLoading(false);
    };

    fetch();
  }, [coachIds.join(",")]);

  return { videos, loading };
};

/** Upload a video to storage and insert a record */
export const uploadCoachVideo = async ({
  file,
  title,
  description,
  coachId,
  userId,
}: {
  file: File;
  title: string;
  description: string;
  coachId: string;
  userId: string;
}) => {
  const ext = file.name.split(".").pop() || "mp4";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("coach-videos")
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("coach-videos")
    .getPublicUrl(path);

  const media_url = urlData.publicUrl;

  const { error: insertError } = await supabase.from("coach_videos").insert({
    coach_id: coachId,
    user_id: userId,
    title,
    description,
    media_url,
  });

  if (insertError) throw insertError;

  return media_url;
};
