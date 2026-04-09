import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CircloLogo from "@/components/CircloLogo";
import { SportsSelection } from "@/components/onboarding/SportsSelection";
import { LocationStep } from "@/components/onboarding/LocationStep";
import { RoleStep } from "@/components/onboarding/RoleStep";
import { FollowCoachesStep } from "@/components/onboarding/FollowCoachesStep";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";
import { Loader2 } from "lucide-react";

const TOTAL_STEPS = 4;

const STEP_LABELS = [
  "Interests",
  "Location",
  "Role",
  "Follow Coaches",
];

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<"user" | "coach" | null>(null);
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
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

  const handleComplete = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Update profile with interests, location, and onboarding flag
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

      // 2. Assign role if not already set
      if (role) {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingRole) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .update({ role })
            .eq("user_id", user.id);
          if (roleError) console.error("Error updating role:", roleError);
        } else {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({ user_id: user.id, role });
          if (roleError) console.error("Error inserting role:", roleError);
        }

        // If coach, create a coach_profiles row
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
        const { error: followError } = await supabase
          .from("user_follows")
          .upsert(follows, { onConflict: "user_id,coach_id" });
        if (followError) console.error("Error following coaches:", followError);
      }

      // Refresh auth context profile
      await refreshProfile();

      // Show completion animation, then redirect
      setShowComplete(true);
      setTimeout(() => {
        navigate("/discover", { replace: true });
      }, 3000);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to save your preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedSports.length > 0;
      case 2:
        return location.trim().length > 0;
      case 3:
        return role !== null;
      case 4:
        return selectedCoachIds.length >= 3;
      default:
        return false;
    }
  };

  if (showComplete) {
    return <OnboardingComplete />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <CircloLogo className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Circlo!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's personalize your experience in just a few steps
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {STEP_LABELS[currentStep - 1]}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-2" />
        </div>

        {/* Content */}
        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-6">
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

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="min-w-[120px] bg-teal-500 hover:bg-teal-600"
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
  );
}
