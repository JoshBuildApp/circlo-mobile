import { Suspense, lazy, useMemo, useRef, useState, useEffect } from "react";
import { useCoachVideos } from "@/hooks/use-coach-videos";
import { useDiscoverCoaches } from "@/hooks/use-discover-coaches";
import type { DiscoverCoach } from "@/hooks/use-discover-coaches";
import { useDiscoverUrlState } from "@/hooks/use-discover-url-state";
import { useCoachAvailabilityPreview } from "@/hooks/use-coach-availability-preview";
import { useBecauseYouRail } from "@/hooks/use-because-you-rail";
import { DiscoverHeader } from "@/components/discover/DiscoverHeader";
import { DiscoverHeroStrip } from "@/components/discover/DiscoverHeroStrip";
import { DiscoverFilterSheet } from "@/components/discover/DiscoverFilterSheet";
import {
  DiscoverFeatured,
  type FeaturedVideoItem,
} from "@/components/discover/DiscoverFeatured";
import { DiscoverBecauseYouRail } from "@/components/discover/DiscoverBecauseYouRail";
import { DiscoverGrid } from "@/components/discover/DiscoverGrid";
import {
  DiscoverEmpty,
  DiscoverError,
  DiscoverLoading,
} from "@/components/discover/DiscoverStates";
import { BookingModal } from "@/components/BookingModal";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestGate } from "@/contexts/GuestGateContext";

const CoachMapView = lazy(() => import("@/components/CoachMapView"));

const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url);
const GRID_PAGE_SIZE = 24;

