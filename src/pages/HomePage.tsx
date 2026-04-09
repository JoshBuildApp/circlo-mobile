import { lazy, Suspense } from "react";
import { useHomeData } from "@/hooks/use-home-data";
import BrandLoader from "@/components/BrandLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

// Self-contained sections (fetch their own data)
const StoriesStrip = lazy(() => import("@/components/home/StoriesStrip"));
const QuickActions = lazy(() => import("@/components/home/QuickActions"));
const CategoryChips = lazy(() => import("@/components/home/CategoryChips"));
const HotRightNow = lazy(() => import("@/components/home/HotRightNow"));
const FeaturedCommunities = lazy(() => import("@/components/home/FeaturedCommunities"));
const ChallengesSection = lazy(() => import("@/components/home/ChallengesSection"));
const WeeklyHighlights = lazy(() => import("@/components/home/WeeklyHighlights"));
const CtaSection = lazy(() => import("@/components/home/CtaSection"));
const FeaturedWorkouts = lazy(() => import("@/components/home/FeaturedWorkouts"));
const CommunityFeed = lazy(() => import("@/components/home/CommunityFeed"));

// Sections that need data from useHomeData
const TopCoaches = lazy(() => import("@/components/home/TopCoaches"));
const FeaturedCarousel = lazy(() => import("@/components/home/FeaturedCarousel"));

const SectionFallback = () => (
  <div className="px-4 space-y-3">
    <Skeleton className="h-5 w-32" />
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-40 rounded-2xl flex-shrink-0" />)}
    </div>
  </div>
);

const HomePage = () => {
  const { data, loading } = useHomeData();

  if (loading) return <BrandLoader />;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <Search className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-1">Couldn't load content</h2>
        <p className="text-sm text-muted-foreground mb-4">Something went wrong. Pull down to refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 pt-4 overflow-x-hidden">
      {/* Stories */}
      <Suspense fallback={<SectionFallback />}>
        <StoriesStrip />
      </Suspense>

      {/* Quick Actions */}
      <Suspense fallback={<SectionFallback />}>
        <QuickActions />
      </Suspense>

      {/* Category Chips */}
      <Suspense fallback={<SectionFallback />}>
        <CategoryChips />
      </Suspense>

      {/* Featured Carousel */}
      <Suspense fallback={<SectionFallback />}>
        <FeaturedCarousel coaches={data?.featuredCoaches || []} />
      </Suspense>

      {/* Top Coaches */}
      <Suspense fallback={<SectionFallback />}>
        <TopCoaches coaches={data?.topCoaches || []} />
      </Suspense>

      {/* Hot Right Now */}
      <Suspense fallback={<SectionFallback />}>
        <HotRightNow />
      </Suspense>

      {/* Featured Communities */}
      <Suspense fallback={<SectionFallback />}>
        <FeaturedCommunities />
      </Suspense>

      {/* Challenges */}
      <Suspense fallback={<SectionFallback />}>
        <ChallengesSection />
      </Suspense>

      {/* Featured Workouts — horizontal scroll */}
      <Suspense fallback={<SectionFallback />}>
        <FeaturedWorkouts />
      </Suspense>

      {/* Community Feed — social post cards */}
      <Suspense fallback={<SectionFallback />}>
        <CommunityFeed />
      </Suspense>

      {/* Weekly Highlights */}
      <Suspense fallback={<SectionFallback />}>
        <WeeklyHighlights />
      </Suspense>

      {/* CTA */}
      <Suspense fallback={<SectionFallback />}>
        <CtaSection />
      </Suspense>
    </div>
  );
};

export default HomePage;
