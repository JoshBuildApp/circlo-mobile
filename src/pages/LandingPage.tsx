import { useState, useRef, useEffect, useCallback } from "react";
import CircloLogo from "@/components/CircloLogo";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import InsideTheCircle from "@/components/InsideTheCircle";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import PressMentions from "@/components/home/PressMentions";
import TrustBadges from "@/components/home/TrustBadges";
import {
  Menu,
  X,
  Search,
  Calendar,
  Zap,
  Star,
  BadgeCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Quote,
  Globe,
  AtSign,
  Hash,
} from "lucide-react";
// Rotating text animation for hero
const rotatingWords = ["Padel", "Tennis", "Boxing", "Yoga", "Fitness", "Soccer"];

function RotatingText({ className = "" }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`inline-block relative ${className}`}>
      {/* Invisible placeholder to reserve width */}
      <span className="invisible">{rotatingWords.reduce((a, b) => a.length >= b.length ? a : b)}</span>
      {rotatingWords.map((word, i) => (
        <motion.span
          key={word}
          className="absolute inset-0 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={
            i === index
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: -30, filter: "blur(8px)" }
          }
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Animated counter that counts up when in view
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Animation Helpers ─── */

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

function Stagger({
  children,
  className = "",
  stagger = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: stagger } },
        hidden: {},
      }}
    >
      {children}
    </motion.div>
  );
}

