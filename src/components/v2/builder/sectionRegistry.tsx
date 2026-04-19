import type { ReactNode } from "react";
import { Play, Star, Award, GraduationCap, MapPin, Instagram, Youtube, Music2, ChevronDown, Plus, Video, MessageSquare, Image, AtSign, CheckCircle2, DollarSign, HelpCircle, Info } from "lucide-react";
import { PulseDot, StatCard, Chip } from "@/components/v2/shared";
import { formatPrice } from "@/lib/v2/currency";
import type { Coach } from "@/types/v2";
import type { CoachReview } from "@/hooks/v2/useSupabaseQueries";

/**
 * Section registry for the coach-profile builder.
 *
 * Each entry describes:
 *  - id:         stable key stored in the user's layout JSON
 *  - label:      uppercase badge shown in edit mode
 *  - required:   can't be hidden or removed (availability + CTAs only)
 *  - editable:   has content the owner can tweak (future inline editor)
 *  - render:     pure function producing the section's JSX from context
 *  - catalog:    (optional) entry in the "add section" library sheet
 *
 * The data it needs is passed in RenderCtx so the registry stays pure and
 * testable — no hooks, no supabase calls here.
 */

export type SectionId =
  | "availability"
  | "ctas"
  | "stats"
  | "about"
  | "video"
  | "credentials"
  | "reviews"
  | "faq"
  | "gallery"
  | "venues"
  | "social";

export interface RenderCtx {
  coach: Coach;
  ratingValue: number;
  reviewCount: number;
  reviews: CoachReview[];
  following: boolean;
  followBusy: boolean;
  onFollow: () => void;
  onMessage: () => void;
}

export interface CatalogInfo {
  /** Group shown in the library sheet. */
  group: "popular" | "grow";
  iconKey: "video" | "star" | "award" | "help" | "map" | "at" | "image";
  description: string;
  pro?: boolean;
}

export interface SectionDef {
  id: SectionId;
  label: string;
  required?: boolean;
  editable?: boolean;
  render: (ctx: RenderCtx) => ReactNode;
  catalog?: CatalogInfo;
}

/* ---------- Small primitives used by multiple sections ---------- */

