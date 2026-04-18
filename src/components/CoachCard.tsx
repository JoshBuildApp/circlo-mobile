import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { SafeImage } from "@/components/ui/safe-image";
import { resolveCoachImage } from "@/lib/coach-placeholders";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestGate } from "@/contexts/GuestGateContext";
import { CoachTrustSignals } from "@/components/CoachTrustSignals";
import { CoachHeartButton } from "@/components/CoachHeartButton";

export interface CoachCardProps {
  id: string;
  coach_name: string;
  sport: string;
  image_url?: string | null;
  rating?: number;
  reviewCount?: number;
  sessionsCompleted?: number;
  price?: number;
  is_verified?: boolean;
  is_pro?: boolean;
  /** "instant" confirms on tap; "request" waits for coach. Defaults to "request". */
  bookingMode?: "instant" | "request";
  location?: string;
  followers?: number;
  tagline?: string;
  /** Pre-formatted "next available" chip, e.g. "Today 6pm". Optional. */
  nextSlotLabel?: string | null;
  /** Animation index for staggered entrance */
  index?: number;
  onBook?: (id: string) => void;
}

const SPORT_TAGLINES: Record<string, string> = {
  crossfit: "Strength & Conditioning Specialist",
  fitness: "Strength & Conditioning Specialist",
  yoga: "Vinyasa & Mobility Expert",
  tennis: "Former ATP Professional",
  mma: "Striking & Grappling Coach",
  boxing: "Boxing & Footwork Coach",
  padel: "Padel Tactics & Technique",
  soccer: "Technical & Tactical Coach",
  basketball: "Shooting & IQ Specialist",
  swimming: "Stroke Technique Expert",
  running: "Endurance & Pace Coach",
  "martial arts": "Traditional Martial Arts Master",
};

function getTagline(sport: string, tagline?: string): string {
  if (tagline && tagline.trim().length > 0) return tagline;
  return SPORT_TAGLINES[sport.toLowerCase()] ?? `${sport} Coach`;
}

export const CoachCard = memo(({
  id,
  coach_name,
  sport,
  image_url,
  rating = 4.8,
  reviewCount,
  sessionsCompleted,
  price,
  is_verified,
  is_pro,
  bookingMode = "request",
  location,
  tagline,
  nextSlotLabel,
  index = 0,
}: CoachCardProps) => {
  const resolvedImage = resolveCoachImage(image_url, id);
  const subtitle = getTagline(sport, tagline);
  const { user } = useAuth();
  const { requireAuth } = useGuestGate();
  const navigate = useNavigate();

  const href = `/coach/${id}`;
  // Guests get the sign-up/log-in sheet instead of the coach page.
  const handleTap = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      requireAuth(false, () => navigate(href), href);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="group"
    >
      <Link
        to={href}
        onClick={handleTap}
        className="relative block w-[176px] sm:w-[192px] aspect-[3/4] rounded-3xl overflow-hidden shadow-lg hover:shadow-[0_0_32px_rgba(255,107,43,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        aria-label={`View ${coach_name}'s coaching profile`}
      >
        <SafeImage
          src={resolvedImage}
          alt={coach_name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          displayWidth={400}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

        {/* Top row: sport pill + rating + heart */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FF6B2B] text-white text-[9px] font-bold uppercase tracking-wide shadow-md">
            {sport}
          </span>
          <CoachHeartButton coachId={id} coachName={coach_name} size="sm" />
        </div>

        {/* Trust signals row */}
        <div className="absolute top-11 left-2.5 right-2.5">
          <CoachTrustSignals
            rating={rating}
            reviewCount={reviewCount}
            sessionsCompleted={sessionsCompleted}
            isVerified={is_verified}
            bookingMode={bookingMode}
            variant="card"
          />
        </div>

        {/* PRO corner ribbon */}
        {is_pro && (
          <span className="absolute top-[74px] right-2.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[9px] font-extrabold text-[#1A1A2E] shadow-md">
            PRO
          </span>
        )}

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          {/* Details row: location + next slot */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {location && (
              <span className="flex items-center gap-0.5 text-[9px] text-white/80 font-medium">
                <MapPin className="h-2.5 w-2.5" />
                <span className="truncate max-w-[70px]">{location}</span>
              </span>
            )}
            {nextSlotLabel && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/85 text-white text-[9px] font-bold">
                <Clock className="h-2.5 w-2.5" />
                {nextSlotLabel}
              </span>
            )}
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-white font-bold text-[13px] leading-tight truncate drop-shadow-md">
                  {coach_name}
                </p>
                {is_verified && (
                  <CheckCircle2
                    className="h-3 w-3 text-sky-400 fill-sky-400/20 flex-shrink-0"
                    strokeWidth={2.5}
                  />
                )}
              </div>
              <p className="text-white/75 text-[10px] mt-0.5 truncate">
                {subtitle}
              </p>
            </div>
            {price != null && price > 0 && (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[#FF6B2B] text-white text-[10px] font-bold shadow-md">
                ₪{price}/h
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

CoachCard.displayName = "CoachCard";
