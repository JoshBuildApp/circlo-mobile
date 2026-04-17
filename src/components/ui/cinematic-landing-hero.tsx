"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import landingHeroBg from "@/assets/landing-hero-bg.jpg";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  .film-grain {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 50; opacity: 0.03; mix-blend-mode: overlay;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity=".5"/></svg>');
  }

  .bg-grid-theme {
    background-size: 60px 60px;
    background-image:
      linear-gradient(to right, hsl(var(--foreground) / 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(var(--foreground) / 0.05) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  .text-3d-matte {
    color: hsl(var(--foreground));
    text-shadow:
      0 10px 30px hsl(var(--foreground) / 0.2),
      0 2px 4px hsl(var(--foreground) / 0.1);
  }

  .text-silver-matte {
    background: linear-gradient(180deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.85) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter:
      drop-shadow(0px 10px 20px hsl(var(--foreground) / 0.25))
      drop-shadow(0px 2px 4px hsl(var(--foreground) / 0.15));
  }

  .text-card-silver-matte {
    background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter:
      drop-shadow(0px 12px 24px rgba(0,0,0,0.8))
      drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
  }

  .premium-depth-card {
    background: linear-gradient(145deg, rgba(219, 234, 254, 0.12) 0%, rgba(186, 230, 253, 0.08) 50%, rgba(224, 242, 254, 0.06) 100%);
    backdrop-filter: blur(48px) saturate(1.4);
    -webkit-backdrop-filter: blur(48px) saturate(1.4);
    box-shadow:
      0 40px 100px -20px rgba(0, 0, 0, 0.5),
      0 20px 40px -20px rgba(0, 0, 0, 0.4),
      inset 0 1px 2px rgba(255, 255, 255, 0.2),
      inset 0 -2px 4px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(135, 206, 250, 0.15);
    position: relative;
  }

  .card-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
    background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(96,165,250,0.12) 0%, transparent 40%);
    mix-blend-mode: screen; transition: opacity 0.3s ease;
  }

  .iphone-bezel {
    background-color: #111;
    box-shadow:
      inset 0 0 0 2px #52525B,
      inset 0 0 0 7px #000,
      0 40px 80px -15px rgba(0,0,0,0.9),
      0 15px 25px -5px rgba(0,0,0,0.7);
    transform-style: preserve-3d;
  }

  .hardware-btn {
    background: linear-gradient(90deg, #404040 0%, #171717 100%);
    box-shadow:
      -2px 0 5px rgba(0,0,0,0.8),
      inset -1px 0 1px rgba(255,255,255,0.15),
      inset 1px 0 2px rgba(0,0,0,0.8);
    border-left: 1px solid rgba(255,255,255,0.05);
  }

  .screen-glare {
    background: linear-gradient(110deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%);
  }

  .widget-depth {
    background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
    box-shadow:
      0 10px 20px rgba(0,0,0,0.3),
      inset 0 1px 1px rgba(255,255,255,0.05),
      inset 0 -1px 1px rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.03);
  }

  .floating-ui-badge {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 25px 50px -12px rgba(0, 0, 0, 0.8),
      inset 0 1px 1px rgba(255,255,255,0.2),
      inset 0 -1px 1px rgba(0,0,0,0.5);
  }

  .btn-modern-light, .btn-modern-dark {
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .btn-modern-light {
    background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%);
    color: #0F172A;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1), 0 12px 24px -4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 6px 12px -2px rgba(0,0,0,0.15), 0 20px 32px -6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:active {
    transform: translateY(1px);
    background: linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1), inset 0 3px 6px rgba(0,0,0,0.1);
  }
  .btn-modern-dark {
    background: linear-gradient(180deg, #27272A 0%, #18181B 100%);
    color: #FFFFFF;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.6), 0 12px 24px -4px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:hover {
    transform: translateY(-3px);
    background: linear-gradient(180deg, #3F3F46 0%, #27272A 100%);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 6px 12px -2px rgba(0,0,0,0.7), 0 20px 32px -6px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.2);
  }
  .btn-modern-dark:active {
    transform: translateY(1px);
    background: #18181B;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.05), inset 0 3px 8px rgba(0,0,0,0.9);
  }

  .progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: 402;
    stroke-dashoffset: 402;
    stroke-linecap: round;
  }
`;

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
  ctaHeading?: string;
  ctaDescription?: string;
  onFindCoach?: () => void;
  onJoinAsCoach?: () => void;
}

export function CinematicHero({
  brandName = "Circlo",
  tagline1 = "Find your coach,",
  tagline2 = "join the circle.",
  cardHeading = "Training, reimagined.",
  cardDescription = (
    <>
      Circlo connects athletes with top coaches across 12+ sports. Book
      sessions, track your progress, and join a community that pushes you to be
      better.
    </>
  ),
  metricValue = 500,
  metricLabel = "Sessions Booked",
  ctaHeading = "Start training today.",
  ctaDescription = "Join thousands of athletes and coaches. Find your perfect match and book your first session — completely free.",
  onFindCoach,
  onJoinAsCoach,
  className,
  ...props
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  // Mouse interaction
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          mainCardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);

          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(mockupRef.current, {
            rotationY: xVal * 12,
            rotationX: -yVal * 12,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Scroll timeline
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const scrollDistance = isMobile ? 1500 : 2200;
    const scrubSpeed = isMobile ? 0.3 : 0.6;

    const ctx = gsap.context(() => {
      // Initial states
      gsap.set(".text-track", { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)", rotationX: -20 });
      gsap.set(".text-days", { autoAlpha: 0, y: 30 });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget"], { autoAlpha: 0 });
      gsap.set(".cta-wrapper", { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });

      // Intro
      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".text-track", { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", rotationX: 0, ease: "expo.out" })
        .to(".text-days", { duration: 1.4, autoAlpha: 1, y: 0, ease: "power4.inOut" }, "-=1.0");

      // Scroll
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${scrollDistance}`,
          pin: true,
          scrub: scrubSpeed,
          anticipatePin: 1,
          fastScrollEnd: true,
          preventOverlaps: true,
          onLeave: () => scrollTl.progress(1),
          onLeaveBack: () => scrollTl.progress(0),
        },
      });

      scrollTl
        // Track image scrolls down
        .to(".hero-track-bg", { y: "-40%", ease: "none", duration: 4 }, 0)
        // Fade hero text, bring in card
        .to([".hero-text-wrapper", ".bg-grid-theme"], { scale: 1.15, filter: "blur(20px)", opacity: 0.2, ease: "power2.inOut", duration: 1.5 }, 0)
        .to(".main-card", { y: 0, ease: "power3.inOut", duration: 1.5 }, 0)
        // Expand card + phone mockup flies in together
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.2 })
        .fromTo(".mockup-scroll-wrapper",
          { y: 200, z: -300, rotationX: 30, rotationY: -20, autoAlpha: 0, scale: 0.7 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.8 }, "-=0.6"
        )
        // Widgets + badges + text all appear together
        .fromTo(".phone-widget", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, ease: "back.out(1.2)", duration: 1 }, "-=1.0")
        .to(".progress-ring", { strokeDashoffset: 60, duration: 1.5, ease: "power3.inOut" }, "-=0.8")
        .to(".counter-val", { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 1.5, ease: "expo.out" }, "-=1.5")
        .fromTo(".floating-badge", { y: 60, autoAlpha: 0, scale: 0.8 }, { y: 0, autoAlpha: 1, scale: 1, ease: "back.out(1.5)", duration: 1, stagger: 0.1 }, "-=1.2")
        .fromTo(".card-left-text", { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1 }, "-=1.0")
        .fromTo(".card-right-text", { x: 40, autoAlpha: 0, scale: 0.85 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1 }, "<")
        // Brief pause
        .to({}, { duration: 1 })
        // Swap to CTA & card exits
        .set(".hero-text-wrapper", { autoAlpha: 0 })
        .set(".cta-wrapper", { autoAlpha: 1 })
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text"], {
          scale: 0.9, y: -30, autoAlpha: 0, ease: "power3.in", duration: 0.8, stagger: 0.03,
        })
        .to(".main-card", {
          width: isMobile ? "92vw" : "85vw",
          height: isMobile ? "92vh" : "85vh",
          borderRadius: isMobile ? "32px" : "40px",
          ease: "expo.inOut",
          duration: 1.2,
        }, "pullback")
        .to(".cta-wrapper", { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.2 }, "pullback")
        // Card exits up
        .to(".main-card", { y: -window.innerHeight - 300, ease: "power3.in", duration: 1 });

      // Refresh after layout settles
      ScrollTrigger.refresh();
    }, containerRef);

    const handleResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ctx.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [metricValue]);

  return (
    <div ref={containerRef} className={cn("relative min-h-[100dvh] overflow-hidden bg-background", className)} {...props}>
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />

      {/* Hero background image — scrolls to simulate running down the track */}
      <img
        src={landingHeroBg}
        alt=""
        className="hero-track-bg absolute inset-0 w-full h-[200%] object-cover opacity-40"
        style={{ objectPosition: "center top", willChange: "transform" }}
        aria-hidden="true"
      />
      {/* Gradient overlay to blend image into background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/40 to-background z-[1]" />

      {/* Grid overlay */}
      <div className="bg-grid-theme absolute inset-0 z-[2]" />
      <div className="film-grain" />

      {/* ─── Hero text ─── */}
      <div className="hero-text-wrapper absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
        <div className="text-center w-full max-w-4xl mx-auto">
          <h1 className="text-track text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-black tracking-tight leading-[1.18] w-full pb-4">
            <span className="text-silver-matte block w-full break-words pb-2">{tagline1}</span>
            <span className="text-days text-silver-matte block mt-2 w-full break-words pb-3">{tagline2}</span>
          </h1>
          <p className="text-3d-matte text-sm sm:text-base text-foreground/80 mt-8 max-w-lg mx-auto leading-relaxed font-medium">
            {brandName} — the sports coaching marketplace. Find verified coaches, book instantly, and level up your game.
          </p>
        </div>
      </div>

      {/* ─── CTA (hidden, revealed by scroll) ─── */}
      <div className="cta-wrapper absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pointer-events-none" style={{ opacity: 0 }}>
        <div className="text-center max-w-xl mx-auto pointer-events-auto">
          <h2 className="text-card-silver-matte text-4xl sm:text-5xl md:text-6xl font-heading font-black tracking-tight leading-[1.05]">
            {ctaHeading}
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-6 max-w-md mx-auto leading-relaxed">
            {ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <button onClick={onFindCoach} className="btn-modern-light rounded-2xl px-8 py-4 text-base font-semibold">
              Find a Coach
            </button>
            <button onClick={onJoinAsCoach} className="btn-modern-dark rounded-2xl px-8 py-4 text-base font-semibold">
              Join as a Coach
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main card ─── */}
      <div
        ref={mainCardRef}
        className="main-card premium-depth-card absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center overflow-hidden"
        style={{ width: "85vw", height: "85vh", borderRadius: "40px", willChange: "transform, width, height, border-radius" }}
      >
        <div className="card-sheen" />

        {/* Card inner layout */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center w-full h-full gap-8 md:gap-16 px-6 sm:px-12 lg:px-20">
          {/* Left text */}
          <div className="card-left-text flex-1 max-w-md">
            <h3 className="text-card-silver-matte text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight leading-[1.16] pb-2">
              {cardHeading}
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base mt-6 leading-relaxed">
              {cardDescription}
            </p>
          </div>

          {/* Right: Phone mockup */}
          <div className="card-right-text flex-shrink-0" style={{ perspective: "1200px" }}>
            <div ref={mockupRef} className="mockup-scroll-wrapper relative" style={{ transformStyle: "preserve-3d" }}>
              {/* iPhone frame */}
              <div className="iphone-bezel relative rounded-[3rem] w-[260px] h-[540px] sm:w-[280px] sm:h-[580px] p-3 overflow-hidden">
                {/* Hardware buttons */}
                <div className="hardware-btn absolute -right-[3px] top-28 w-[4px] h-12 rounded-l-sm" />
                <div className="hardware-btn absolute -right-[3px] top-44 w-[4px] h-12 rounded-l-sm" />

                {/* Screen */}
                <div className="relative w-full h-full rounded-[2.4rem] overflow-hidden bg-gradient-to-b from-[#0a1a2e] to-[#070d21]">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-30" />
                  {/* Glare */}
                  <div className="screen-glare absolute inset-0 z-20 rounded-[2.4rem]" />

                  {/* App UI */}
                  <div className="relative z-10 p-5 pt-10 flex flex-col h-full">
                    {/* Status bar */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-6">
                      <span>9:41</span>
                      <span className="text-xs font-bold text-white/80 tracking-tight">circlo</span>
                      <span>●●●</span>
                    </div>

                    {/* Widget: Sessions ring */}
                    <div className="phone-widget widget-depth rounded-2xl p-4 mb-3 flex items-center gap-4">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 140 140">
                          <circle cx="70" cy="70" r="64" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                          <circle cx="70" cy="70" r="64" fill="none" stroke="#FF6B2B" strokeWidth="8" className="progress-ring" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="counter-val text-white text-lg font-black">0</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-white/90 text-xs font-bold">{metricLabel}</p>
                        <p className="text-zinc-500 text-[10px] mt-0.5">This month</p>
                      </div>
                    </div>

                    {/* Widget: Next session */}
                    <div className="phone-widget widget-depth rounded-2xl p-4 mb-3">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Next Session</p>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-400 flex items-center justify-center text-white text-sm font-bold">
                          🏸
                        </div>
                        <div>
                          <p className="text-white text-xs font-semibold">Padel Training</p>
                          <p className="text-zinc-500 text-[10px]">Tomorrow, 10:00 AM</p>
                        </div>
                      </div>
                    </div>

                    {/* Widget: Coach */}
                    <div className="phone-widget widget-depth rounded-2xl p-4">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Your Coach</p>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-[10px] font-bold">
                          SM
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-xs font-semibold">Sofia Martinez</p>
                          <p className="text-zinc-500 text-[10px]">⭐ 4.9 · 127 reviews</p>
                        </div>
                        <div className="text-orange-400 text-[10px] font-bold">PRO</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="floating-badge floating-ui-badge absolute -left-14 top-20 rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="text-lg">🏅</span>
                <div>
                  <p className="text-white text-[11px] font-bold">12+ Sports</p>
                  <p className="text-zinc-500 text-[9px]">All in one place</p>
                </div>
              </div>

              <div className="floating-badge floating-ui-badge absolute -right-16 top-48 rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <div>
                  <p className="text-white text-[11px] font-bold">Instant Book</p>
                  <p className="text-zinc-500 text-[9px]">No waiting</p>
                </div>
              </div>

              <div className="floating-badge floating-ui-badge absolute -left-10 bottom-16 rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <div>
                  <p className="text-white text-[11px] font-bold">Level Up</p>
                  <p className="text-zinc-500 text-[9px]">XP & Badges</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
