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

const TOTAL_STEPS = 3;
const STEP_LABELS = ["Profile", "Availability", "First Service"];

export default function CoachOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
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
        setProfileData((prev) => ({
          ...prev,
          image_url: coach.image_url || "",
          tagline: coach.tagline || "",
          location: coach.location || "",
          years_experience: coach.years_experience ?? null,
          price: coach.price ?? null,
          session_duration: coach.session_duration ?? 60,
          bio: coach.bio || "",
        }));
        setBufferMinutes((coach as any).buffer_minutes ?? 0);
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
      // Save step 1 data when moving forward
      if (currentStep === 1) {
        await saveProfile();
      }
      // Save step 2 data when moving forward
      if (currentStep === 2) {
        await saveAvailability();
      }
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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

    // Also update avatar on profiles table
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

      // Mark onboarding as completed on profiles
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }

      toast.success("You're all set! Welcome to Circlo.");
      navigate("/coach-dashboard", { replace: true });
    } catch (err) {
      console.error("Error completing onboarding:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate("/coach-dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <CircloLogo variant="full" size="md" theme="auto" />
          <h1 className="text-lg font-bold text-foreground mt-4">Set up your coaching profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {STEP_LABELS[currentStep - 1]} — Step {currentStep} of {TOTAL_STEPS}
          </p>
        </div>

        {/* Step progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i < currentStep ? "bg-primary" : "bg-secondary"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step labels */}
        <div className="flex justify-between mb-6">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < currentStep - 1
                    ? "bg-primary text-primary-foreground"
                    : i === currentStep - 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i < currentStep - 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  i <= currentStep - 1 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="animate-fade-in">
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
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pb-8">
          <button
            onClick={currentStep === 1 ? handleSkip : handleBack}
            disabled={saving}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {currentStep === 1 ? (
              "Skip for now"
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                Back
              </>
            )}
          </button>

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
