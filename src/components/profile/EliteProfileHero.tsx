import { motion } from "framer-motion";
import { Crown, Star, MessageCircle, UserPlus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfileTier = "standard" | "pro" | "elite";

interface EliteProfileHeroProps {
  name: string;
  tagline?: string;
  avatar: string;
  coverImage: string;
  tier?: ProfileTier;
  /** "coach" shows Connect+Follow CTA, "user" shows Follow only */
  variant: "coach" | "user";
  isVerified?: boolean;
  isFollowing?: boolean;
  /** Optional badges shown under name (e.g. "Level 5 Coach", "Elite Player") */
  badges?: { label: string; icon?: "star" | "crown" | "check"; color?: "teal" | "orange" | "purple" | "gold" }[];
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryLabel?: string;
  isOwner?: boolean;
}

const badgeIconMap = {
  star: Star,
  crown: Crown,
  check: Check,
};

const badgeColorMap = {
  teal: "border-teal/40 text-teal bg-teal/10",
  orange: "border-orange-400/40 text-orange-400 bg-orange-400/10",
  purple: "border-purple-400/40 text-purple-400 bg-purple-400/10",
  gold: "border-yellow-400/50 text-yellow-300 bg-yellow-400/10",
};

/**
 * Premium profile hero with cover banner, glowing avatar, badges, and CTAs.
 * Tier "pro" / "elite" enables gold accents, animated glow, and crown indicator.
 */
export default function EliteProfileHero({
  name,
  tagline,
  avatar,
  coverImage,
  tier = "standard",
  variant,
  isVerified = false,
  isFollowing = false,
  badges = [],
  onPrimary,
  onSecondary,
  primaryLabel,
  isOwner = false,
}: EliteProfileHeroProps) {
  const isElite = tier === "elite" || tier === "pro";

  const ringGradient = isElite
    ? "linear-gradient(135deg, #FFD700, #FF6B2C, #00D4AA, #FFD700)"
    : "linear-gradient(135deg, #00D4AA, #06B6D4, #A855F7)";

  const ctaLabel =
    primaryLabel ??
    (variant === "coach"
      ? isFollowing
        ? "Following"
        : "Connect + Follow"
      : isFollowing
        ? "Following"
        : "Follow");

  return (
    <section className="relative w-full overflow-hidden">
      {/* Cover banner */}
      <div className="relative h-48 sm:h-56 md:h-64 w-full">
        <img
          src={coverImage}
          alt={`${name} cover`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/30 to-transparent" />

        {/* Animated mesh overlay (subtle network lines) */}
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
          viewBox="0 0 800 300"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="meshGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d="M 0 150 Q 200 80 400 160 T 800 140"
            stroke="url(#meshGradient)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M 0 200 Q 250 130 500 200 T 800 190"
            stroke="url(#meshGradient)"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* Elite golden glow corner accent */}
        {isElite && (
          <div
            aria-hidden
            className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(255, 215, 0, 0.4), transparent 60%)",
            }}
          />
        )}
      </div>

      {/* Profile body */}
      <div className="relative px-4 sm:px-6 -mt-16 sm:-mt-20 pb-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          {/* Avatar with glowing ring */}
          <motion.div
            className="relative shrink-0"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Outer glow */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full blur-xl opacity-70"
              style={{ background: ringGradient }}
            />
            {/* Spinning gradient ring */}
            <motion.div
              aria-hidden
              className="absolute -inset-1 rounded-full"
              style={{ background: ringGradient }}
              animate={isElite ? { rotate: 360 } : {}}
              transition={
                isElite
                  ? { duration: 12, repeat: Infinity, ease: "linear" }
                  : undefined
              }
            />
            {/* Avatar image */}
            <img
              src={avatar}
              alt={name}
              className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-navy-deep"
            />
            {/* Crown for elite */}
            {isElite && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full p-2 shadow-lg shadow-yellow-500/40">
                <Crown className="w-4 h-4 text-navy-deep" fill="currentColor" />
              </div>
            )}
          </motion.div>

          {/* Name + tagline + badges */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                  {name}
                </h1>
                {isVerified && (
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal text-navy-deep"
                    aria-label="Verified"
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </span>
                )}
                {isElite && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-400 to-orange-400 text-navy-deep">
                    <Crown className="w-3 h-3" /> Elite
                  </span>
                )}
              </div>
              {tagline && (
                <p className="mt-1 text-sm sm:text-base text-gray-400 line-clamp-2">
                  {tagline}
                </p>
              )}

              {/* Badge pills */}
              {badges.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {badges.map((badge, i) => {
                    const Icon = badge.icon ? badgeIconMap[badge.icon] : Star;
                    const colorClass = badgeColorMap[badge.color || "teal"];
                    return (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-sm",
                          colorClass,
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* CTAs */}
          {!isOwner && (
            <motion.div
              className="flex items-center gap-2 shrink-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <button
                type="button"
                onClick={onPrimary}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg",
                  isElite
                    ? "bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 text-navy-deep shadow-yellow-500/30"
                    : "bg-teal text-navy-deep shadow-teal/30",
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {ctaLabel}
                </span>
              </button>
              {onSecondary && (
                <button
                  type="button"
                  onClick={onSecondary}
                  className="w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                  aria-label="Message"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
