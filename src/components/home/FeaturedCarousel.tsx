import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Play, Users, Flame, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/safe-image";
import { unsplashUrl } from "@/lib/image-utils";
import type { HomeCoach } from "@/hooks/use-home-data";

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  cta?: string;
  ctaLink: string;
  image: string;
  gradient: string;
  icon: React.ElementType;
  badge?: string;
}

interface FeaturedCarouselProps {
  coaches: HomeCoach[];
}

const buildSlides = (coaches: HomeCoach[]): CarouselSlide[] => {
  const topCoach = coaches.find((c) => c.is_top_creator) || coaches[0];
  const verified = coaches.filter((c) => c.is_verified);

  return [
    {
      id: "trending",
      title: "Trending Now",
      subtitle: "Most popular coaches this week",
      cta: "Explore",
      ctaLink: "/discover",
      image: topCoach?.image_url || "",
      gradient: "from-orange-600 via-rose-600 to-pink-600",
      icon: Flame,
      badge: "Hot",
    },
    {
      id: "top-coaches",
      title: "Top Coaches",
      subtitle: "Train with the best in their sport",
      cta: "View all",
      ctaLink: "/discover",
      image: verified[0]?.image_url || topCoach?.image_url || "",
      gradient: "from-blue-600 via-indigo-600 to-violet-600",
      icon: Trophy,
      badge: "Featured",
    },
    {
      id: "communities",
      title: "New Communities",
      subtitle: "Join exclusive coach groups",
      cta: "Join now",
      ctaLink: "/community",
      image: coaches[1]?.image_url || "",
      gradient: "from-emerald-600 via-teal-600 to-cyan-600",
      icon: Users,
    },
    {
      id: "train-pro",
      title: "Train Like a Pro",
      subtitle: "Unlock premium training content",
      cta: "Start now",
      ctaLink: "/plays",
      image: coaches[2]?.image_url || "",
      gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
      icon: Sparkles,
      badge: "New",
    },
  ];
};

const FeaturedCarousel = ({ coaches }: FeaturedCarouselProps) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval>>();
  const touchStartX = useRef(0);

  const slides = buildSlides(coaches);

  // Preload the first slide image (LCP optimization) — optimized to 600px
  useEffect(() => {
    const firstImage = slides[0]?.image;
    if (!firstImage) return;
    const optimized = unsplashUrl(firstImage, 600);
    const existing = document.querySelector(`link[rel="preload"][as="image"][data-lcp]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = optimized;
    link.setAttribute("fetchpriority", "high");
    link.setAttribute("data-lcp", "1");
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [slides[0]?.image]);

  // Snap observer
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root: el, threshold: 0.6 }
    );
    el.querySelectorAll("[data-index]").forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [slides.length]);

  // Auto-scroll — defer start to after initial render
  const startAutoplay = useCallback(() => {
    clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        const child = scrollRef.current?.children[next] as HTMLElement | undefined;
        if (child && scrollRef.current) {
          scrollRef.current.scrollTo({
            left: child.offsetLeft,
            behavior: "smooth",
          });
        }
        return next;
      });
    }, 5000);
  }, [slides.length]);

  useEffect(() => {
    // Defer autoplay start to reduce main-thread work during load
    const timer = setTimeout(startAutoplay, 3000);
    return () => {
      clearTimeout(timer);
      clearInterval(autoplayRef.current);
    };
  }, [startAutoplay]);

  const handleInteractionStart = () => clearInterval(autoplayRef.current);
  const handleInteractionEnd = () => startAutoplay();

  // Always render the carousel — slides use gradient backgrounds as fallback when no coach images exist

  return (
    <section className="mb-4 px-4">
      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex w-full max-w-full gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-1"
        onTouchStart={(e) => {
          handleInteractionStart();
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={handleInteractionEnd}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            data-index={i}
            className={cn(
              "relative min-w-0 shrink-0 grow-0 basis-[85%] max-w-[85%] snap-center rounded-2xl overflow-hidden cursor-pointer md:basis-full md:max-w-full",
              "active:scale-[0.97]",
              i === activeIndex
                ? "min-h-[200px]"
                : "min-h-[200px] opacity-80 scale-[0.96]"
            )}
            onClick={() => navigate(slide.ctaLink)}
          >
            {/* Background image — first slide uses plain <img> for fastest LCP */}
            {slide.image && (i === 0 ? (
              <img
                src={unsplashUrl(slide.image, 600)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover scale-105"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
            ) : (
              <SafeImage
                src={slide.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                protect={false}
                showSkeleton={false}
                displayWidth={600}
                srcSetWidths={[400, 600]}
                sizes="85vw"
              />
            ))}

            {/* Gradient overlay */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-85", slide.gradient)} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

            {/* Badge */}
            {slide.badge && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-white/20">
                {slide.badge}
              </div>
            )}

            {/* Icon accent */}
            <div className="absolute top-3 right-3 h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
              <slide.icon className="h-4.5 w-4.5 text-white" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full p-5 min-h-[200px]">
              <h3 className="text-white font-bold leading-tight mb-1 text-xl">
                {slide.title}
              </h3>
              <p className="text-white/70 text-xs mb-3">
                {slide.subtitle}
              </p>
              {slide.cta && (
                <div className="flex items-center gap-1 text-white text-xs font-semibold">
                  {slide.cta}
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveIndex(i);
              const child = scrollRef.current?.children[i] as HTMLElement | undefined;
              if (child && scrollRef.current) {
                scrollRef.current.scrollTo({
                  left: child.offsetLeft,
                  behavior: "smooth",
                });
              }
            }}
            className={cn(
              "rounded-full transition-all duration-300",
              i === activeIndex
                ? "w-5 h-1.5 bg-primary"
                : "w-1.5 h-1.5 bg-muted-foreground/25"
            )}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedCarousel;
