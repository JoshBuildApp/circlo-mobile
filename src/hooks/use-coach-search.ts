import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CoachSearchFilters {
  query?: string;
  sports?: string[];
  minPrice?: number;
  maxPrice?: number;
}

export interface Coach {
  id: string;
  coach_name: string;
  bio: string | null;
  image_url: string | null;
  price: number | null;
  specialties: string[] | null;
  rating: number | null;
  sport: string;
  location: string | null;
}

export function useCoachSearch() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const searchCoaches = useCallback(async (filters: CoachSearchFilters = {}) => {
    try {
      setIsLoading(true);
      setError("");

      const hasQuery = filters.query && filters.query.trim();
      let results: Coach[] = [];

      if (hasQuery) {
        // Use pg_trgm full-text search via RPC for ranked results
        const { data, error: rpcError } = await supabase
          .rpc("search_coaches", { search_term: filters.query!.trim() });

        if (rpcError) throw new Error(rpcError.message);

        results = ((data || []) as Array<Coach & { is_fake: boolean }>)
          .filter((c) => !c.is_fake);
      } else {
        // No search term — fall back to standard query
        const { data, error: fetchError } = await supabase
          .from("coach_profiles")
          .select("id, coach_name, bio, image_url, price, specialties, rating, sport, location")
          .eq("is_fake", false)
          .order("created_at", { ascending: false });

        if (fetchError) throw new Error(fetchError.message);
        results = (data || []) as Coach[];
      }

      // Apply price filters client-side
      if (filters.minPrice !== undefined) {
        results = results.filter((c) => c.price !== null && c.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        results = results.filter((c) => c.price !== null && c.price <= filters.maxPrice!);
      }

      // Apply sport filters client-side
      if (filters.sports && filters.sports.length > 0) {
        results = results.filter((c) => filters.sports!.includes(c.sport));
      }

      setCoaches(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search coaches");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { coaches, isLoading, error, searchCoaches };
}
