import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CoachLocation {
  city: string | null;
  state: string | null;
  country: string | null;
  timezone: string | null;
}

export const useCoachLocation = (coachId: string | undefined) => {
  const [location, setLocation] = useState<CoachLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locationString = location
    ? [location.city, location.state, location.country].filter(Boolean).join(', ')
    : null;

  useEffect(() => {
    const fetchLocation = async () => {
      if (!coachId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: profile, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('city, state, country, timezone')
          .eq('id', coachId)
          .single();

        if (profileError) {
          throw profileError;
        }

        setLocation({
          city: profile?.city ?? null,
          state: profile?.state ?? null,
          country: profile?.country ?? null,
          timezone: profile?.timezone ?? null,
        });
      } catch (err) {
        console.error('Error fetching coach location:', err);
        setError('Failed to load location information');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [coachId]);

  return { location, locationString, loading, error };
};
