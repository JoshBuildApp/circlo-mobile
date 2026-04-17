import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Crown, Sparkles, BarChart3, Zap, Upload, Bot,
  TrendingUp, Calendar, CheckCircle2, Star, Shield, Flame, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const PricingSection = lazy(() =>
  import("@/components/ui/pricing2").then((m) => ({ default: m.Pricing2 }))
);

const FEATURES = [
  {
    icon: Bot,
    title: "Unlimited Bob AI",
    desc: "Get unlimited smart recommendations, scheduling tips, and pricing insights powered by AI.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Weekly Reports",
    desc: "Auto-generated performance reports with sessions, revenue, growth trends, and next steps.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: TrendingUp,
    title: "Advanced Analytics",
    desc: "Revenue breakdowns, performance per training type, client retention trends, and hour-by-hour analytics.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Flame,
    title: "Discover Boost",
    desc: "Get ranked higher in Discover. Your profile and content appear first to potential clients.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Upload,
    title: "Unlimited Content",
    desc: "Upload unlimited videos and photos. Higher quality uploads with no size restrictions.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Shield,
    title: "PRO Badge",
    desc: "Stand out with a verified PRO badge on your profile, content, and in search results.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const CircloPro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activating, setActivating] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  const handleActivatePro = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setActivating(true);
    try {
      const { data: profile } = await supabase
        .from("coach_profiles")
        .select("id, is_pro")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        toast.error("Create a coach profile first");
        navigate("/coach-dashboard");
        return;
      }

      if (profile.is_pro) {
        toast.info("You're already a Pro member!");
        navigate("/coach-dashboard?tab=stats");
        return;
      }

      const { error } = await supabase
        .from("coach_profiles")
        .update({ is_pro: true })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Welcome to CIRCLO Pro! 🎉");
      navigate("/coach-dashboard?tab=stats");
    } catch (err: any) {
      toast.error(err?.message || "Failed to activate Pro");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="relative px-4 pt-4 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-foreground mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-black text-foreground">CIRCLO Pro</h1>
              <p className="text-xs text-muted-foreground">Unlock your full coaching potential</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-[320px]">
            Everything you need to grow your coaching business — AI insights, advanced analytics, and maximum visibility.
          </p>
        </div>
      </div>

      {/* Price card — FREE DURING BETA */}
      <div className="px-4 -mt-2 mb-6">
        <div className="rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              <Sparkles className="h-3 w-3" /> BETA
            </span>
          </div>
          <p className="text-[11px] uppercase tracking-wider text-primary/80 font-bold mb-1">Limited Time</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-heading font-black text-foreground">Free</span>
            <span className="text-sm text-muted-foreground line-through">₪99/month</span>
          </div>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            🎉 <span className="font-semibold text-foreground">100% off for 1 year for all beta users.</span> No credit card required. Lock in early access while we build.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 space-y-3 mb-8">
        <h2 className="text-xs font-heading font-bold text-muted-foreground/50 uppercase tracking-wider">Everything included</h2>
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-border/10 bg-card"
          >
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", f.bg)}>
              <f.icon className={cn("h-5 w-5", f.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-0.5">{f.desc}</p>
            </div>
            <CheckCircle2 className="h-4 w-4 text-primary/40 flex-shrink-0 mt-1" />
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div className="px-4 mb-8">
        <div className="rounded-2xl bg-secondary/30 p-4 border border-border/10">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-3 w-3 text-accent fill-accent" />
            ))}
          </div>
          <p className="text-xs text-foreground/80 italic leading-relaxed">
            "Since going Pro, my bookings increased by 40%. The AI recommendations helped me optimize my schedule and the Discover boost brought in new clients every week."
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-2 font-semibold">— Top-rated coach on CIRCLO</p>
        </div>
      </div>

      {/* See Plans toggle */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setShowPlans(!showPlans)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border/30 bg-secondary/30 text-sm font-semibold text-foreground active:scale-[0.98] transition-all"
        >
          {showPlans ? "Hide Plans" : "See Plans"}
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", showPlans && "rotate-180")} />
        </button>
      </div>

      {/* Pricing section — revealed on click */}
      {showPlans && (
        <Suspense fallback={
          <div className="px-4 space-y-3">
            <Skeleton className="h-5 w-32 mx-auto" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </div>
        }>
          <PricingSection />
        </Suspense>
      )}

      {/* CTA */}
      <div className="px-4 pb-32">
        <button
          onClick={handleActivatePro}
          disabled={activating}
          className="w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-full active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {activating ? "Activating..." : "Activate Pro — Free for Beta 🎉"}
        </button>
        <p className="text-center text-[10px] text-muted-foreground/40 mt-3">
          Free for 1 year during beta · No payment required · By activating you agree to the CIRCLO Pro terms
        </p>
      </div>
    </div>
  );
};

export default CircloPro;
