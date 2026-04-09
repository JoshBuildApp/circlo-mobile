import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import InsideTheCircle from "@/components/InsideTheCircle";
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
  Sun,
  Moon,
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
      {rotatingWords.map((word, i) => (
        <motion.span
          key={word}
          className="absolute left-0 right-0"
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={
            i === index
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: -30, filter: "blur(8px)" }
          }
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      ))}
      {/* Invisible spacer for consistent width */}
      <span className="invisible">Fitness</span>
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
    gradient: "from-teal to-emerald-500",
  },
  {
    name: "Marcus Johnson",
    sport: "Boxing",
    tags: ["Boxing", "Strength"],
    rating: 4.8,
    reviews: 89,
    price: 60,
    initials: "MJ",
    gradient: "from-orange to-red-500",
  },
  {
    name: "Elena Kovacs",
    sport: "Yoga",
    tags: ["Yoga", "Meditation"],
    rating: 5.0,
    reviews: 203,
    price: 35,
    initials: "EK",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "David Park",
    sport: "Tennis",
    tags: ["Tennis", "Advanced"],
    rating: 4.9,
    reviews: 156,
    price: 55,
    initials: "DP",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Aisha Williams",
    sport: "Swimming",
    tags: ["Swimming", "Competitive"],
    rating: 4.7,
    reviews: 94,
    price: 50,
    initials: "AW",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    name: "Carlos Ruiz",
    sport: "Soccer",
    tags: ["Soccer", "Tactics"],
    rating: 4.8,
    reviews: 112,
    price: 40,
    initials: "CR",
    gradient: "from-green-500 to-emerald-600",
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
              : "bg-navy-deep/[0.04] border border-navy-deep/[0.06]"
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
            ? "bg-navy-card border border-white/10 text-white hover:bg-navy-light"
            : "bg-white border border-gray-200 text-navy-deep hover:bg-gray-50 shadow-sm"
        }`}
        aria-label="Previous coaches"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => scroll("right")}
        className={`absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          dark
            ? "bg-navy-card border border-white/10 text-white hover:bg-navy-light"
            : "bg-white border border-gray-200 text-navy-deep hover:bg-gray-50 shadow-sm"
        }`}
        aria-label="Next coaches"
      >
        <ChevronRight size={20} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4"
      >
        {coaches.map((coach) => (
          <motion.div
            key={coach.name}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`snap-start flex-shrink-0 w-[calc(100%-1rem)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] rounded-2xl border overflow-hidden ${
              dark
                ? "bg-navy-card border-white/5 hover:border-teal/20 hover:shadow-lg hover:shadow-teal/5"
                : "bg-white border-gray-200 hover:border-teal/40 shadow-sm hover:shadow-lg"
            }`}
          >
            <div
              className={`h-48 bg-gradient-to-br ${coach.gradient} flex items-center justify-center`}
            >
              <span className="text-5xl font-bold text-white/30">
                {coach.initials}
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`text-lg font-semibold ${
                    dark ? "text-white" : "text-navy-deep"
                  }`}
                >
                  {coach.name}
                </h3>
                <BadgeCheck className="w-4 h-4 text-teal" />
              </div>

              <div className="flex gap-2 mb-3">
                {coach.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      dark
                        ? "bg-teal/10 text-teal"
                        : "bg-teal/10 text-teal-dark"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span
                    className={`text-sm font-medium ${
                      dark ? "text-white" : "text-navy-deep"
                    }`}
                  >
                    {coach.rating}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({coach.reviews})
                  </span>
                </div>
                <span className="text-lg font-semibold text-teal">
                  Starting ${coach.price}
                </span>
              </div>
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
                ? "bg-teal w-6"
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

/* ─── Testimonial Carousel ─── */

function TestimonialScroll({ dark }: { dark: boolean }) {
  return (
    <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4 -mx-6 px-6">
      {testimonials.map((t) => (
        <div
          key={t.name}
          className={`snap-start flex-shrink-0 w-[calc(100%-2rem)] sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] p-6 rounded-2xl border ${
            dark
              ? "bg-navy-card/50 border-white/5"
              : "bg-white border-gray-200 shadow-sm"
          }`}
        >
          <Quote
            className={`w-8 h-8 mb-4 ${
              dark ? "text-teal/20" : "text-teal/30"
            }`}
          />
          <p
            className={`leading-relaxed mb-6 ${
              dark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            &ldquo;{t.quote}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                dark
                  ? "bg-teal/10 text-teal"
                  : "bg-teal/10 text-teal-dark"
              }`}
            >
              {t.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${
                  dark ? "text-white" : "text-navy-deep"
                }`}
              >
                {t.name}
              </p>
              <p className="text-xs text-gray-500">
                {t.role} &middot; {t.sport}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Landing Page ─── */

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(true);

  const bg = dark ? "bg-navy-deep" : "bg-[#F8FAFC]";
  const textPrimary = dark ? "text-white" : "text-navy-deep";
  const textSecondary = dark ? "text-gray-400" : "text-gray-600";
  const textMuted = dark ? "text-gray-500" : "text-gray-400";
  const sectionAlt = dark ? "bg-navy-card/30" : "bg-gray-50";

  return (
    <div
      className={`min-h-screen ${bg} ${
        dark ? "text-gray-300" : "text-gray-700"
      } overflow-x-hidden transition-colors duration-300`}
    >
      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
          dark
            ? "bg-navy-deep/80 border-white/5"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span
            className={`text-2xl font-bold tracking-tight ${textPrimary}`}
          >
            Circlo
            <span className="text-teal">.</span>
          </span>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className={`text-sm ${textSecondary} hover:text-white transition-colors`}
            >
              How It Works
            </a>
            <a
              href="#coaches"
              className={`text-sm ${textSecondary} hover:text-white transition-colors`}
            >
              Coaches
            </a>
            <a
              href="#sports"
              className={`text-sm ${textSecondary} hover:text-white transition-colors`}
            >
              Sports
            </a>
            <a
              href="#for-coaches"
              className={`text-sm ${textSecondary} hover:text-white transition-colors`}
            >
              For Coaches
            </a>

            <button
              onClick={() => setDark(!dark)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                dark
                  ? "bg-white/10 text-yellow-300 hover:bg-white/15"
                  : "bg-navy-deep/10 text-navy-deep hover:bg-navy-deep/15"
              }`}
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => navigate("/login")}
              className={`text-sm font-medium ${textSecondary} hover:text-white transition-colors`}
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="text-sm font-medium text-teal hover:text-teal-dark transition-colors"
            >
              Sign Up Free
            </button>
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setDark(!dark)}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                dark
                  ? "bg-white/10 text-yellow-300"
                  : "bg-navy-deep/10 text-navy-deep"
              }`}
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
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
            className={`md:hidden backdrop-blur-xl border-b px-6 pb-6 flex flex-col gap-4 ${
              dark
                ? "bg-navy-deep/95 border-white/5"
                : "bg-white/95 border-gray-200"
            }`}
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
                className={`${textSecondary} hover:text-white transition-colors`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => { setMobileOpen(false); navigate("/login"); }}
              className={`text-left ${textSecondary} hover:text-white transition-colors`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMobileOpen(false); navigate("/signup"); }}
              className="text-left text-teal font-medium"
            >
              Sign Up Free
            </button>
          </motion.div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full blur-[150px] ${
              dark ? "bg-teal/[0.08]" : "bg-teal/5"
            }`}
          />
          <div
            className={`absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] ${
              dark ? "bg-orange/5" : "bg-orange/[0.03]"
            }`}
          />
        </div>

        <FloatingIcons dark={dark} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className={`inline-block px-4 py-1.5 mb-8 text-xs font-medium tracking-wider uppercase border rounded-full ${
                dark
                  ? "text-teal border-teal/20 bg-teal/5"
                  : "text-teal-dark border-teal/30 bg-teal/10"
              }`}
            >
              The sports coaching marketplace
            </span>
          </motion.div>

          <motion.h1
            tabIndex={-1}
            className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight uppercase ${textPrimary}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            Your{" "}
            <span className="bg-gradient-to-r from-teal to-emerald-400 bg-clip-text text-transparent">
              <RotatingText />
            </span>
            <br />
            Coach Awaits
          </motion.h1>

          <motion.p
            className={`mt-6 text-lg sm:text-xl max-w-2xl mx-auto ${textSecondary}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            Connect with top sports coaches near you. Book sessions, track your
            progress, and join a community of athletes who push each other to be
            better.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <button
              onClick={() => navigate("/signup")}
              className="group px-8 py-4 bg-teal text-navy-deep font-semibold rounded-xl hover:bg-teal-dark transition-all shadow-lg shadow-teal/20 flex items-center justify-center gap-2"
            >
              Find a Coach
              <ChevronRight
                size={18}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-4 bg-orange text-white font-semibold rounded-xl hover:bg-orange-dark transition-all shadow-lg shadow-orange/20 flex items-center justify-center gap-2"
            >
              Join as a Coach
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div
            className={`w-6 h-10 border-2 rounded-full flex justify-center pt-2 ${
              dark ? "border-white/20" : "border-navy-deep/20"
            }`}
          >
            <div className="w-1 h-2 bg-teal rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <Section
        className={`py-16 border-y transition-colors duration-300 ${
          dark ? "border-white/5 bg-navy-deep" : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12">
            {[
              { value: 12, suffix: "", label: "Sports Available" },
              { value: 24, suffix: "/7", label: "Booking Available" },
              { value: 100, suffix: "%", label: "Free to Start" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className={`text-2xl sm:text-3xl font-extrabold ${textPrimary}`}
                >
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className={`text-sm mt-1 ${textMuted}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section id="how-it-works" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-medium tracking-wider uppercase text-teal">
              How It Works
            </span>
            <h2 className={`mt-4 text-3xl sm:text-4xl font-bold ${textPrimary}`}>
              Three steps to your first session
            </h2>
          </div>

          <Stagger className="grid md:grid-cols-3 gap-8" stagger={0.15}>
            {[
              {
                icon: <Search className="w-6 h-6" />,
                step: "01",
                title: "Discover",
                desc: "Browse verified coaches by sport, location, and rating. Read reviews from real athletes.",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                step: "02",
                title: "Book",
                desc: "Pick a time that works for you. Instant confirmation, no back-and-forth messaging.",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                step: "03",
                title: "Train",
                desc: "Show up, train hard, and leave a review. Track your progress over time.",
              },
            ].map((item) => (
              <StaggerChild key={item.step}>
                <div
                  className={`group relative p-8 rounded-2xl border transition-all duration-300 ${
                    dark
                      ? "bg-navy-card/50 border-white/5 hover:border-teal/20"
                      : "bg-white border-gray-200 hover:border-teal/40 shadow-sm"
                  }`}
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal/10 text-teal mb-6 text-xl font-bold">
                    {item.step}
                  </div>
                  <h3
                    className={`text-xl font-semibold mb-3 ${textPrimary}`}
                  >
                    {item.title}
                  </h3>
                  <p className={`${textSecondary} leading-relaxed`}>
                    {item.desc}
                  </p>
                </div>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </Section>

      {/* ── INSIDE THE CIRCLE (community visual) ── */}
      <InsideTheCircle dark={dark} />

      {/* ── FEATURED COACHES CAROUSEL ── */}
      <Section id="coaches" className={`py-24 sm:py-32 ${sectionAlt}`}>
        <div className="max-w-6xl mx-auto px-6 sm:px-12">
          <div className="text-center mb-16">
            <span className="text-xs font-medium tracking-wider uppercase text-teal">
              Top Rated
            </span>
            <h2 className={`mt-4 text-3xl sm:text-4xl font-bold ${textPrimary}`}>
              Featured Coaches
            </h2>
          </div>

          <CoachCarousel dark={dark} />
        </div>
      </Section>

      {/* ── SPORTS GRID ── */}
      <Section id="sports" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-medium tracking-wider uppercase text-teal">
              12 Sports
            </span>
            <h2 className={`mt-4 text-3xl sm:text-4xl font-bold ${textPrimary}`}>
              Find your sport
            </h2>
          </div>

          <Stagger
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            stagger={0.06}
          >
            {sports.map((sport) => (
              <StaggerChild key={sport.name}>
                <button
                  className={`group w-full text-left p-5 rounded-2xl border transition-all duration-300 ${
                    dark
                      ? "bg-navy-card/50 border-white/5 hover:border-teal/30 hover:bg-navy-card"
                      : "bg-white border-gray-200 hover:border-teal/40 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  <span className="text-3xl block mb-3">{sport.emoji}</span>
                  <h3
                    className={`text-sm font-semibold mb-1 ${textPrimary}`}
                  >
                    {sport.name}
                  </h3>
                  <p className="text-xs text-gray-500 group-hover:text-teal transition-colors">
                    Browse coaches{" "}
                    <ChevronRight className="inline w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                </button>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </Section>

      {/* ── COACH BENEFITS SPLIT ── */}
      <Section id="for-coaches" className={`py-24 sm:py-32 ${sectionAlt}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div
              className={`p-8 sm:p-10 rounded-2xl border ${
                dark
                  ? "bg-navy-card border-white/5"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <span className="text-xs font-medium tracking-wider uppercase text-orange">
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
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal/10 text-teal flex items-center justify-center mt-0.5">
                        <Check size={14} />
                      </div>
                      <p className={`${textSecondary}`}>{benefit}</p>
                    </div>
                  </StaggerChild>
                ))}
              </Stagger>

              <button
                onClick={() => navigate("/signup")}
                className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-orange text-white font-semibold rounded-xl hover:bg-orange-dark transition-all shadow-lg shadow-orange/20"
              >
                Start Coaching
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="relative hidden lg:block">
              <div
                className={`aspect-[4/5] rounded-2xl overflow-hidden ${
                  dark ? "bg-navy-light" : "bg-gray-200"
                }`}
              >
                <div className="w-full h-full bg-gradient-to-br from-teal/20 to-orange/20 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-8xl block mb-4">{"\u{1F3CB}"}</span>
                    <p
                      className={`text-lg font-semibold ${textPrimary}`}
                    >
                      Coach on Circlo
                    </p>
                    <p className={`text-sm mt-1 ${textMuted}`}>
                      Start coaching today
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-orange/5 to-teal/5 blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <Section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-medium tracking-wider uppercase text-teal">
              Testimonials
            </span>
            <h2 className={`mt-4 text-3xl sm:text-4xl font-bold ${textPrimary}`}>
              Loved by athletes and coaches
            </h2>
          </div>

          <TestimonialScroll dark={dark} />
        </div>
      </Section>

      {/* ── CTA GRADIENT BANNER ── */}
      <Section id="get-started" className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal to-orange p-12 sm:p-16 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white uppercase mb-6">
                Get Started Now
              </h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                Whether you're an athlete looking for your next coach or a coach
                ready to grow &mdash; getting started costs nothing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/signup")}
                  className="group px-10 py-5 bg-white text-navy-deep font-bold text-lg rounded-2xl hover:shadow-lg hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-1">
              <span
                className={`text-2xl font-bold tracking-tight ${textPrimary}`}
              >
                circlo<span className="text-teal">.</span>
              </span>
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
                      className={`text-sm ${textSecondary} hover:text-white transition-colors`}
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
                        className={`text-sm ${textSecondary} hover:text-white transition-colors`}
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
                      className={`text-sm ${textSecondary} hover:text-white transition-colors`}
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
                      className={`text-sm ${textSecondary} hover:text-white transition-colors`}
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
                  className={`${textMuted} hover:text-white transition-colors`}
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