function StaggerChild({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 32 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Data ─── */

const sports = [
  { name: "Padel", emoji: "\u{1F3D3}" },
  { name: "Tennis", emoji: "\u{1F3BE}" },
  { name: "Fitness", emoji: "\u{1F4AA}" },
  { name: "Boxing", emoji: "\u{1F94A}" },
  { name: "Soccer", emoji: "\u26BD" },
  { name: "Basketball", emoji: "\u{1F3C0}" },
  { name: "Yoga", emoji: "\u{1F9D8}" },
  { name: "Swimming", emoji: "\u{1F3CA}" },
  { name: "Running", emoji: "\u{1F3C3}" },
  { name: "MMA", emoji: "\u{1F94B}" },
  { name: "CrossFit", emoji: "\u{1F3CB}" },
  { name: "Martial Arts", emoji: "\u{1F94B}" },
];

const coaches = [
  {
    name: "Sofia Martinez",
    sport: "Padel",
    tags: ["Padel", "Beginner Friendly"],
    rating: 4.9,
    reviews: 127,
    price: 45,
    initials: "SM",
    gradient: "from-primary to-accent",
  },
  {
    name: "Marcus Johnson",
    sport: "Boxing",
    tags: ["Boxing", "Strength"],
    rating: 4.8,
    reviews: 89,
    price: 60,
    initials: "MJ",
    gradient: "from-primary to-primary/70",
  },
  {
    name: "Elena Kovacs",
    sport: "Yoga",
    tags: ["Yoga", "Meditation"],
    rating: 5.0,
    reviews: 203,
    price: 35,
    initials: "EK",
    gradient: "from-primary to-accent/70",
  },
  {
    name: "David Park",
    sport: "Tennis",
    tags: ["Tennis", "Advanced"],
    rating: 4.9,
    reviews: 156,
    price: 55,
    initials: "DP",
    gradient: "from-primary to-accent",
  },
  {
    name: "Aisha Williams",
    sport: "Swimming",
    tags: ["Swimming", "Competitive"],
    rating: 4.7,
    reviews: 94,
    price: 50,
    initials: "AW",
    gradient: "from-primary/70 to-primary",
  },
  {
    name: "Carlos Ruiz",
    sport: "Soccer",
    tags: ["Soccer", "Tactics"],
    rating: 4.8,
    reviews: 112,
    price: 40,
    initials: "CR",
    gradient: "from-accent to-primary",
  },
];

const testimonials = [
  {
    quote:
      "Circlo helped me find the perfect padel coach. Went from beginner to competing in local tournaments in 6 months.",
    name: "Alex Rivera",
    role: "Athlete",
    sport: "Padel",
  },
  {
    quote:
      "Since joining as a coach, I've tripled my client base. The platform handles everything so I can focus on coaching.",
    name: "Sarah Kim",
    role: "Boxing Coach",
    sport: "Boxing",
  },
  {
    quote:
      "The booking system is seamless. I love how easy it is to find, book, and rate coaches all in one place.",
    name: "James Chen",
    role: "Athlete",
    sport: "Tennis",
  },
  {
    quote:
      "Best investment I've made in my fitness journey. My CrossFit coach through Circlo completely transformed my training.",
    name: "Priya Patel",
    role: "Athlete",
    sport: "CrossFit",
  },
];

/* ─── Floating Sport Icon Bubbles (Hero) ─── */

function FloatingIcons({ dark }: { dark: boolean }) {
  const icons = [
    { emoji: "\u{1F3BE}", x: "8%", y: "18%", delay: 0, size: 56 },
    { emoji: "\u{1F3D3}", x: "82%", y: "12%", delay: 0.5, size: 64 },
    { emoji: "\u{1F94A}", x: "72%", y: "68%", delay: 1, size: 48 },
    { emoji: "\u26BD", x: "12%", y: "72%", delay: 1.5, size: 56 },
    { emoji: "\u{1F3C0}", x: "88%", y: "42%", delay: 0.3, size: 48 },
    { emoji: "\u{1F9D8}", x: "4%", y: "45%", delay: 0.8, size: 60 },
    { emoji: "\u{1F3CA}", x: "55%", y: "82%", delay: 1.2, size: 48 },
    { emoji: "\u{1F3CB}", x: "38%", y: "8%", delay: 0.6, size: 52 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((icon, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-2xl flex items-center justify-center ${
            dark
              ? "bg-white/[0.04] border border-white/[0.06]"
              : "bg-background/[0.04] border border-foreground/[0.06]"
          }`}
          style={{
            left: icon.x,
            top: icon.y,
            width: icon.size,
            height: icon.size,
          }}
          animate={{ y: [0, -14, 0] }}
          transition={{
            duration: 5 + i * 0.5,
            repeat: Infinity,
            delay: icon.delay,
            ease: "easeInOut",
          }}
        >
          <span className="text-2xl">{icon.emoji}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Coach Carousel ─── */

function CoachCarousel({ dark }: { dark: boolean }) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const totalPages = Math.ceil(coaches.length / 3);

  const scroll = useCallback(
    (dir: "left" | "right") => {
      if (!scrollRef.current) return;
      const cardWidth = scrollRef.current.scrollWidth / coaches.length;
      const scrollAmount = cardWidth * 3;
      if (dir === "left") {
        scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    },
    []
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const cardWidth = el.scrollWidth / coaches.length;
      const page = Math.round(el.scrollLeft / (cardWidth * 3));
      setActiveIdx(Math.min(page, totalPages - 1));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [totalPages]);

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className={`absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          dark
            ? "bg-card border border-border text-foreground hover:bg-secondary"
            : "bg-white border border-gray-200 text-foreground hover:bg-gray-50 shadow-sm"
        }`}
        aria-label="Previous coaches"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => scroll("right")}
        className={`absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          dark
            ? "bg-card border border-border text-foreground hover:bg-secondary"
            : "bg-white border border-gray-200 text-foreground hover:bg-gray-50 shadow-sm"
        }`}
        aria-label="Next coaches"
      >
        <ChevronRight size={20} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto overflow-y-visible hide-scrollbar snap-x snap-mandatory py-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {coaches.map((coach) => (
          <motion.div
            key={coach.name}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`snap-start flex-shrink-0 w-[calc(100%-1rem)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] rounded-2xl border overflow-hidden ${
              dark
                ? "bg-card border-white/5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                : "bg-white border-gray-200 hover:border-primary/40 shadow-sm hover:shadow-lg"
            }`}
          >
            <div
              className={`relative h-48 bg-gradient-to-br ${coach.gradient} flex items-center justify-center overflow-hidden`}
            >
              <span className="text-7xl font-bold text-white/20 select-none">
                {coach.initials}
              </span>
              {/* Sport badge */}
              <div className="absolute top-3 right-3 backdrop-blur-sm bg-black/30 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                {coach.sport}
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`text-lg font-semibold ${
                    dark ? "text-white" : "text-foreground"
                  }`}
                >
                  {coach.name}
                </h3>
                <BadgeCheck className="w-4 h-4 text-primary" />
              </div>

              <div className="flex gap-2 mb-4">
                {coach.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span
                    className={`text-sm font-medium ${
                      dark ? "text-white" : "text-foreground"
                    }`}
                  >
                    {coach.rating}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({coach.reviews} reviews)
                  </span>
                </div>
                <span className="text-sm font-semibold text-primary">
                  From ${coach.price}
                </span>
              </div>

              <button
                onClick={() => navigate("/signup")}
                className="w-full py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold transition-all hover:brightness-110 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
              >
                Book Session
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === activeIdx
                ? "bg-primary w-6"
                : dark
                  ? "bg-white/20"
                  : "bg-gray-300"
            }`}
            onClick={() => {
              if (!scrollRef.current) return;
              const cardWidth =
                scrollRef.current.scrollWidth / coaches.length;
              scrollRef.current.scrollTo({
                left: cardWidth * 3 * i,
                behavior: "smooth",
              });
            }}
            aria-label={`Go to page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── 3D Testimonial Card ─── */

function TestimonialCard3D({ t, dark }: { t: typeof testimonials[0]; dark: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -10;
    const rotateY = ((x - cx) / cx) * 10;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`;
    const shine = card.querySelector<HTMLDivElement>(".card-shine");
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,107,43,0.12) 0%, transparent 65%)`;
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    const shine = card.querySelector<HTMLDivElement>(".card-shine");
    if (shine) shine.style.background = "transparent";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="snap-start flex-shrink-0 w-[calc(100%-2rem)] sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] relative cursor-default"
      style={{ transition: "transform 0.15s ease-out", transformStyle: "preserve-3d" }}
    >
      {/* glow border */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/30 via-transparent to-transparent pointer-events-none" />
      {/* card body */}
      <div className={`relative rounded-2xl border overflow-hidden p-6 h-full ${
        dark ? "bg-card/80 border-border backdrop-blur-sm" : "bg-white border-gray-200 shadow-md"
      }`}>
        {/* shine overlay */}
        <div className="card-shine absolute inset-0 rounded-2xl pointer-events-none transition-all duration-200" />

        <div className="flex gap-0.5 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <Quote className="w-6 h-6 mb-4 text-primary/40" />
        <p className={`leading-relaxed mb-6 ${dark ? "text-gray-300" : "text-gray-600"}`}>
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, hsl(18,100%,59%), hsl(5,100%,75%))" }}
          >
            {t.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className={`text-sm font-semibold ${dark ? "text-white" : "text-foreground"}`}>
              {t.name}
            </p>
            <p className="text-xs text-gray-500">{t.role} &middot; {t.sport}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Testimonial Carousel ─── */

function TestimonialScroll({ dark }: { dark: boolean }) {
  return (
    <div className="flex gap-6 overflow-x-auto overflow-y-visible hide-scrollbar snap-x snap-mandatory py-4 -mx-6 px-6" style={{ WebkitOverflowScrolling: "touch" }}>
      {testimonials.map((t) => (
        <TestimonialCard3D key={t.name} t={t} dark={dark} />
      ))}
    </div>
  );
}

/* ─── Main Landing Page ─── */

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = false;

  // Safety: if GSAP ScrollTrigger pinning leaves body styles dirty on unmount, reset them.
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, []);

  const bg = "bg-background";
  const textPrimary = "text-foreground";
  const textSecondary = "text-foreground/70";
  const textMuted = "text-muted-foreground";
  const sectionAlt = "bg-card/50";
  const hoverText = "hover:text-foreground";

  return (
    <div
      dir="ltr"
      className={`min-h-[100dvh] ${bg} text-foreground/80 overflow-x-hidden transition-colors duration-300 scroll-smooth relative`}
    >
      {/* ── NAV ── */}
      <nav
        className="sticky top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 bg-card/95 border-border/40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <CircloLogo variant="full" size="md" theme="auto" />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className={`text-sm ${textSecondary} ${hoverText} transition-colors`}
            >
              How It Works
            </a>
            <a
              href="#coaches"
              className={`text-sm ${textSecondary} ${hoverText} transition-colors`}
            >
              Coaches
            </a>
            <a
              href="#sports"
              className={`text-sm ${textSecondary} ${hoverText} transition-colors`}
            >
              Sports
            </a>
            <a
              href="#for-coaches"
              className={`text-sm ${textSecondary} ${hoverText} transition-colors`}
            >
              For Coaches
            </a>

            <button
              onClick={() => navigate("/login")}
              className={`text-sm font-semibold ${textSecondary} ${hoverText} transition-colors`}
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 px-5 py-2 rounded-xl transition-all active:scale-95"
            >
              Sign Up Free
            </button>
          </div>

          {/* Mobile: hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <button
              className={textPrimary}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden backdrop-blur-xl border-b px-6 pb-6 flex flex-col gap-4 bg-card/95 border-border/40"
          >
            {[
              { label: "How It Works", href: "#how-it-works" },
              { label: "Coaches", href: "#coaches" },
              { label: "Sports", href: "#sports" },
              { label: "For Coaches", href: "#for-coaches" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`${textSecondary} ${hoverText} transition-colors`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => { setMobileOpen(false); navigate("/login"); }}
              className={`text-left ${textSecondary} ${hoverText} transition-colors`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMobileOpen(false); navigate("/signup"); }}
              className="text-left text-primary font-medium"
            >
              Sign Up Free
            </button>
          </motion.div>
        )}
      </nav>

      {/* ── CINEMATIC HERO ── */}
      <CinematicHero
        onFindCoach={() => navigate("/signup")}
        onJoinAsCoach={() => navigate("/signup")}
      />

      {/* ── SOCIAL PROOF BAR ── */}
      <Section
        className={`border-y transition-colors duration-300 ${
          dark ? "border-white/5 bg-background" : "border-gray-200 bg-white"
        }`}
      >
        {/* Brand accent line */}
        <div className="h-[3px] bg-brand-gradient" />
        <div className="py-14 max-w-6xl mx-auto px-6">
          <p className={`text-center text-[11px] font-semibold uppercase tracking-widest mb-10 ${dark ? "text-white/30" : "text-gray-400"}`}>
            Trusted by athletes &amp; coaches worldwide
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center sm:divide-x sm:divide-white/10">
            {[
              { value: 500, suffix: "+", label: "Sessions Booked" },
              { value: 12, suffix: "+", label: "Sports Available" },
              { value: 90, suffix: "%", label: "Coaches Keep" },
            ].map((stat) => (
              <div key={stat.label} className="text-center px-10 sm:px-16 py-4">
                <p className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-none">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className={`text-sm mt-3 font-medium ${textMuted}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PRESS MENTIONS ── */}
      <Section className="py-12 sm:py-16">
        <PressMentions />
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section id="how-it-works" className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary">
              <Zap className="w-3.5 h-3.5" /> How It Works
            </span>
            <h2 className={`mt-4 text-3xl sm:text-4xl font-bold ${textPrimary}`}>
              Three steps to your first session
            </h2>
            <p className={`mt-4 max-w-md mx-auto text-sm ${textSecondary}`}>
              From discovery to your first training session — we make it simple.
            </p>
          </div>

          <Stagger className="grid md:grid-cols-3 gap-8" stagger={0.15}>
            {[
              {
                icon: <Search className="w-6 h-6" />,
                step: "01",
                title: "Discover",
                desc: "Browse verified coaches by sport, location, and rating. Every coach is real, reviewed, and ready.",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                step: "02",
                title: "Book",
                desc: "Pick a time that works for you. Instant confirmation — no back-and-forth, no waiting.",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                step: "03",
                title: "Train",
                desc: "Show up, work hard, and level up. Track your progress and build momentum every session.",
              },
            ].map((item) => (
              <StaggerChild key={item.step}>
                <div
                  className={`group relative p-8 rounded-2xl border transition-all duration-300 overflow-hidden ${
                    dark
                      ? "bg-card/50 border-white/5 hover:border-primary/30"
                      : "bg-white border-gray-200 hover:border-primary/40 shadow-sm"
                  }`}
                >
                  {/* Ghost step number */}
                  <span className="absolute top-4 right-5 text-8xl font-black bg-gradient-to-b from-primary/10 to-transparent bg-clip-text text-transparent select-none leading-none pointer-events-none">
                    {item.step}
                  </span>
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gradient text-white mb-6 shadow-lg shadow-primary/20">
                      {item.icon}
                    </div>
                    <h3 className={`text-xl font-bold mb-3 ${textPrimary}`}>
                      {item.title}
                    </h3>
                    <p className={`${textSecondary} leading-relaxed`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </Section>

      {/* ── INSIDE THE CIRCLE (community visual) ── */}
      <InsideTheCircle dark={dark} />

      {/* ── FEATURED COACHES CAROUSEL ── */}
      <Section id="coaches" className={`py-20 sm:py-28 lg:py-32 ${sectionAlt}`}>
        <div className="max-w-6xl mx-auto px-6 sm:px-12">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary">
              <Star className="w-3.5 h-3.5 fill-primary" /> Top Rated
            </span>
            <h2 className={`mt-4 text-3xl sm:text-4xl font-bold ${textPrimary}`}>
              Meet your next coach
            </h2>
            <p className={`mt-4 max-w-md mx-auto text-sm ${textSecondary}`}>
              Every coach is verified, reviewed by real athletes, and ready to help you level up.
            </p>
          </div>

          <CoachCarousel dark={dark} />
        </div>
      </Section>

      {/* ── SPORTS GRID ── */}
      <Section id="sports" className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary">
              🏅 12 Sports
            </span>
            <h2 className={`mt-4 text-3xl sm:text-4xl font-bold ${textPrimary}`}>
              Whatever your sport, we've got your coach
            </h2>
            <p className={`mt-4 max-w-sm mx-auto text-sm ${textSecondary}`}>
              From padel courts to boxing gyms — find expert coaching in any discipline.
            </p>
          </div>

          <Stagger
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            stagger={0.06}
          >
            {sports.map((sport) => (
              <StaggerChild key={sport.name}>
                <button
                  className={`group relative w-full text-left p-5 rounded-2xl border transition-all duration-300 overflow-hidden min-h-[80px] ${
                    dark
                      ? "bg-card/50 border-white/5 hover:border-primary/30"
                      : "bg-white border-gray-200 hover:border-primary/30 shadow-sm"
                  }`}
                >
                  {/* Brand hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                  <div className="relative z-10">
                    <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform duration-200 origin-left">
                      {sport.emoji}
                    </span>
                    <h3 className={`text-sm font-semibold mb-1 break-words ${textPrimary}`}>
                      {sport.name}
                    </h3>
                    <p className="text-xs text-gray-500 group-hover:text-primary transition-colors">
                      Browse coaches{" "}
                      <ChevronRight className="inline w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </div>
                </button>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </Section>

      {/* ── COACH BENEFITS SPLIT ── */}
      <Section id="for-coaches" className={`py-20 sm:py-28 lg:py-32 ${sectionAlt}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div
              className={`p-8 sm:p-10 rounded-2xl border ${
                dark
                  ? "bg-card border-white/5"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <span className="text-xs font-medium tracking-wider uppercase text-primary">
                For Coaches
              </span>
              <h2
                className={`mt-4 text-3xl sm:text-4xl font-bold mb-6 ${textPrimary}`}
              >
                Grow your coaching business
              </h2>
              <p className={`${textSecondary} mb-10 leading-relaxed`}>
                Build your coaching brand on Circlo. We
                handle the bookings, payments, and scheduling so you can focus
                on what you do best.
              </p>

              <Stagger className="space-y-5" stagger={0.12}>
                {[
                  "Set your own rates \u2014 keep 90% of every session",
                  "Manage your schedule with calendar sync",
                  "Get discovered by athletes in your area",
                  "Build your reputation with verified reviews",
                  "Access analytics and growth insights",
                ].map((benefit) => (
                  <StaggerChild key={benefit}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                        <Check size={14} />
                      </div>
                      <p className={`${textSecondary}`}>{benefit}</p>
                    </div>
                  </StaggerChild>
                ))}
              </Stagger>

              <button
                onClick={() => navigate("/signup")}
                className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                Start Coaching
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Coach earnings dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className={`rounded-2xl border p-8 ${dark ? "bg-card border-white/5" : "bg-white border-gray-200 shadow-sm"}`}>
                {/* Revenue header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${textMuted}`}>Monthly Revenue</p>
                    <p className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">$3,240</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
                    📈
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label: "Active Clients", value: "14", icon: "👥" },
                    { label: "Sessions / Month", value: "28", icon: "📅" },
                    { label: "Avg Rating", value: "4.9 ★", icon: "⭐" },
                    { label: "Total Earned", value: "$18.4k", icon: "💰" },
                  ].map((stat) => (
                    <div key={stat.label} className={`p-4 rounded-xl ${dark ? "bg-secondary/50" : "bg-gray-50"}`}>
                      <p className="text-lg mb-1">{stat.icon}</p>
                      <p className={`text-lg font-bold ${textPrimary}`}>{stat.value}</p>
                      <p className={`text-xs ${textMuted}`}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Upcoming sessions */}
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${textMuted}`}>Upcoming Sessions</p>
                  {[
                    { initials: "AR", name: "Alex Rivera", sport: "Padel", time: "Today, 10:00 AM" },
                    { initials: "PP", name: "Priya Patel", sport: "CrossFit", time: "Tomorrow, 7:30 AM" },
                    { initials: "JC", name: "James Chen", sport: "Tennis", time: "Fri, 5:00 PM" },
                  ].map((session) => (
                    <div key={session.name} className={`flex items-center gap-3 py-3 border-b last:border-0 ${dark ? "border-white/5" : "border-gray-100"}`}>
                      <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {session.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${textPrimary}`}>{session.name}</p>
                        <p className={`text-xs ${textMuted}`}>{session.sport}</p>
                      </div>
                      <p className={`text-xs ${textMuted} flex-shrink-0`}>{session.time}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/5 blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <Section className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary">
              <Star className="w-3.5 h-3.5 fill-primary" /> Real Stories
            </span>
            <h2 className={`mt-4 text-3xl sm:text-4xl font-bold ${textPrimary}`}>
              Athletes and coaches love Circlo
            </h2>
            <p className={`mt-4 max-w-sm mx-auto text-sm ${textSecondary}`}>
              Real results, real people — from first session to tournament wins.
            </p>
          </div>

          <TestimonialScroll dark={dark} />
        </div>
      </Section>

      {/* ── TRUST BADGES ── */}
      <Section className="pb-8 sm:pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <TrustBadges />
        </div>
      </Section>

      {/* ── CTA GRADIENT BANNER ── */}
      <Section id="get-started" className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-12 sm:p-16 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Join the circle</p>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
                Your next great session<br />starts here.
              </h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                Whether you're an athlete hungry for progress or a coach ready to grow your business &mdash; getting started costs nothing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/signup")}
                  className="group px-10 py-5 bg-white text-foreground font-bold text-lg rounded-2xl hover:shadow-lg hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
                >
                  Find a Coach
                  <ChevronRight
                    size={20}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-10 py-5 bg-white/20 text-white font-bold text-lg rounded-2xl hover:bg-white/30 transition-all duration-300 backdrop-blur-sm inline-flex items-center justify-center"
                >
                  Join as a Coach
                </button>
              </div>
              <p className="mt-4 text-xs text-white/60">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer
        className={`border-t py-16 transition-colors duration-300 ${
          dark ? "border-white/5" : "border-gray-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-1">
              <CircloLogo variant="full" size="md" theme={dark ? "dark" : "light"} />
              <p className={`mt-3 text-sm ${textMuted} leading-relaxed`}>
                The sports coaching marketplace.
                <br />
                Find your circle.
              </p>
            </div>

            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-4 ${textMuted}`}
              >
                Company
              </p>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className={`text-sm ${textSecondary} ${hoverText} transition-colors`}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-4 ${textMuted}`}
              >
                Community
              </p>
              <ul className="space-y-3">
                {["Find a Coach", "Become a Coach", "Sports", "Events"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className={`text-sm ${textSecondary} ${hoverText} transition-colors`}
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-4 ${textMuted}`}
              >
                Resources
              </p>
              <ul className="space-y-3">
                {["Help Center", "Pricing", "API", "Status"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className={`text-sm ${textSecondary} ${hoverText} transition-colors`}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-4 ${textMuted}`}
              >
                Contact
              </p>
              <ul className="space-y-3">
                {["Privacy", "Terms", "Cookies", "Support"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className={`text-sm ${textSecondary} ${hoverText} transition-colors`}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t ${
              dark ? "border-white/5" : "border-gray-200"
            }`}
          >
            <p className={`text-xs ${textMuted}`}>
              &copy; Circlo 2026. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: <AtSign size={18} />, label: "Social" },
                { icon: <Hash size={18} />, label: "Community" },
                { icon: <Globe size={18} />, label: "Website" },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  className={`${textMuted} ${hoverText} transition-colors`}
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
