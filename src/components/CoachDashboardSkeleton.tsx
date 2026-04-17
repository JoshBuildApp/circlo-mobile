import { Skeleton } from "@/components/ui/skeleton";

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-border bg-card/50 backdrop-blur p-4 ${className}`}>
    {children}
  </div>
);

/** Overview tab: stat cards, chart, schedule, quick stats */
export const OverviewSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    {/* Earnings stat cards */}
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <GlassCard key={i}>
          <Skeleton className="h-3 w-16 mb-3" />
          <Skeleton className="h-6 w-20 mb-1" />
          <Skeleton className="h-2.5 w-12" />
        </GlassCard>
      ))}
    </div>

    {/* Dual stat row */}
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <GlassCard key={i}>
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-7 w-24" />
        </GlassCard>
      ))}
    </div>

    {/* Revenue chart */}
    <GlassCard>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[180px] w-full rounded-xl" />
    </GlassCard>

    {/* Today's schedule */}
    <GlassCard>
      <Skeleton className="h-4 w-36 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </GlassCard>

    {/* Quick stats grid */}
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard key={i} className="text-center">
          <Skeleton className="h-5 w-10 mx-auto mb-2" />
          <Skeleton className="h-2.5 w-12 mx-auto" />
        </GlassCard>
      ))}
    </div>
  </div>
);

/** Bookings tab: rate cards, calendar, upcoming list, chart */
export const BookingsSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    {/* Rate cards */}
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <GlassCard key={i} className="text-center">
          <Skeleton className="h-7 w-12 mx-auto mb-2" />
          <Skeleton className="h-2.5 w-16 mx-auto" />
        </GlassCard>
      ))}
    </div>

    {/* Calendar placeholder */}
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-3 w-full" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    </GlassCard>

    {/* Upcoming sessions */}
    <GlassCard>
      <Skeleton className="h-4 w-36 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </GlassCard>

    {/* Bookings by day chart */}
    <GlassCard>
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="h-[160px] w-full rounded-xl" />
    </GlassCard>
  </div>
);

/** Clients tab: stats, retention chart, client list */
export const ClientsSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    {/* Stats grid */}
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <GlassCard key={i} className="text-center">
          <Skeleton className="h-6 w-10 mx-auto mb-2" />
          <Skeleton className="h-2.5 w-16 mx-auto" />
        </GlassCard>
      ))}
    </div>

    {/* Retention chart */}
    <GlassCard>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[180px] w-full rounded-xl" />
    </GlassCard>

    {/* VIP clients scroll */}
    <GlassCard>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        ))}
      </div>
    </GlassCard>

    {/* Client list */}
    <GlassCard>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
        ))}
      </div>
    </GlassCard>
  </div>
);

/** Content tab: stats, performance list, charts, video grid */
export const ContentSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    {/* Stats grid */}
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard key={i} className="text-center p-3">
          <Skeleton className="h-5 w-10 mx-auto mb-1.5" />
          <Skeleton className="h-2.5 w-12 mx-auto" />
        </GlassCard>
      ))}
    </div>

    {/* Best performing */}
    <GlassCard>
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-14 w-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>

    {/* Performance chart */}
    <GlassCard>
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="h-[160px] w-full rounded-xl" />
    </GlassCard>

    {/* Follower growth chart */}
    <GlassCard>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[140px] w-full rounded-xl" />
    </GlassCard>

    {/* Video grid */}
    <GlassCard>
      <Skeleton className="h-4 w-28 mb-4" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        ))}
      </div>
    </GlassCard>
  </div>
);

/** Analytics tab: KPIs, charts, heatmap */
export const AnalyticsSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    {/* Period toggle */}
    <div className="flex gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-16 rounded-xl" />
      ))}
    </div>

    {/* KPI cards */}
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <GlassCard key={i}>
          <Skeleton className="h-3 w-16 mb-3" />
          <Skeleton className="h-6 w-20 mb-1" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </GlassCard>
      ))}
    </div>

    {/* Revenue trend chart */}
    <GlassCard>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[180px] w-full rounded-xl" />
    </GlassCard>

    {/* Bookings trend chart */}
    <GlassCard>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[160px] w-full rounded-xl" />
    </GlassCard>

    {/* Retention metric */}
    <GlassCard>
      <Skeleton className="h-4 w-36 mb-3" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </GlassCard>

    {/* Top performing content */}
    <GlassCard>
      <Skeleton className="h-4 w-44 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </GlassCard>

    {/* Heatmap */}
    <GlassCard>
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 49 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full rounded" />
        ))}
      </div>
    </GlassCard>
  </div>
);