const Discover = () => {
  const { filters, setFilters, resetFilters } = useDiscoverUrlState();
  const {
    coaches,
    totalMatches,
    loading,
    error,
    refresh,
    userCoords,
    requestLocation,
    locationDenied,
  } = useDiscoverCoaches(filters);

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [gridVisible, setGridVisible] = useState(GRID_PAGE_SIZE);
  const [bookingCoach, setBookingCoach] = useState<DiscoverCoach | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const { videos: uploadedVideos } = useCoachVideos();

  const featuredVideos = useMemo<FeaturedVideoItem[]>(() => {
    const byId = new Map(coaches.map((c) => [c.id, c]));
    return uploadedVideos
      .flatMap((v) => {
        const coach = byId.get(v.coach_id);
        if (!coach) return [];
        const isVid = v.media_type === "video" || isVideoUrl(v.media_url);
        return [
          {
            id: v.id,
            coachId: v.coach_id,
            coachName: coach.name,
            sport: coach.sport || "Training",
            image: v.thumbnail_url || (isVid ? coach.image : v.media_url) || coach.image || "",
            videoSrc: isVid ? v.media_url : "",
            views: v.views || 0,
            title: v.title,
            likes: 0,
          },
        ];
      })
      .slice(0, 6);
  }, [uploadedVideos, coaches]);

  const videoCoachIds = useMemo(() => {
    const s = new Set<string>();
    for (const v of uploadedVideos) {
      if (v.media_type === "video" || isVideoUrl(v.media_url)) s.add(v.coach_id);
    }
    return s;
  }, [uploadedVideos]);

  const visibleCoaches = useMemo(() => coaches.slice(0, gridVisible), [coaches, gridVisible]);
  const visibleIds = useMemo(() => visibleCoaches.map((c) => c.id), [visibleCoaches]);
  const { availability } = useCoachAvailabilityPreview(visibleIds);

  const { coaches: rec, reason } = useBecauseYouRail(coaches);

  // Reset pagination when filters change
  useEffect(() => {
    setGridVisible(GRID_PAGE_SIZE);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [filters]);

  // Infinite-scroll via IntersectionObserver. This works regardless of
  // which element is the scroll container — the observer watches the
  // viewport intersection, so it's immune to the AppShell layout changing
  // which div actually scrolls.
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;
    if (gridVisible >= coaches.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setGridVisible((c) => Math.min(c + GRID_PAGE_SIZE, coaches.length));
        }
      },
      { rootMargin: "400px 0px", threshold: 0 },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [gridVisible, coaches.length]);

  const isFiltered =
    filters.sport != null ||
    filters.priceMin > 0 ||
    filters.priceMax < 500 ||
    filters.minRating > 0 ||
    filters.location.trim() !== "" ||
    filters.availability !== "any" ||
    filters.maxDistanceKm != null ||
    filters.searchQuery.trim() !== "";

  const { user } = useAuth();
  const { requireAuth } = useGuestGate();
  const handleBook = (coach: DiscoverCoach) => {
    // Guests see the sign-up/log-in sheet; auth'd users open the booking modal.
    requireAuth(!!user, () => setBookingCoach(coach), `/book/${coach.id}`);
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden w-full">
      {error && !loading && <DiscoverError error={error} onRetry={refresh} />}

      {!error && loading && <DiscoverLoading />}

      {!error && !loading && viewMode === "map" && (
        <>
          <DiscoverHeader
            filters={filters}
            onChange={setFilters}
            onOpenFilters={() => setShowFilters(true)}
            onToggleMap={() => setViewMode((v) => (v === "list" ? "map" : "list"))}
            viewMode={viewMode}
            onClearAll={resetFilters}
          />
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="h-6 w-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              </div>
            }
          >
            <CoachMapView
              coaches={coaches.map((c) => ({
                id: c.id,
                name: c.name,
                sport: c.sport,
                image: c.image,
                rating: c.rating,
                price: c.price,
                isVerified: c.isVerified,
                isPro: c.isPro,
                isBoosted: c.isBoosted,
                followers: c.followers,
                location: c.location,
              }))}
            />
          </Suspense>
        </>
      )}

      {!error && !loading && viewMode === "list" && (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto hide-scrollbar pb-24"
        >
          {!isFiltered && (
            <div className="px-6 pt-8 pb-5">
              <h2 className="text-5xl font-black tracking-tighter leading-[0.9] mb-3">
                <span className="text-foreground">DISCOVER</span>
                <br />
                <span
                  className="italic text-transparent bg-clip-text bg-gradient-kinetic"
                  style={{ WebkitTextStroke: "0.5px transparent" }}
                >
                  PERFORMANCE
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {totalMatches} coaches ready to train with you.
              </p>
            </div>
          )}

          {!isFiltered && (
            <DiscoverHeroStrip coaches={coaches} totalMatches={totalMatches} />
          )}

          <DiscoverHeader
            filters={filters}
            onChange={setFilters}
            onOpenFilters={() => setShowFilters(true)}
            onToggleMap={() => setViewMode((v) => (v === "list" ? "map" : "list"))}
            viewMode={viewMode}
            onClearAll={resetFilters}
          />

          {!isFiltered && (
            <>
              <DiscoverFeatured videos={featuredVideos} topCoaches={coaches} />
              <DiscoverBecauseYouRail
                coaches={rec}
                reason={reason}
                videoCoachIds={videoCoachIds}
              />
            </>
          )}

          {coaches.length === 0 ? (
            <DiscoverEmpty
              isFiltered={isFiltered}
              onClearFilters={resetFilters}
              onPickSport={(sport) => setFilters((prev) => ({ ...prev, sport }))}
            />
          ) : (
            <>
              {/* Kinetic section header — "TOP COACHES NEAR YOU" with orange accent */}
              {!isFiltered && (
                <div className="flex justify-between items-end px-6 pt-2 pb-4">
                  <h3 className="text-xl font-black uppercase tracking-tight text-foreground leading-none">
                    Top Coaches{" "}
                    <span className="text-[#ffb59a]">Near You</span>
                  </h3>
                  <button
                    onClick={() => {/* no-op — full list already shown */}}
                    className="text-[10px] font-black tracking-[0.2em] text-[#46f1c5] uppercase border-b border-[#46f1c5]/30 pb-0.5"
                  >
                    View All
                  </button>
                </div>
              )}

              <DiscoverGrid
                coaches={visibleCoaches}
                availability={availability}
                userCoords={userCoords}
                onBook={handleBook}
                totalMatches={totalMatches}
                videoCoachIds={videoCoachIds}
              />

              {/* Sentinel for IntersectionObserver-based infinite scroll */}
              <div ref={loadMoreSentinelRef} aria-hidden className="h-px w-full" />

              {gridVisible < coaches.length ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                  <p className="text-[13px] font-semibold text-muted-foreground tracking-tight">
                    More coaches coming soon…
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    You've reached the end of the list.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <DiscoverFilterSheet
        open={showFilters}
        filters={filters}
        userCoords={userCoords}
        locationDenied={locationDenied}
        onRequestLocation={requestLocation}
        onApply={(next) => {
          setFilters(next);
          setShowFilters(false);
        }}
        onClose={() => setShowFilters(false)}
      />

      {bookingCoach && (
        <BookingModal
          isOpen={!!bookingCoach}
          onClose={() => setBookingCoach(null)}
          coachId={bookingCoach.id}
          selectedDate={null}
          selectedTime={null}
          sessionType="individual"
          price={bookingCoach.price || 0}
        />
      )}
    </div>
  );
};

export default Discover;
