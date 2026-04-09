import { memo, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Star, Share2, Calendar, Bookmark,
  CheckCircle2, MessageCircle, Sparkles, Users, Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`
    : n.toString();

interface CoachProfileHeroProps {
  name: string;
  sport: string;
  tagline: string;
  location: string;
  image: string;
  coverImage: string;
  introVideoUrl?: string | null;
  price: number;
  rating: string;
  reviewCount: number;
  followers: number;
  specialties: string[];
  isVerified: boolean;
  isOwner: boolean;
  following: boolean;
  coachUserId?: string;
  onBooking: () => void;
  onToggleFollow: () => void;
  onPageLab: () => void;
  onFollowersOpen: () => void;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const CoachProfileHero = memo(({
  name,
  sport,
  tagline,
  location,
  image,
  coverImage,
  introVideoUrl,
  price,
  rating,
  reviewCount,
  followers,
  specialties,
  isVerified,
  isOwner,
  following,
  coachUserId,
  onBooking,
  onToggleFollow,
  onPageLab,
  onFollowersOpen,
}: CoachProfileHeroProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Preload cover image
  useEffect(() => {
    if (introVideoUrl) return;
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = coverImage;
  }, [coverImage, introVideoUrl]);

  const handleShare = async () => {
    try {
      await navigator.share?.({ title: `${name} — Coach Profile`, url: window.location.href });
    } catch { /* cancelled */ }
  };

  // Sport tags: main sport + first 2 specialties
  const sportTags = [sport, ...specialties.slice(0, 2)].filter(Boolean);

  return (
    <div className="relative">
      {/* ── Cover Media ── */}
      <div className="relative h-[56vh] min-h-[400px] max-h-[520px] overflow-hidden">
        {introVideoUrl ? (
          <video
            ref={videoRef}
            src={introVideoUrl}
            className="absolute inset-0 h-full w-full object-cover scale-[1.02]"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={coverImage}
            alt={name}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
              imageLoaded ? "scale-100 opacity-100" : "scale-105 opacity-0"
            }`}
          />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

        {/* ── Top Nav ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 z-10 safe-area-top">
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex gap-2"
          >
            {isOwner && (
              <button
                onClick={onPageLab}
                className="h-10 px-3.5 rounded-full bg-primary/90 backdrop-blur-xl flex items-center justify-center gap-1.5 text-primary-foreground active:scale-95 transition-all text-xs font-heading font-bold"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Page Lab
              </button>
            )}
            <button
              onClick={() => toast.success("Profile saved!")}
              className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <Bookmark className="h-5 w-5" />
            </button>
            <button
              onClick={handleShare}
              className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </motion.div>
        </div>

        {/* ── Hero Content (bottom of cover) ── */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 px-5 pb-5"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Avatar + Name row */}
          <motion.div variants={fadeUp} className="flex items-end gap-4 mb-3">
            <motion.div variants={scaleIn} className="relative flex-shrink-0">
              {/* Gradient ring around avatar */}
              <div className="p-[3px] rounded-[22px] bg-brand-gradient shadow-2xl">
                <div className="h-[76px] w-[76px] rounded-[20px] overflow-hidden bg-background">
                  <img src={image} alt={name} className="h-full w-full object-cover" />
                </div>
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg ring-2 ring-background">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </motion.div>

            <div className="flex-1 min-w-0 pb-0.5">
              <h1 className="font-heading text-[26px] font-bold text-foreground leading-tight tracking-tight drop-shadow-sm">
                {name}
              </h1>
              {tagline && (
                <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1">{tagline}</p>
              )}
            </div>
          </motion.div>

          {/* Stats row: rating · followers · location */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 text-[12px] mb-3">
            <span className="flex items-center gap-1 text-foreground font-semibold">
              <Star className="h-3.5 w-3.5 text-accent fill-accent" />
              {rating}
              <span className="text-muted-foreground font-normal">({reviewCount})</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <button
              onClick={onFollowersOpen}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <Users className="h-3 w-3" />{fmt(followers)} fans
            </button>
            {location && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />{location}
                </span>
              </>
            )}
          </motion.div>

          {/* Sport tags */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-1.5 mb-4">
            {sportTags.map((tag) => (
              <Badge
                key={tag}
                className="px-3 py-1.5 text-[10px] rounded-full bg-white/15 backdrop-blur-md text-white border-0 font-semibold capitalize shadow-sm"
              >
                <Flame className="h-2.5 w-2.5 mr-1" />
                {tag}
              </Badge>
            ))}
          </motion.div>

          {/* CTA row: Book · Price  |  Follow  |  Chat */}
          <motion.div variants={fadeUp} className="flex gap-2.5">
            <button
              onClick={onBooking}
              className="flex-1 h-[52px] rounded-2xl font-heading font-bold text-[15px] bg-brand-gradient text-white shadow-brand-sm active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2.5"
            >
              <Calendar className="h-[18px] w-[18px]" />
              Book · ${price}
            </button>
            <button
              onClick={onToggleFollow}
              className={`h-[52px] px-5 rounded-2xl font-heading font-bold text-[15px] transition-all active:scale-[0.97] flex items-center justify-center gap-2 ${
                following
                  ? "bg-secondary text-foreground border border-border/30"
                  : "bg-foreground text-background"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
            {coachUserId && (
              <Link
                to={`/chat/${coachUserId}`}
                className="h-[52px] w-[52px] rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all flex-shrink-0"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
});

CoachProfileHero.displayName = "CoachProfileHero";

export default CoachProfileHero;
