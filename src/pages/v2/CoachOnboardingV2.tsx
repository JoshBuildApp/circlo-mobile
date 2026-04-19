import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StatusBar, RoundButton, Avatar } from "@/components/v2/shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { uploadAvatar } from "@/lib/v2/storage";
import { formatPrice } from "@/lib/v2/currency";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

const SPORTS = [
  { key: "padel", label: "Padel", emoji: "🎾" },
  { key: "tennis", label: "Tennis", emoji: "🎾" },
  { key: "boxing", label: "Boxing", emoji: "🥊" },
  { key: "strength", label: "Strength", emoji: "💪" },
  { key: "yoga", label: "Yoga", emoji: "🧘" },
  { key: "running", label: "Running", emoji: "🏃" },
];

const PRICE_PRESETS = [180, 240, 280, 340, 420];

export default function CoachOnboardingV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [sport, setSport] = useState<string>("padel");
  const [price, setPrice] = useState<number>(280);
  const [bio, setBio] = useState<string>("");
  const [tagline, setTagline] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Skip the wizard if the coach already has a non-default profile.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("price, bio")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data && data.price && data.bio) {
        navigate("/v2/coach-me", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploading(true);
    try {
      const { publicUrl } = await uploadAvatar(user.id, file);
      setAvatarUrl(publicUrl);
      // Mirror to coach_profiles.image_url too.
      await supabase
        .from("coach_profiles")
        .update({ image_url: publicUrl })
        .eq("user_id", user.id);
      toast.success("Photo uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const next = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
    else void finish();
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("coach_profiles")
        .update({
          sport,
          price,
          bio: bio.trim() || null,
          tagline: tagline.trim() || null,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["v2", "me", "coach"] });
      qc.invalidateQueries({ queryKey: ["v2", "coaches"] });
      toast.success("You're set up! Time to get students.");
      navigate("/v2/coach-me", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't finish setup.");
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
        <div className="text-[13px] text-v2-muted font-semibold">Coach setup · {step}/4</div>
        <div className="w-9" />
      </header>

      <div className="flex gap-1 px-5 pt-3 pb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("flex-1 h-[3px] rounded-sm", i <= step ? "bg-orange" : "bg-navy-card")} />
        ))}
      </div>

      <main className="px-7 flex-1 pb-32">
        {step === 1 && (
          <>
            <h1 className="text-[28px] font-extrabold tracking-tight">What do you teach?</h1>
            <p className="text-[13px] text-v2-muted mt-2 mb-6">Pick your primary sport — you can add more later.</p>
            <div className="grid grid-cols-2 gap-2.5">
              {SPORTS.map((s) => {
                const sel = sport === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setSport(s.key)}
                    className={cn(
                      "p-4 rounded-[14px] flex flex-col items-start gap-2 text-left border-2 transition-colors",
                      sel ? "bg-orange border-orange text-white" : "bg-navy-card border-navy-line text-offwhite"
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
            <h1 className="text-[28px] font-extrabold tracking-tight">Your hourly rate</h1>
            <p className="text-[13px] text-v2-muted mt-2 mb-6">
              You'll keep 90% (Pro) or 80% (Free). Players see <strong className="text-offwhite">{formatPrice(price)}</strong>.
            </p>
            <div className="bg-navy-card rounded-[14px] p-5 mb-4 text-center">
              <div className="text-[40px] font-extrabold tracking-tight tnum text-orange">{formatPrice(price)}</div>
              <div className="text-[12px] text-v2-muted mt-1">per 60-minute session</div>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {PRICE_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrice(p)}
                  className={cn(
                    "py-2 rounded-md text-[12px] font-bold tnum border-2",
                    price === p ? "bg-orange border-orange text-white" : "bg-navy-card border-navy-line text-offwhite"
                  )}
                >
                  ₪{p}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={80}
              max={800}
              step={20}
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value))}
              className="w-full accent-orange"
            />
            <div className="flex justify-between text-[11px] text-v2-muted mt-1.5">
              <span>{formatPrice(80)}</span>
              <span>{formatPrice(800)}</span>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-[28px] font-extrabold tracking-tight">Your photo</h1>
            <p className="text-[13px] text-v2-muted mt-2 mb-6">
              Coaches with photos get 3× more bookings. We checked.
            </p>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar size={140} src={avatarUrl} alt="You" gradient="orange-peach" />
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2 size={28} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={handlePickPhoto}
                disabled={uploading}
                className="px-5 py-3 rounded-[12px] bg-orange text-white font-bold text-[14px] flex items-center gap-2 disabled:opacity-60"
              >
                <Camera size={16} /> {avatarUrl ? "Replace photo" : "Upload photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-[28px] font-extrabold tracking-tight">About you</h1>
            <p className="text-[13px] text-v2-muted mt-2 mb-6">
              Two quick lines. Players read this before booking.
            </p>
            <label className="block mb-4">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-v2-muted mb-1.5">Tagline</span>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Padel coach · Jaffa"
                className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-orange"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-v2-muted mb-1.5 flex justify-between">
                <span>Bio</span>
                <span className="text-v2-muted-2 normal-case">{bio.length}/240</span>
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 240))}
                rows={4}
                placeholder="Former WPT pro helping intermediate and advanced players unlock their best game."
                className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-orange resize-none"
              />
            </label>
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-7 py-4 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-navy-line v2-safe-bottom">
        <button
          onClick={next}
          disabled={saving || (step === 3 && uploading)}
          className="w-full py-3.5 rounded-[14px] bg-orange text-white font-extrabold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? "Setting up…" : step === 4 ? "Finish & start coaching" : "Continue"}
          {!saving && step < 4 && <ChevronRight size={16} strokeWidth={2.5} />}
        </button>
        {step < 4 && (
          <button
            onClick={() => navigate("/v2/coach-me", { replace: true })}
            className="w-full mt-2 text-center text-[12px] text-v2-muted-2"
          >
            Skip for now
          </button>
        )}
      </div>
    </PhoneFrame>
  );
}
