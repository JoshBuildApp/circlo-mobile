import { lazy, Suspense, useCallback } from "react";
import { useHomeData } from "@/hooks/use-home-data";
import BrandLoader from "@/components/BrandLoader";
import PullToRefresh from "@/components/PullToRefresh";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

// Hero needs featured coaches for avatars + media
const HeroPanel = lazy(() => import("@/components/home/HeroPanel"));
const QuickActions = lazy(() => import("@/components/home/QuickActions"));
const StoriesStrip = lazy(() => import("@/components/home/StoriesStrip"));
const MomentumStrip = lazy(() => import("@/components/home/MomentumStrip"));
const CategoryChips = lazy(() => import("@/components/home/CategoryChips"));
const TopCoaches = lazy(() => import("@/components/home/TopCoaches"));
const HotRightNow = lazy(() => import("@/components/home/HotRightNow"));
const FeaturedCommunities = lazy(() => import("@/components/home/FeaturedCommunities"));
const FollowingFeed = lazy(() => import("@/components/home/FollowingFeed"));
const CtaSection = lazy(() => import("@/components/home/CtaSection"));

const SectionFallback = () => (
  <div className="px-4 space-y-3">
    <Skeleton className="h-5 w-32" />
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 w-40 rounded-2xl flex-shrink-0" />
      ))}
    </div>
  </div>
);

const HomePage = () => {
  const { data, loading, refetch } = useHomeData();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (loading) return <BrandLoader />;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <Search className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-1">Couldn't load content</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Something went wrong. Pull down to refresh.
        </p>
      </div>
    );
  }

  const heroCoaches = data.featuredCoaches.length > 0 ? data.featuredCoaches : data.topCoaches;

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-full">
      <div className="space-y-10 md:space-y-12 pb-28 pt-5 md:pt-8 overflow-x-hidden max-w-7xl md:mx-auto px-0">
        {/* 1. Hero */}
        <Suspense fallback={<SectionFallback />}>
          <HeroPanel coaches={heroCoaches} />
        </Suspense>

        {/* 2. Quick Actions */}
        <Suspense fallback={<SectionFallback />}>
          <QuickActions />
        </Suspense>

        {/* 3. Stories */}
        <Suspense fallback={<SectionFallback />}>
          <StoriesStrip />
        </Suspense>

        {/* 4. Momentum Strip — XP/Level/Streak */}
        <Suspense fallback={<SectionFallback />}>
          <MomentumStrip />
        </Suspense>

        {/* 5. Explore Sports */}
        <Suspense fallback={<SectionFallback />}>
          <CategoryChips />
        </Suspense>

        {/* 6. Coaches near you */}
        <Suspense fallback={<SectionFallback />}>
          <TopCoaches coaches={data.topCoaches || []} />
        </Suspense>

        {/* 7. Trending this week */}
        <Suspense fallback={<SectionFallback />}>
          <HotRightNow />
        </Suspense>

        {/* 8. Elite Communities */}
        <Suspense fallback={<SectionFallback />}>
          <FeaturedCommunities />
        </Suspense>

        {/* 9. Personalized Feed */}
        <Suspense fallback={<SectionFallback />}>
          <FollowingFeed />
        </Suspense>

        {/* 10. Footer CTA */}
        <Suspense fallback={<SectionFallback />}>
          <CtaSection />
        </Suspense>
      </div>
    </PullToRefresh>
  );
};

export default HomePage;
