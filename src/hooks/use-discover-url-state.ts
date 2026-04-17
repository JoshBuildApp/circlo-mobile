import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_DISCOVER_FILTERS,
  type DiscoverFilters,
  type DiscoverSort,
} from "./use-discover-coaches";

/**
 * URL-persisted Discover state. Filters and search live in the query string so
 * users can share, bookmark, and hit the back button without losing context.
 *
 * Query params used: q, sport, min, max, rating, loc, avail, near, sort
 */
const SORTS: DiscoverSort[] = [
  "relevance",
  "nearest",
  "top_rated",
  "price_asc",
  "price_desc",
  "newest",
];

function parseFilters(params: URLSearchParams): DiscoverFilters {
  const sortParam = params.get("sort") as DiscoverSort | null;
  const availParam = params.get("avail");
  const priceMin = Number(params.get("min") ?? DEFAULT_DISCOVER_FILTERS.priceMin);
  const priceMax = Number(params.get("max") ?? DEFAULT_DISCOVER_FILTERS.priceMax);
  const minRating = Number(params.get("rating") ?? DEFAULT_DISCOVER_FILTERS.minRating);
  const nearParam = params.get("near");
  return {
    sport: params.get("sport") || null,
    priceMin: Number.isFinite(priceMin) ? priceMin : 0,
    priceMax: Number.isFinite(priceMax) ? priceMax : 500,
    minRating: Number.isFinite(minRating) ? minRating : 0,
    location: params.get("loc") || "",
    availability:
      availParam === "today" || availParam === "week" ? availParam : "any",
    maxDistanceKm: nearParam ? Number(nearParam) : null,
    searchQuery: params.get("q") || "",
    sort: sortParam && SORTS.includes(sortParam) ? sortParam : "relevance",
  };
}

function filtersToParams(filters: DiscoverFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.searchQuery.trim()) params.set("q", filters.searchQuery.trim());
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.priceMin > 0) params.set("min", String(filters.priceMin));
  if (filters.priceMax < 500) params.set("max", String(filters.priceMax));
  if (filters.minRating > 0) params.set("rating", String(filters.minRating));
  if (filters.location.trim()) params.set("loc", filters.location.trim());
  if (filters.availability !== "any") params.set("avail", filters.availability);
  if (filters.maxDistanceKm != null) params.set("near", String(filters.maxDistanceKm));
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  return params;
}

export function useDiscoverUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive filters from URL. Memoized so changes only propagate when params actually differ.
  const urlFilters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [filters, setFiltersState] = useState<DiscoverFilters>(urlFilters);

  // Keep local state in sync if URL changes externally (back button, link click).
  const lastUrlRef = useRef(searchParams.toString());
  useEffect(() => {
    const key = searchParams.toString();
    if (key !== lastUrlRef.current) {
      lastUrlRef.current = key;
      setFiltersState(parseFilters(searchParams));
    }
  }, [searchParams]);

  const setFilters = useCallback(
    (next: DiscoverFilters | ((prev: DiscoverFilters) => DiscoverFilters)) => {
      setFiltersState((prev) => {
        const resolved = typeof next === "function" ? (next as (p: DiscoverFilters) => DiscoverFilters)(prev) : next;
        const params = filtersToParams(resolved);
        const key = params.toString();
        if (key !== lastUrlRef.current) {
          lastUrlRef.current = key;
          setSearchParams(params, { replace: true });
        }
        return resolved;
      });
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_DISCOVER_FILTERS);
  }, [setFilters]);

  return { filters, setFilters, resetFilters };
}
