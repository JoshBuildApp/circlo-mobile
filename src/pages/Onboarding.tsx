import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SportsSelection } from "@/components/onboarding/SportsSelection";
import { LocationStep } from "@/components/onboarding/LocationStep";
import { RoleStep } from "@/components/onboarding/RoleStep";
import { FollowCoachesStep } from "@/components/onboarding/FollowCoachesStep";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const TOTAL_STEPS = 4;

const STEP_LABELS = [
  "Interests",
  "Location",
  "Role",
  "Follow Coaches",
];

const STORAGE_KEY = "circlo_onboarding_progress";

// ─── Completion Celebration Screen ────────────────────────────────────────
function CompletionScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at top right, rgba(70,241,197,0.35) 0%, transparent 45%), radial-gradient(circle at bottom left, rgba(205,72,2,0.35) 0%, transparent 45%), hsl(var(--background))",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-6 text-center px-8">
        <div className="relative flex items-center justify-center w-32 h-32">
          <motion.div
            className="absolute inset-0 rounded-full bg-[#46f1c5]/20"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.15, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          />
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="#46f1c5" strokeWidth="5" opacity="0.25" />
            <motion.path
              d="M22 40 L35 53 L58 27"
              stroke="#46f1c5"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.55, ease: "easeInOut" }}
            />
          </svg>
        </div>

        <motion.h1
          className="text-4xl font-black italic tracking-widest uppercase text-[#46f1c5]"
          style={{ textShadow: "0 0 24px rgba(70,241,197,0.5)" }}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          You're in!
        </motion.h1>

        <motion.p
          className="text-foreground/70 text-sm tracking-[0.2em] uppercase"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          Taking you to Circlo...
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          <Loader2 className="w-5 h-5 animate-spin text-[#46f1c5]" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<"user" | "coach" | null>(null);
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  // ── Restore saved progress ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step) setCurrentStep(parsed.step);
        if (parsed.answers?.sports) setSelectedSports(parsed.answers.sports);
        if (parsed.answers?.location) setLocation(parsed.answers.location);
        if (parsed.answers?.role) setRole(parsed.answers.role);
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  // ── Persist progress on every change ───────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step: currentStep,
          answers: { sports: selectedSports, location, role },
        })
      );
    } catch {
      // ignore
    }
  }, [currentStep, selectedSports, location, role]);

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step: currentStep,
          answers: { sports: selectedSports, location, role },
        })
      );
    } catch {
      // ignore
    }
    navigate("/home", { replace: true });
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const profileUpdate: Record<string, unknown> = {
        interests: selectedSports,
        location: location.trim(),
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      if (role) {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingRole) {
          await supabase.from("user_roles").update({ role }).eq("user_id", user.id);
        } else {
          await supabase.from("user_roles").insert({ user_id: user.id, role });
        }

        if (role === "coach") {
          const { data: existingCoach } = await supabase
            .from("coach_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!existingCoach) {
            await supabase.from("coach_profiles").insert({
              user_id: user.id,
              coach_name: user.user_metadata?.username || "New Coach",
              sport: selectedSports[0] || "Multi-Sport",
            });
          }
        }
      }

      if (selectedCoachIds.length > 0) {
        const follows = selectedCoachIds.map((coachId) => ({
          user_id: user.id,
          coach_id: coachId,
        }));
        await supabase
          .from("user_follows")
          .upsert(follows, { onConflict: "user_id,coach_id" });
      }

      await refreshProfile();
      localStorage.removeItem(STORAGE_KEY);

      setShowComplete(true);
      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to save your preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedSports.length > 0;
      case 2: return location.trim().length > 0;
      case 3: return role !== null;
      case 4: return selectedCoachIds.length >= 3;
      default: return false;
    }
  };

  if (showComplete) {
    return <CompletionScreen />;
  }

  const stepVariants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  };

  const progressPct = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center overflow-hidden app-top-nav app-bottom-nav"
      style={{
        background:
          "radial-gradient(circle at top right, rgba(70,241,197,0.35) 0%, transparent 45%), radial-gradient(circle at bottom left, rgba(205,72,2,0.35) 0%, transparent 45%), hsl(var(--background))",
      }}
    >
      {/* Background glow decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#46f1c5]/20 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#cd4802]/20 blur-[100px]" />
      </div>

      {/* Orbital logo + title header */}
      <div className="relative z-10 w-full max-w-xl px-6 pt-12 pb-6 flex flex-col items-center">
        <div className="relative inline-block mb-8">
          <div className="absolute -inset-8 rounded-full border border-[#46f1c5]/20" />
          <div className="absolute -inset-14 rounded-full border border-[#ffb59a]/10" />
          <h1
            className="relative font-black italic tracking-[0.2em] text-4xl uppercase text-[#46f1c5]"
            style={{ textShadow: "0 0 20px rgba(70,241,197,0.45)" }}
          >
            CIRCLO
          </h1>
        </div>

        <p className="text-[10px] font-label tracking-[0.3em] uppercase text-muted-foreground mb-1">
          Step {currentStep} of {TOTAL_STEPS}
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#46f1c5] mb-1">
          {STEP_LABELS[currentStep - 1]}
        </p>
        <h2 className="text-lg font-bold text-foreground">Find your circle</h2>
      </div>

      {/* Step content — glass panel */}
      <div className="relative z-10 w-full max-w-xl flex-1 px-4 pb-6">
        <div className="rounded-[2rem] border border-border/60 bg-card/70 backdrop-blur-2xl p-5 md:p-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {currentStep === 1 && (
                <SportsSelection
                  selectedSports={selectedSports}
                  onSelectionChange={setSelectedSports}
                />
              )}
              {currentStep === 2 && (
                <LocationStep
                  location={location}
                  onLocationChange={setLocation}
                />
              )}
              {currentStep === 3 && (
                <RoleStep role={role} onRoleChange={setRole} />
              )}
              {currentStep === 4 && (
                <FollowCoachesStep
                  selectedCoachIds={selectedCoachIds}
                  onSelectionChange={setSelectedCoachIds}
                  interests={selectedSports}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer: action buttons + progress bar */}
      <div className="relative z-10 w-full max-w-xl px-6 pb-10 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
            className="h-11 w-11 rounded-full border border-border/60 text-muted-foreground flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="flex-1 h-14 rounded-lg bg-foreground text-background font-black uppercase tracking-[0.2em] text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-40 disabled:shadow-none"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : currentStep === TOTAL_STEPS ? (
              "Complete setup"
            ) : (
              <span className="inline-flex items-center gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>

        {currentStep < TOTAL_STEPS && (
          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full text-[11px] font-label tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            Skip for now →
          </button>
        )}

        <p className="text-[10px] text-center font-label text-muted-foreground/80 tracking-[0.3em] uppercase">
          Connect • Compete • Conquer
        </p>

        <div className="flex justify-center">
          <div className="w-16 h-1 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-kinetic transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
