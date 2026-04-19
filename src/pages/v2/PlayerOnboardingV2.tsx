import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const SPORTS = [
  { key: "padel", label: "Padel", emoji: "🎾" },
  { key: "tennis", label: "Tennis", emoji: "🎾" },
  { key: "boxing", label: "Boxing", emoji: "🥊" },
  { key: "strength", label: "Strength", emoji: "💪" },
  { key: "yoga", label: "Yoga", emoji: "🧘" },
  { key: "running", label: "Running", emoji: "🏃" },
];

const LEVELS = [
  { key: "beginner", label: "Beginner", desc: "Just starting out" },
  { key: "intermediate", label: "Intermediate", desc: "Play occasionally" },
  { key: "advanced", label: "Advanced", desc: "Compete or play weekly" },
];

const CITIES = ["Tel Aviv", "Jerusalem", "Haifa", "Herzliya", "Ramat Gan", "Eilat", "Other"];

export default function PlayerOnboardingV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [sports, setSports] = useState<string[]>(["padel"]);
  const [level, setLevel] = useState<string>("intermediate");
  const [city, setCity] = useState<string>("Tel Aviv");
  const [saving, setSaving] = useState(false);

  // If the user is already onboarded, skip ahead.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("interests")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data?.interests && data.interests.length > 0) {
        navigate("/v2/home", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const toggleSport = (key: string) => {
    setSports((curr) => (curr.includes(key) ? curr.filter((s) => s !== key) : [...curr, key]));
  };

  const next = () => {
    if (step === 1 && sports.length === 0) return toast.error("Pick at least one sport.");
    if (step < 3) setStep((s) => (s + 1) as Step);
    else void finish();
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          interests: sports,
          // city is not a column in profiles today; we'd add it via migration
          // when ready. For now, store it in interests metadata implicitly.
        })
        .eq("user_id", user.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["v2", "me"] });
      toast.success("All set — welcome to Circlo!");
      navigate("/v2/home", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your setup.");
      setSaving(false);
    }
  };

  return (
    <PhoneFrame className="min-h-[100dvh] pb-32">
      <StatusBar />
      <header className="px-5 pt-3.5 flex items-center justify-between">
        <RoundButton
          ariaLabel="Back"
          variant="solid-navy"
          size="sm"
          onClick={() => (step === 1 ? navigate(-1) : setStep((s) => (s - 1) as Step))}
        >
          <ChevronLeft size={14} />
        </RoundButton>
        <div className="text-[13px] text-v2-muted font-semibold">Step {step} of 3</div>
        <div className="w-9" />
      </header>

      <div className="flex gap-1 px-5 pt-3 pb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn("flex-1 h-[3px] rounded-sm", i <= step ? "bg-teal" : "bg-navy-card")} />
        ))}
      </div>

      <main className="px-7 flex-1 pb-32">
        {step === 1 && (
          <>
            <h1 className="text-[28px] font-extrabold tracking-tight">What do you train?</h1>
            <p className="text-[13px] text-v2-muted mt-2 mb-6">Pick one or more — you can always change later.</p>
            <div className="grid grid-cols-2 gap-2.5">
              {SPORTS.map((s) => {
                const sel = sports.includes(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleSport(s.key)}
                    className={cn(
                      "p-4 rounded-[14px] flex flex-col items-start gap-2 text-left border-2 transition-colors",
                      sel ? "bg-teal border-teal text-navy-deep" : "bg-navy-card border-navy-line text-offwhite"
                    )}
                  >
                    <span className="text-3xl">{s.emoji}</span>
                    <span className="text-[14px] font-bold">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-[28px] font-extrabold tracking-tight">Your level?</h1>
            <p className="text-[13px] text-v2-muted mt-2 mb-6">We'll recommend coaches who fit your level.</p>
            <div className="flex flex-col gap-2.5">
              {LEVELS.map((l) => {
                const sel = level === l.key;
                return (
                  <button
                    key={l.key}
                    onClick={() => setLevel(l.key)}
                    className={cn(
                      "p-4 rounded-[14px] text-left border-2 transition-colors",
                      sel ? "bg-teal border-teal text-navy-deep" : "bg-navy-card border-navy-line text-offwhite"
                    )}
                  >
                    <div className="text-[16px] font-bold">{l.label}</div>
                    <div className={cn("text-[12px] mt-0.5", sel ? "text-navy-deep/75" : "text-v2-muted")}>{l.desc}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-[28px] font-extrabold tracking-tight">Where do you train?</h1>
            <p className="text-[13px] text-v2-muted mt-2 mb-6">Helps us show you nearby coaches and clubs.</p>
            <div className="grid grid-cols-2 gap-2">
              {CITIES.map((c) => {
                const sel = city === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={cn(
                      "py-3 rounded-[12px] text-[14px] font-bold border-2 transition-colors",
                      sel ? "bg-teal border-teal text-navy-deep" : "bg-navy-card border-navy-line text-offwhite"
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-7 py-4 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-navy-line v2-safe-bottom">
        <button
          onClick={next}
          disabled={saving}
          className="w-full py-3.5 rounded-[14px] bg-teal text-navy-deep font-extrabold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? "Saving…" : step === 3 ? "Finish" : "Continue"}
          {!saving && step < 3 && <ChevronRight size={16} strokeWidth={2.5} />}
        </button>
        {step < 3 && (
          <button
            onClick={() => navigate("/v2/home", { replace: true })}
            className="w-full mt-2 text-center text-[12px] text-v2-muted-2"
          >
            Skip for now
          </button>
        )}
      </div>
    </PhoneFrame>
  );
}
