import { memo, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Star, ArrowRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import type { DiscoverCoach } from "@/hooks/use-discover-coaches";

export interface FeaturedVideoItem {
  id: string;
  coachId: string;
  coachName: string;
  sport: string;
  image: string;
  videoSrc: string;
  title: string;
  views: number;
  likes: number;
}

const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(url);

const AutoPlayVideo = memo(({ src, poster }: { src: string; poster?: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className="absolute inset-0 w-full h-full object-cover"
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
});
AutoPlayVideo.displayName = "AutoPlayVideo";

interface DiscoverFeaturedProps {
  videos: FeaturedVideoItem[];
  topCoaches: DiscoverCoach[];
}

/**
 * Cinematic "Coach of the week" hero. Picks the strongest featured coach
 * (prefers one with an intro video), renders a 440px tall immersive card
 * with play button, gradient, badges, and CTAs.
 */
export function DiscoverFeatured({ videos, topCoaches }: DiscoverFeaturedProps) {
  const hero = useMemo(() => {
    const vid = videos.find((v) => isVideoUrl(v.videoSrc));
    if (vid) {
      const coach =
        topCoaches.find((c) => c.id === vid.coachId) ?? topCoaches[0] ?? null;
      if (coach) return { coach, video: vid } as const;
    }
    const coach = topCoaches[0];
    if (!coach) return null;
    return { coach, video: null } as const;
  }, [videos, topCoaches]);

  if (!hero) return null;
  const { coach, video } = hero;
  const hasVideo = !!video && isVideoUrl(video.videoSrc);

  return (
    <section className="px-4 md:px-8 lg:px-12 xl:px-16 pt-6 md:pt-7 pb-2">
      <Link
        to={`/coach/${coach.id}`}
        className="group relative block rounded-3xl overflow-hidden bg-foreground shadow-elevated"
      >
        <div className="relative aspect-[16/10] md:aspect-auto md:h-[440px]">
          {hasVideo ? (
            <AutoPlayVideo src={video!.videoSrc} poster={coach.image} />
          ) : coach.image ? (
            <SafeImage
              src={coach.image}
              alt={coach.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-foreground" />
          )}

          {/* Gradient overlay — navy at 88% on left fading right, plus bottom darken */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(26,26,46,0.88) 0%, rgba(26,26,46,0.55) 40%, rgba(26,26,46,0.15) 65%, rgba(26,26,46,0.55) 100%), linear-gradient(180deg, rgba(26,26,46,0.35) 0%, rgba(26,26,46,0) 30%, rgba(26,26,46,0.85) 100%)",
            }}
          />

          {/* Top-left badges */}
          <div className="absolute top-4 md:top-6 left-4 md:left-7 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-[10px] uppercase tracking-[0.16em] font-bold text-primary-foreground shadow-[0_4px_14px_rgba(255,107,44,0.4)]">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Featured
            </span>
            <span className="inline-flex items-center px-3 py-2 rounded-full bg-white/[0.14] border border-white/[0.22] backdrop-blur text-[10px] uppercase tracking-[0.16em] font-bold text-white">
              {coach.sport || "Coaching"}
              {coach.isPro && " · Pro"}
              {!coach.isPro && coach.isVerified && " · Elite"}
            </span>
          </div>

          {/* Coach avatar — top-right desktop only */}
          {coach.image && (
            <div className="hidden md:block absolute right-7 top-7">
              <div className="h-16 w-16 rounded-full overflow-hidden border-[3px] border-white shadow-elevated">
                <SafeImage
                  src={coach.image}
                  alt={coach.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* Play button — center */}
          {hasVideo && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-16 w-16 md:h-[88px] md:w-[88px] rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-[1.08]">
                <Play className="h-6 w-6 md:h-8 md:w-8 text-[#1A1A2E] fill-[#1A1A2E] ml-1" />
              </div>
            </div>
          )}

          {/* Copy */}
          <div className="absolute left-4 md:left-11 right-4 md:right-11 bottom-5 md:bottom-10 text-white">
            <div className="flex items-center gap-3 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-primary">
              <span>Coach of the week</span>
              <span className="hidden md:block h-px w-10 bg-primary/60" />
            </div>
            <h2 className="mt-3 md:mt-4 text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[0.95] max-w-[680px]">
              {coach.name}
            </h2>
            <div className="mt-3 md:mt-4 flex items-center gap-3 md:gap-6 text-[12px] md:text-sm text-white/85 font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-bold text-white">{coach.rating.toFixed(1)}</span>
                {coach.followers > 0 && (
                  <span className="opacity-60 ml-1">· {coach.followers.toLocaleString()} followers</span>
                )}
              </span>
              {coach.location && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{coach.location}</span>
                </>
              )}
              <span className="opacity-40">·</span>
              <span className="font-bold text-white">₪{coach.price} / session</span>
            </div>
            <div className="mt-4 md:mt-6 flex gap-2 md:gap-3 items-center">
              <span className="inline-flex items-center gap-2 h-11 md:h-[52px] px-5 md:px-7 rounded-xl bg-primary text-primary-foreground font-bold text-[13px] md:text-[14.5px] shadow-[0_10px_30px_-6px_rgba(255,107,44,0.5)] transition-transform duration-200 group-hover:-translate-y-0.5">
                Book a session
                <ArrowRight className="h-4 w-4" />
              </span>
              {hasVideo && (
                <span className="hidden md:inline-flex items-center gap-2 h-[52px] px-5 rounded-xl bg-white/10 border border-white/30 backdrop-blur text-white font-semibold text-sm">
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Watch intro
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
