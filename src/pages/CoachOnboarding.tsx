import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import CircloLogo from "@/components/CircloLogo";
import { ProfileSetup, ProfileData } from "@/components/coach-onboarding/ProfileSetup";
import { AvailabilitySetup, DaySlot } from "@/components/coach-onboarding/AvailabilitySetup";
import { FirstServiceSetup, ServiceData } from "@/components/coach-onboarding/FirstServiceSetup";
import { AnimatePresence, motion } from "framer-motion";

const TOTAL_STEPS = 3;
const STEP_LABELS = ["Profile", "Availability", "First Service"];
const COACH_STORAGE_KEY = "circlo_coach_onboarding_progress";

// ─── Animated Progress Ring ────────────────────────────────────────────────
function ProgressRing({ step, total }: { step: number; total: number }) {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (step / total) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
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
      <span className="absolute text-xs font-bold text-foreground select-none">
        {step} / {total}
      </span>
    </div>
  );
}

// ─── Completion Celebration Screen ────────────────────────────────────────
function CompletionScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-6 text-center px-8">
        <div className="relative flex items-center justify-center w-32 h-32">
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

        <motion.h1
          className="text-3xl font-bold text-primary"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          You're in! 🎉
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-base"
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
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function CoachOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null);

  // Step 1 data
  const [profileData, setProfileData] = useState<ProfileData>({
    image_url: "",
    tagline: "",
    location: "",
    years_experience: null,
    price: null,
    session_duration: 60,
    bio: "",
    insurance_doc_url: "",
    insurance_expiry_date: "",
  });

  // Step 2 data
  const [availabilitySlots, setAvailabilitySlots] = useState<DaySlot[]>([]);
  const [bufferMinutes, setBufferMinutes] = useState(0);

  // Step 3 data
  const [serviceData, setServiceData] = useState<ServiceData>({
    name: "",
    description: "",
    price: null,
    session_count: 1,
    validity_days: 30,
  });

  // Restore saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COACH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step) setCurrentStep(parsed.step);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist progress
  useEffect(() => {
    try {
      localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify({ step: currentStep }));
    } catch {
      // ignore
    }
  }, [currentStep]);

  // Load existing coach profile data
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: coach, error } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load coach profile:", error);
        return;
      }

      if (coach) {
        setCoachProfileId(coach.id);
        const c = coach as any;
        setProfileData((prev) => ({
          ...prev,
          image_url: coach.image_url || "",
          tagline: coach.tagline || "",
          location: coach.location || "",
          years_experience: coach.years_experience ?? null,
          price: coach.price ?? null,
          session_duration: coach.session_duration ?? 60,
          bio: coach.bio || "",
          insurance_doc_url: c.insurance_doc_url || "",
          insurance_expiry_date: c.insurance_expiry_date || "",
        }));
        setBufferMinutes(c.buffer_minutes ?? 0);
      }
    };

    load();
  }, [user]);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!profileData.price && profileData.price > 0;
      case 2:
        return availabilitySlots.length > 0 &&
          availabilitySlots.every((s) => s.start_time < s.end_time);
      case 3:
        return !!serviceData.name.trim() && !!serviceData.price && serviceData.price > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      if (currentStep === 1) await saveProfile();
      if (currentStep === 2) await saveAvailability();
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
    localStorage.removeItem(COACH_STORAGE_KEY);
    navigate("/coach-dashboard", { replace: true });
  };

  const saveProfile = async () => {
    if (!user) return;

    const updates: Record<string, unknown> = {
      tagline: profileData.tagline.trim() || null,
      location: profileData.location.trim() || null,
      years_experience: profileData.years_experience,
      price: profileData.price,
      session_duration: profileData.session_duration,
      bio: profileData.bio.trim() || null,
      buffer_minutes: bufferMinutes,
      insurance_doc_url: profileData.insurance_doc_url || null,
      insurance_expiry_date: profileData.insurance_expiry_date || null,
      updated_at: new Date().toISOString(),
    };

    if (profileData.image_url) {
      updates.image_url = profileData.image_url;
    }

    const { error } = await supabase
      .from("coach_profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save profile");
    }

    if (profileData.image_url) {
      await supabase
        .from("profiles")
        .update({ avatar_url: profileData.image_url })
        .eq("user_id", user.id);
    }
  };

  const saveAvailability = async () => {
    if (!coachProfileId || availabilitySlots.length === 0) return;

    const rows = availabilitySlots.map((slot) => ({
      coach_id: coachProfileId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_active: true,
      schedule_type: "weekly" as const,
      max_participants: slot.max_participants,
    }));

    const { error } = await supabase.from("availability").upsert(rows as any);
    if (error) {
      console.error("Failed to save availability:", error);
      toast.error("Failed to save availability");
    }
  };

  const saveService = async () => {
    if (!user || !serviceData.name.trim() || !serviceData.price) return;

    const { error } = await supabase.from("coach_packages").insert({
      coach_id: user.id,
      name: serviceData.name.trim(),
      description: serviceData.description.trim() || null,
      price: serviceData.price,
      currency: "ILS",
      session_count: serviceData.session_count,
      validity_days: serviceData.validity_days,
    });

    if (error) {
      console.error("Failed to save service:", error);
      toast.error("Failed to save service");
    }
  };

  const handleComplete = async () => {
    setSaving(true);

    try {
      await saveProfile();
      await saveAvailability();
      await saveService();

      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }

      localStorage.removeItem(COACH_STORAGE_KEY);

      setShowComplete(true);
      setTimeout(() => {
        navigate("/coach-dashboard", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("Error completing onboarding:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
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
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header with ring */}
        <div className="flex flex-col items-center mb-6 gap-2">
          <CircloLogo variant="full" size="md" theme="auto" />
          <ProgressRing step={currentStep} total={TOTAL_STEPS} />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {STEP_LABELS[currentStep - 1]}
            </p>
            <h1 className="text-base font-bold text-foreground mt-0.5">
              Set up your coaching profile
            </h1>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i < currentStep ? "w-8 bg-primary" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step content with slide transitions */}
        <div className="overflow-hidden">
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
                <ProfileSetup data={profileData} onChange={setProfileData} />
              )}
              {currentStep === 2 && (
                <AvailabilitySetup
                  slots={availabilitySlots}
                  onChange={setAvailabilitySlots}
                  bufferMinutes={bufferMinutes}
                  onBufferChange={setBufferMinutes}
                />
              )}
              {currentStep === 3 && (
                <FirstServiceSetup
                  data={serviceData}
                  onChange={setServiceData}
                  sessionPrice={profileData.price}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={currentStep === 1 ? handleSkip : handleBack}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {currentStep === 1 ? (
                "Skip for now →"
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </>
              )}
            </button>

            {/* Skip on steps 2+ */}
            {currentStep > 1 && currentStep < TOTAL_STEPS && (
              <button
                onClick={handleSkip}
                disabled={saving}
                className="text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors disabled:opacity-50"
              >
                Skip for now →
              </button>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="h-12 px-8 bg-primary text-primary-foreground rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 glow-primary disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : currentStep === TOTAL_STEPS ? (
              <>
                <Check className="h-4 w-4" />
                Launch Profile
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
