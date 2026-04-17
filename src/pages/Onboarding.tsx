import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CircloLogo from "@/components/CircloLogo";
import { SportsSelection } from "@/components/onboarding/SportsSelection";
import { LocationStep } from "@/components/onboarding/LocationStep";
import { RoleStep } from "@/components/onboarding/RoleStep";
import { FollowCoachesStep } from "@/components/onboarding/FollowCoachesStep";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const TOTAL_STEPS = 4;

const STEP_LABELS = [
  "Interests",
  "Location",
  "Role",
  "Follow Coaches",
];

const STORAGE_KEY = "circlo_onboarding_progress";

// ─── Animated Progress Ring ────────────────────────────────────────────────
function ProgressRing({ step, total }: { step: number; total: number }) {
  const size = 88;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = step / total;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease-in-out" }}
        />
      </svg>
      {/* Step counter */}
      <span className="absolute text-sm font-bold text-foreground rotate-0 select-none">
        {step} / {total}
      </span>
    </div>
  );
}

// ─── Completion Celebration Screen ────────────────────────────────────────
function CompletionScreen() {
  const checkLength = 120;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-6 text-center px-8">
        {/* Animated checkmark SVG */}
        <div className="relative flex items-center justify-center w-32 h-32">
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.15, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          />
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="hsl(var(--primary))" strokeWidth="5" opacity="0.25" />
            <motion.path
              d="M22 40 L35 53 L58 27"
              stroke="hsl(var(--primary))"
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

        {/* Heading */}
        <motion.h1
          className="text-3xl font-bold text-primary"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          You're in! 🎉
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-muted-foreground text-base"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          Taking you to Circlo...
        </motion.p>

        {/* Spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
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
    // Save partial progress then go home
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
      // 1. Update profile
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

      // 2. Assign role
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

      // 3. Follow selected coaches
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

      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);

      // Show celebration, then navigate
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header with animated progress ring */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <CircloLogo className="mb-1" />
          <ProgressRing step={currentStep} total={TOTAL_STEPS} />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {STEP_LABELS[currentStep - 1]}
            </p>
            <h1 className="text-xl font-bold text-foreground mt-0.5">
              Welcome to Circlo!
            </h1>
            <p className="text-sm text-muted-foreground">
              Let's personalise your experience
            </p>
          </div>
        </div>

        {/* Step content with slide transitions */}
        <Card className="border-0 shadow-lg bg-card overflow-hidden">
          <CardContent className="p-6">
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
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
          >
            Back
          </Button>

          <div className="flex items-center gap-3">
            {/* Skip link — every step except last */}
            {currentStep < TOTAL_STEPS && (
              <button
                onClick={handleSkip}
                disabled={isLoading}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                Skip for now →
              </button>
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="min-w-[130px] bg-primary hover:brightness-110 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : currentStep === TOTAL_STEPS ? (
                "Complete Setup"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