function Section({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-5 mt-3 p-4 rounded-[14px] bg-navy-card">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[10px] text-v2-muted font-bold uppercase tracking-wider">{label}</div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function CredentialRow({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Star;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex gap-2.5 py-2 border-b border-navy-line last:border-b-0 last:pb-0 first:pt-0">
      <div className="w-8 h-8 rounded-[8px] bg-teal-dim text-teal flex items-center justify-center shrink-0">
        <Icon size={14} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-bold truncate">{title}</div>
        <div className="text-[11px] text-v2-muted mt-0.5 truncate">{sub}</div>
      </div>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a?: string }) {
  return (
    <div className="py-2 border-b border-navy-line last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex justify-between items-center text-[13px] font-bold">
        <span>{q}</span>
        {a ? <ChevronDown size={14} className="text-v2-muted rotate-180" /> : <Plus size={14} className="text-v2-muted" />}
      </div>
      {a && <div className="text-[12px] text-v2-muted mt-1 leading-snug">{a}</div>}
    </div>
  );
}

function VenueRow({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="flex gap-2.5 py-2 border-b border-navy-line last:border-b-0 items-center last:pb-0 first:pt-0">
      <div className="w-9 h-9 rounded-[10px] bg-orange-dim text-orange flex items-center justify-center shrink-0">
        <MapPin size={14} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-bold truncate">{name}</div>
        <div className="text-[11px] text-v2-muted mt-0.5 truncate">{sub}</div>
      </div>
    </div>
  );
}

function SocialButton({ icon: Icon, label }: { icon: typeof Instagram; label: string }) {
  return (
    <button
      className="flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-navy-card-2 text-offwhite text-[12px] font-semibold"
    >
      <Icon size={13} strokeWidth={2.2} />
      {label}
    </button>
  );
}

const GALLERY_TILES = [
  "v2-avatar-grad-award",
  "v2-avatar-grad-orange",
  "v2-avatar-grad-teal",
  "v2-avatar-grad-mix",
  "v2-avatar-grad-award",
  "v2-avatar-grad-orange",
];

/* ---------- The registry ---------- */

export const SECTION_DEFS: Record<SectionId, SectionDef> = {
  availability: {
    id: "availability",
    label: "Availability",
    required: true,
    render: ({ coach }) => (
      <div className="px-5 pt-3 pb-1">
        <div data-grad="teal-soft" className="px-3.5 py-2.5 rounded-[12px] border border-teal-dim flex items-center gap-2.5">
          <PulseDot />
          <div className="flex-1">
            <div className="text-[11px] text-teal font-bold tracking-wider">AVAILABLE FOR BOOKINGS</div>
            <div className="text-[12px] text-offwhite font-medium mt-px">
              Usually replies within {coach.avgResponseMin ?? 12}m
            </div>
          </div>
        </div>
      </div>
    ),
  },

  ctas: {
    id: "ctas",
    label: "CTAs",
    required: true,
    render: ({ following, followBusy, onFollow, onMessage, coach }) => (
      <div className="grid grid-cols-2 gap-2.5 px-5 py-2">
        <button
          onClick={onFollow}
          disabled={followBusy}
          className={`py-3 rounded-[12px] font-bold text-[14px] disabled:opacity-60 ${
            following ? "bg-teal text-navy-deep" : "border border-teal text-teal"
          }`}
        >
          {following ? "✓ Following" : `+ Follow ${coach.firstName}`}
        </button>
        <button
          onClick={onMessage}
          className="bg-navy-card text-offwhite py-3 rounded-[12px] font-bold text-[14px]"
        >
          Message
        </button>
      </div>
    ),
  },

  stats: {
    id: "stats",
    label: "Stats",
    catalog: {
      group: "popular",
      iconKey: "star",
      description: "Rating + starting price side-by-side.",
    },
    render: ({ ratingValue, reviewCount, coach }) => (
      <div className="grid grid-cols-2 gap-2.5 px-5 py-2">
        <StatCard
          label="Rating"
          value={
            <span>
              {ratingValue.toFixed(1)} <span className="text-teal">★</span>
            </span>
          }
          sub={`${reviewCount} reviews`}
        />
        <StatCard
          label="From"
          value={formatPrice(coach.priceFromILS)}
          sub="/ session"
          accent="orange"
        />
      </div>
    ),
  },

  about: {
    id: "about",
    label: "About",
    editable: true,
    catalog: {
      group: "popular",
      iconKey: "star",
      description: "Bio + focus tags. The text players scan first.",
    },
    render: ({ coach }) => (
      <Section label="About">
        <p className="text-[13px] leading-relaxed text-offwhite mb-2.5">{coach.bio}</p>
        {(coach.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {coach.tags!.map((tag, i) => (
              <Chip key={tag} variant={i % 3 === 2 ? "orange" : "teal"} className="text-[12px]">
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </Section>
    ),
  },

  video: {
    id: "video",
    label: "Video intro",
    editable: true,
    catalog: {
      group: "popular",
      iconKey: "video",
      description: "Record a 60-sec welcome. Adds ~40% more bookings.",
    },
    render: ({ coach }) => (
      <Section label={`Intro from ${coach.firstName}`}>
        <div data-grad="navy-thumb" className="relative aspect-video rounded-[10px] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-white/95 text-navy-deep flex items-center justify-center">
              <Play size={16} fill="currentColor" strokeWidth={0} className="ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-semibold px-2 py-0.5 rounded">
            0:48
          </div>
        </div>
      </Section>
    ),
  },

  credentials: {
    id: "credentials",
    label: "Credentials",
    editable: true,
    catalog: {
      group: "popular",
      iconKey: "award",
      description: "Certifications, titles, tour experience.",
    },
    render: ({ coach, ratingValue, reviewCount }) => (
      <Section label="Credentials">
        <div className="flex flex-col gap-0">
          <CredentialRow
            icon={Star}
            title={coach.badges.includes("top1") ? "Top 1% Circlo coach" : "Verified Circlo coach"}
            sub={`${reviewCount} reviews · ${ratingValue.toFixed(1)}★ average`}
          />
          <CredentialRow
            icon={Award}
            title={`${coach.sports[0] === "padel" ? "FIP" : "Federation"} Level 3 Certified`}
            sub="International federation badge"
          />
          <CredentialRow
            icon={GraduationCap}
            title="Sports Psychology · BA"
            sub="Tel Aviv University"
          />
        </div>
      </Section>
    ),
  },

  reviews: {
    id: "reviews",
    label: "Reviews",
    catalog: {
      group: "popular",
      iconKey: "star",
      description: "Recent player testimonials, pulled from ratings.",
    },
    render: ({ reviews, reviewCount }) => {
      if (reviews.length === 0) return null;
      return (
        <Section label="Reviews" trailing={<span className="text-[11px] text-v2-muted tnum">{reviewCount} total</span>}>
          <div className="flex flex-col gap-3">
            {reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="border-b border-navy-line last:border-b-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[13px] font-semibold">{r.authorName}</div>
                  <div className="text-[12px] text-orange tnum">
                    {"★".repeat(Math.max(1, r.rating))}
                    {"☆".repeat(Math.max(0, 5 - r.rating))}
                  </div>
                </div>
                {r.comment && <div className="text-[12px] text-v2-muted leading-snug italic">"{r.comment}"</div>}
              </div>
            ))}
          </div>
        </Section>
      );
    },
  },

  faq: {
    id: "faq",
    label: "FAQ",
    editable: true,
    catalog: {
      group: "grow",
      iconKey: "help",
      description: "Answer common questions upfront. Saves replies.",
    },
    render: () => (
      <Section label="Frequently asked">
        <div className="flex flex-col">
          <FaqRow q="Do I need my own racquet?" a="Bring yours if you have one. Loaners available." />
          <FaqRow q="How do I cancel?" />
          <FaqRow q="Do you coach beginners?" />
        </div>
      </Section>
    ),
  },

  gallery: {
    id: "gallery",
    label: "Gallery",
    editable: true,
    catalog: {
      group: "popular",
      iconKey: "image",
      description: "Photos from the court. Up to 12 images.",
    },
    render: () => (
      <Section label="Court in action">
        <div className="grid grid-cols-3 gap-1.5">
          {GALLERY_TILES.map((t, i) => (
            <div key={i} className={`aspect-square rounded-[8px] ${t}`} />
          ))}
        </div>
      </Section>
    ),
  },

  venues: {
    id: "venues",
    label: "Venues",
    editable: true,
    catalog: {
      group: "grow",
      iconKey: "map",
      description: "Courts + clubs where you coach.",
    },
    render: ({ coach }) => (
      <Section label={`Where ${coach.firstName} coaches`}>
        <div className="flex flex-col">
          <VenueRow name={`${coach.city} Padel Club`} sub="Main home court · 4 courts" />
          <VenueRow name="Hayarkon Park" sub="Outdoor · weekend group sessions" />
        </div>
      </Section>
    ),
  },

  social: {
    id: "social",
    label: "Social",
    editable: true,
    catalog: {
      group: "grow",
      iconKey: "at",
      description: "Instagram, TikTok, YouTube.",
    },
    render: () => (
      <Section label="Follow me">
        <div className="grid grid-cols-3 gap-2">
          <SocialButton icon={Instagram} label="Instagram" />
          <SocialButton icon={Youtube} label="YouTube" />
          <SocialButton icon={Music2} label="TikTok" />
        </div>
      </Section>
    ),
  },
};

/** Default layout for a brand-new coach profile. */
export const DEFAULT_LAYOUT: { id: SectionId; visible: boolean }[] = [
  { id: "availability", visible: true },
  { id: "ctas", visible: true },
  { id: "stats", visible: true },
  { id: "about", visible: true },
  { id: "video", visible: true },
  { id: "credentials", visible: true },
  { id: "reviews", visible: true },
  { id: "faq", visible: false },
  { id: "gallery", visible: true },
  { id: "venues", visible: true },
  { id: "social", visible: false },
];

export const CATALOG_ICON_MAP = {
  video: Video,
  star: MessageSquare,
  award: CheckCircle2,
  help: HelpCircle,
  map: MapPin,
  at: AtSign,
  image: Image,
} as const;

// Re-exports kept so the builder can use the same primitives if inline editor ships later.
export { Section, CredentialRow, FaqRow, VenueRow, SocialButton, DollarSign, Info };
