import { memo, useEffect, useMemo, useState } from "react";
import SectionHeader from "./SectionHeader";
import { CoachCard } from "@/components/CoachCard";
import { CoachPreviewHover } from "@/components/discover/CoachPreviewHover";
import {
  useCoachAvailabilityPreview,
  formatSlotDay,
  formatSlotTime,
} from "@/hooks/use-coach-availability-preview";
import type { DiscoverCoach } from "@/hooks/use-discover-coaches";
import { geocodeLocation, haversineKm, type LatLng } from "@/lib/geocode";
import { cn } from "@/lib/utils";
import type { HomeCoach } from "@/hooks/use-home-data";

interface TopCoachesProps {
  coaches: HomeCoach[];
}

type FilterKey = "all" | "verified" | "pro" | "nearby";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "verified", label: "Verified" },
  { key: "pro", label: "Pro" },
  { key: "nearby", label: "Nearby" },
];

const NEARBY_MAX_KM = 50;

function toDiscoverCoach(c: HomeCoach): DiscoverCoach {
  return {
    id: c.id,
    name: c.coach_name,
    sport: c.sport,
    image: c.image_url || "",
    tagline: c.tagline || c.bio || "",
    rating: c.rating ?? 0,
    price: c.price ?? 0,
    isVerified: !!c.is_verified,
    isPro: !!c.is_pro,
    isBoosted: !!c.is_boosted,
    followers: c.followers ?? 0,
    location: c.location || "",
    coords: geocodeLocation(c.location),
  };
}

const TopCoaches = memo(({ coaches }: TopCoachesProps) => {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);

  // Best-effort geolocation for the Nearby filter and hover preview distance.
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { maximumAge: 5 * 60 * 1000, timeout: 4000 },
    );
  }, []);

  const coachIds = useMemo(() => coaches.map((c) => c.id), [coaches]);
  const { availability } = useCoachAvailabilityPreview(coachIds);

  const filtered = useMemo(() => {
    return coaches.filter((c) => {
      if (filter === "verified") return !!c.is_verified;
      if (filter === "pro") return !!c.is_pro;
      if (filter === "nearby") {
        if (!userCoords) return true;
        const coords = geocodeLocation(c.location);
        if (!coords) return false;
        return haversineKm(userCoords, coords) <= NEARBY_MAX_KM;
      }
      return true;
    });
  }, [coaches, filter, userCoords]);

  if (coaches.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <SectionHeader title="Coaches near you" linkTo="/discover" linkLabel="Explore" />
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Find elite guidance tailored to your goals
      </p>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border",
              filter === f.key
                ? "bg-[#FF6B2B] text-white border-[#FF6B2B] shadow-md shadow-[#FF6B2B]/25"
                : "bg-card text-foreground/70 border-border hover:border-[#FF6B2B]/40 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No coaches match this filter yet.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory scrollbar-hide">
          {filtered.map((c, i) => {
            const discoverCoach = toDiscoverCoach(c);
            const slots = availability[c.id] || [];
            const firstSlot = slots[0];
            const nextSlotLabel = firstSlot
              ? `${formatSlotDay(firstSlot.day_of_week)} ${formatSlotTime(firstSlot.start_time)}`
              : null;

            return (
              <CoachPreviewHover
                key={c.id}
                coach={discoverCoach}
                availability={availability}
                userCoords={userCoords}
              >
                <div className="snap-start flex-shrink-0">
                  <CoachCard
                    id={c.id}
                    coach_name={c.coach_name}
                    sport={c.sport}
                    image_url={c.image_url}
                    rating={c.rating}
                    price={c.price}
                    is_verified={c.is_verified}
                    is_pro={c.is_pro}
                    location={c.location}
                    followers={c.followers}
                    tagline={c.tagline}
                    nextSlotLabel={nextSlotLabel}
                    index={i}
                  />
                </div>
              </CoachPreviewHover>
            );
          })}
        </div>
      )}
    </div>
  );
});

TopCoaches.displayName = "TopCoaches";

export default TopCoaches;
