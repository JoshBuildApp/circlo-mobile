import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  Camera, Calendar, Video, CreditCard, Shield, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  check: () => boolean;
}

interface CoachOnboardingChecklistProps {
  hasProfilePhoto: boolean;
  hasAvailability: boolean;
  hasVideo: boolean;
  hasPrice: boolean;
  isVerified: boolean;
  verificationStatus: string | null;
  onUpload: () => void;
  onVerify: () => void;
  onSetTab: (tab: string) => void;
}

const CoachOnboardingChecklist = ({
  hasProfilePhoto,
  hasAvailability,
  hasVideo,
  hasPrice,
  isVerified,
  verificationStatus,
  onUpload,
  onVerify,
  onSetTab,
}: CoachOnboardingChecklistProps) => {
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("circlo_onboarding_dismissed") === "true"; } catch { return false; }
  });

  const steps: ChecklistStep[] = useMemo(() => [
    {
      id: "photo",
      label: "Add a profile photo",
      description: "Coaches with photos get 3x more bookings",
      icon: Camera,
      check: () => hasProfilePhoto,
    },
    {
      id: "price",
      label: "Set your pricing",
      description: "Let athletes know your session rates",
      icon: CreditCard,
      check: () => hasPrice,
    },
    {
      id: "availability",
      label: "Set your availability",
      description: "Open up time slots for athletes to book",
      icon: Calendar,
      check: () => hasAvailability,
    },
    {
      id: "video",
      label: "Upload your first video",
      description: "Showcase your coaching style",
      icon: Video,
      check: () => hasVideo,
    },
    {
      id: "verify",
      label: "Get verified",
      description: verificationStatus === "pending" ? "Verification in progress" : "Build trust with a verified badge",
      icon: Shield,
      check: () => isVerified || verificationStatus === "pending",
    },
  ], [hasProfilePhoto, hasAvailability, hasVideo, hasPrice, isVerified, verificationStatus]);

  const completed = steps.filter(s => s.check()).length;
  const total = steps.length;
  const progress = (completed / total) * 100;
  const allDone = completed === total;

  useEffect(() => {
    if (allDone && !dismissed) {
      const t = setTimeout(() => {
        setDismissed(true);
        localStorage.setItem("circlo_onboarding_dismissed", "true");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [allDone, dismissed]);

  if (dismissed) return null;

  const handleStepClick = (step: ChecklistStep) => {
    if (step.check()) return;
    switch (step.id) {
      case "photo": onSetTab("overview"); break;
      case "price": onSetTab("overview"); break;
      case "availability": onSetTab("bookings"); break;
      case "video": onUpload(); break;
      case "verify": onVerify(); break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/10 bg-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="relative h-10 w-10 flex-shrink-0">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="text-primary transition-all duration-700"
              strokeDasharray={`${progress} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-foreground">
            {completed}/{total}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            {allDone ? "All set! You're ready to coach" : "Complete your profile"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {allDone ? "Great job setting everything up" : `${total - completed} step${total - completed !== 1 ? "s" : ""} remaining`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {allDone && <Sparkles className="h-4 w-4 text-accent" />}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1">
              {steps.map((step, idx) => {
                const done = step.check();
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                      done ? "opacity-60" : "hover:bg-secondary/50 active:scale-[0.98]"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                      done ? "bg-primary/10" : "bg-secondary"
                    )}>
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs font-semibold",
                        done ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                    {!done && (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40 -rotate-90 flex-shrink-0" />
                    )}
                  </button>
                );
              })}

              {allDone && (
                <button
                  onClick={() => {
                    setDismissed(true);
                    localStorage.setItem("circlo_onboarding_dismissed", "true");
                  }}
                  className="w-full mt-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Dismiss checklist
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CoachOnboardingChecklist;
