import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDataMode } from "@/contexts/DataModeContext";
import { geocodeLocation, haversineKm, type LatLng } from "@/lib/geocode";

/** Shape used by the Discover UI. Flat, frontend-friendly. */
export interface DiscoverCoach {
  id: string;
  name: string;
  sport: string;
  image: string;
  tagline: string;
  rating: number;
  price: number;
  isVerified: boolean;
  isPro: boolean;
  isBoosted: boolean;
  followers: number;
  location: string;
  coords: LatLng | null;
}

export type DiscoverSort =
  | "relevance"
  | "nearest"
  | "top_rated"
  | "price_asc"
  | "price_desc"
  | "newest";

export interface DiscoverFilters {
  sport: string | null;
  priceMin: number;
  priceMax: number;
  minRating: number;
  location: string;
  availability: "any" | "today" | "week";
  maxDistanceKm: number | null;
  searchQuery: string;
  sort: DiscoverSort;
}

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilters = {
  sport: null,
  priceMin: 0,
  priceMax: 500,
  minRating: 0,
  location: "",
  availability: "any",
  maxDistanceKm: null,
  searchQuery: "",
  sort: "relevance",
};

interface UseDiscoverCoachesResult {
  coaches: DiscoverCoach[];
  totalMatches: number;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  userCoords: LatLng | null;
  requestLocation: () => void;
  locationDenied: boolean;
}

interface DbCoachRow {
  id: string;
  coach_name: string;
  sport: string | null;
  image_url: string | null;
  tagline: string | null;
  rating: number | null;
  price: number | null;
  is_verified: boolean | null;
  is_pro: boolean | null;
  is_boosted: boolean | null;
  followers: number | null;
  location: string | null;
}

/**
 * Single source of truth for Discover coach data.
 *
 * Fetches all coaches once, then does filtering/sorting/ranking in-memory.
 * This is intentionally client-side for now — see the discover_coaches RPC
 * migration for the server-side version that should replace this once lat/lng
 * columns land on coach_profiles.
 */
export function useDiscoverCoaches(filters: DiscoverFilters): UseDiscoverCoachesResult {
  const { isRealMode } = useDataMode();
  const [rows, setRows] = useState<DbCoachRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Availability fetch is keyed off filters.availability only
  const [availableIds, setAvailableIds] = useState<Set<string> | null>(null);

  // Geolocation for "near me"
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
      () => setLocationDenied(true),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    );
  }, []);

  // Track the current search query to decide fetch strategy
  const searchQuery = filters.searchQuery.trim();

  const fetchCoaches = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (searchQuery) {
      // Use full-text search RPC for ranked results (tsvector + trigram)
      const { data, error: rpcError } = await (supabase as any)
        .rpc("search_coaches", { search_term: searchQuery });

      if (rpcError) {
        setError(rpcError as unknown as Error);
        setRows([]);
      } else {
        const results = ((data || []) as (DbCoachRow & { is_fake?: boolean })[])
          .filter((c) => c.coach_name?.trim())
          .filter((c) => !isRealMode || !c.is_fake);
        setRows(results);
      }
    } else {
      // No search query — fetch all coaches
      let query = supabase
        .from("coach_profiles")
        .select(
          "id, coach_name, sport, image_url, tagline, rating, price, is_verified, is_pro, is_boosted, followers, location",
        )
        .order("followers", { ascending: false });
      if (isRealMode) query = query.eq("is_fake", false);
      const { data, error: fetchError } = await query;
      if (fetchError) {
        setError(fetchError as unknown as Error);
        setRows([]);
      } else {
        setRows(((data as DbCoachRow[]) || []).filter((c) => c.coach_name?.trim()));
      }
    }

    setLoading(false);
  }, [isRealMode, searchQuery]);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (filters.availability === "any") {
        setAvailableIds(null);
        return;
      }
      const todayDow = new Date().getDay();
      let q = supabase.from("availability").select("coach_id").eq("is_active", true);
      if (filters.availability === "today") q = q.eq("day_of_week", todayDow);
      const { data, error: availErr } = await q;
      if (cancelled) return;
      if (availErr) {
        setAvailableIds(new Set());
        return;
      }
      setAvailableIds(
        new Set(((data as { coach_id: string }[]) || []).map((r) => r.coach_id)),
      );
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [filters.availability]);

  // Enrich rows with coords (memoized keyed off rows identity)
  const enriched = useMemo<DiscoverCoach[]>(
    () =>
      rows.map((c) => ({
        id: c.id,
        name: c.coach_name,
        sport: c.sport || "",
        image: c.image_url || "",
        tagline: c.tagline || "",
        rating: c.rating ?? 5,
        price: c.price ?? 50,
        isVerified: !!c.is_verified,
        isPro: !!c.is_pro,
        isBoosted: !!c.is_boosted,
        followers: c.followers ?? 0,
        location: c.location || "",
        coords: geocodeLocation(c.location),
      })),
    [rows],
  );

  const filtered = useMemo(() => {
    let out = enriched;

    if (filters.sport) {
      const s = filters.sport.toLowerCase();
      out = out.filter((c) => c.sport.toLowerCase() === s);
    }
    // Search query filtering is handled server-side via search_coaches RPC
    // (tsvector + trigram ranked results) — no client-side filter needed.
    if (filters.minRating > 0) out = out.filter((c) => c.rating >= filters.minRating);
    if (filters.priceMax < 500) out = out.filter((c) => c.price <= filters.priceMax);
    if (filters.priceMin > 0) out = out.filter((c) => c.price >= filters.priceMin);
    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      out = out.filter((c) => c.location.toLowerCase().includes(loc));
    }
    if (availableIds) out = out.filter((c) => availableIds.has(c.id));
    if (filters.maxDistanceKm != null && userCoords) {
      out = out.filter((c) => c.coords && haversineKm(userCoords, c.coords) <= filters.maxDistanceKm!);
    }

    const sorted = [...out];
    // When search is active and sort is relevance, preserve server-side ranking
    const isServerRanked = !!filters.searchQuery.trim() && filters.sort === "relevance";
    if (isServerRanked) return sorted;

    switch (filters.sort) {
      case "top_rated":
        sorted.sort((a, b) => b.rating - a.rating || b.followers - a.followers);
        break;
      case "price_asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "nearest":
        if (userCoords) {
          sorted.sort((a, b) => {
            const da = a.coords ? haversineKm(userCoords, a.coords) : Infinity;
            const db = b.coords ? haversineKm(userCoords, b.coords) : Infinity;
            return da - db;
          });
        }
        break;
      case "newest":
        // no created_at on the row shape; fall through to relevance
      case "relevance":
      default: {
        sorted.sort((a, b) => {
          const sa = (a.isBoosted ? 4 : 0) + (a.isPro ? 2 : 0) + (a.isVerified ? 1 : 0);
          const sb = (b.isBoosted ? 4 : 0) + (b.isPro ? 2 : 0) + (b.isVerified ? 1 : 0);
          if (sb !== sa) return sb - sa;
          return b.followers - a.followers;
        });
        break;
      }
    }
    return sorted;
  }, [enriched, filters, availableIds, userCoords]);

  return {
    coaches: filtered,
    totalMatches: filtered.length,
    loading,
    error,
    refresh: fetchCoaches,
    userCoords,
    requestLocation,
    locationDenied,
  };
}
