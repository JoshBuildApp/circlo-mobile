import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { SafeImage } from "@/components/ui/safe-image";
import { resolveCoachImage } from "@/lib/coach-placeholders";
import type { HomeCoach } from "@/hooks/use-home-data";

interface HeroPanelProps {
  coaches: HomeCoach[];
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const HeroPanel = memo(({ coaches }: HeroPanelProps) => {
  const { profile } = useAuth();

  const firstName = useMemo(() => {
    const name = profile?.username?.trim() || "athlete";
    return name.split(/\s+/)[0];
  }, [profile?.username]);

  const avatarCoaches = coaches.slice(0, 4);
  const verifiedCount = coaches.filter((c) => c.is_verified).length;
  const onlineCount = Math.max(12, coaches.length * 3);
  const heroImage = coaches[0]
    ? resolveCoachImage(coaches[0].image_url, coaches[0].id)
    : null;

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative h-[360px] md:h-[420px] rounded-[28px] overflow-hidden flex items-center px-6 md:px-12 lg:px-16"
        style={{
          background:
            "linear-gradient(135deg, #1A1A2E 0%, #2A1F3D 60%, #3A1F4D 100%)",
        }}
      >
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full bg-[#FF6B2C]/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-[300px] h-[300px] rounded-full bg-[#FF6B2C]/10 blur-[100px] pointer-events-none" />

        {/* Left: copy + CTAs */}
        <div className="relative z-10 w-full md:w-1/2">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-[1.05] tracking-tight mb-3">
            {greeting()}, {firstName}.
            <br />
            Ready for your next round?
          </h1>
          <p className="text-base md:text-lg text-white/75 mb-6 font-medium">
            {verifiedCount > 0
              ? `${verifiedCount} verified coaches near you have slots opening today.`
              : `${coaches.length} coaches near you have slots opening today.`}
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Link
              to="/discover"
              className="inline-flex items-center px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-sm md:text-base text-white bg-gradient-to-r from-[#FF6B2C] to-[#FF8C42] hover:scale-105 active:scale-95 transition-transform shadow-[0_8px_24px_-6px_rgba(255,107,44,0.6)]"
            >
              Book a session
            </Link>
            <Link
              to="/discover"
              className="inline-flex items-center px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-sm md:text-base text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 transition-colors"
            >
              Explore coaches
            </Link>
          </div>

          {avatarCoaches.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {avatarCoaches.map((c) => (
                  <div
                    key={c.id}
                    className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#1A1A2E] bg-white/10"
                  >
                    <SafeImage
                      src={resolveCoachImage(c.image_url, c.id)}
                      alt={c.coach_name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      displayWidth={72}
                    />
                  </div>
                ))}
              </div>
              <span className="flex items-center gap-1.5 text-white/75 text-xs md:text-sm font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                + {onlineCount} online now
              </span>
            </div>
          )}
        </div>

        {/* Right: tilted media card */}
        {heroImage && (
          <motion.div
            initial={{ opacity: 0, rotate: 8, x: 40 }}
            animate={{ opacity: 1, rotate: 2, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ rotate: 0, scale: 1.02 }}
            className="hidden md:block absolute right-8 lg:right-12 w-[280px] lg:w-[320px] h-[280px] lg:h-[320px] rounded-3xl overflow-hidden shadow-2xl"
          >
            <SafeImage
              src={heroImage}
              alt="Featured coach"
              className="h-full w-full object-cover"
              loading="lazy"
              displayWidth={640}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FF6B2C]/30 via-transparent to-transparent mix-blend-overlay" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center">
                <Play className="h-7 w-7 text-white fill-white ml-1" />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
});

HeroPanel.displayName = "HeroPanel";

export default HeroPanel;
