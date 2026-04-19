import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SignupRole = "player" | "coach";

export default function SignupV2() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<SignupRole>("player");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError("Full name is required.");
    if (!email) return setError("Email is required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    if (!acceptTerms) return setError("You must accept the terms.");

    setLoading(true);
    const username = fullName.trim().toLowerCase().replace(/\s+/g, ".").slice(0, 30);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim(), username, role },
        emailRedirectTo: `${window.location.origin}/v2/login`,
      },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // For coaches, also seed the coach_profiles row so they appear in
    // discovery immediately. handle_new_user trigger handles profiles + roles.
    if (role === "coach" && data.user) {
      const { error: coachErr } = await supabase.from("coach_profiles").insert({
        user_id: data.user.id,
        coach_name: fullName.trim(),
        sport: "padel",
      });
      if (coachErr) console.error("coach_profiles insert failed:", coachErr);
    }

    setLoading(false);
    if (data.session) {
      toast.success("Account created!");
      // Send straight into the right onboarding flow.
      navigate(role === "coach" ? "/v2/coach-onboarding" : "/v2/onboarding", { replace: true });
    } else {
      // Email confirmation required — show the verify-your-email screen.
      navigate(`/v2/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
    }
  };

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <header className="px-5 pt-3.5">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate("/v2/welcome")}>
          <ChevronLeft size={14} />
        </RoundButton>
      </header>

      <main className="flex-1 px-7 pt-6 pb-8 flex flex-col">
        <h1 className="text-[28px] font-extrabold tracking-tight">Create account</h1>
        <p className="text-[13px] text-v2-muted mt-1.5">Pick your side. You can switch any time.</p>

        <div className="grid grid-cols-2 gap-2 mt-6">
          {(["player", "coach"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "py-3 rounded-[12px] font-bold text-[13px] capitalize border transition-colors",
                role === r ? "bg-teal text-navy-deep border-teal" : "bg-navy-card text-offwhite border-navy-line"
              )}
            >
              I'm a {r}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-3.5">
          <Field label="Full name">
            <input
              autoCapitalize="words"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal"
              placeholder="Guy Cohen"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal"
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 pr-10 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-v2-muted"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Field label="Confirm password">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal"
              placeholder="••••••••"
            />
          </Field>

          <button
            type="button"
            onClick={() => setAcceptTerms((v) => !v)}
            className="flex items-start gap-2.5 mt-1 text-left"
          >
            <span
              className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5",
                acceptTerms ? "bg-teal border-teal" : "border-navy-line"
              )}
            >
              {acceptTerms && <Check size={12} stroke="#0A0A0F" strokeWidth={3} />}
            </span>
            <span className="text-[12px] text-v2-muted leading-snug">
              I agree to Circlo's <span className="text-teal font-semibold">Terms</span> and{" "}
              <span className="text-teal font-semibold">Privacy Policy</span>.
            </span>
          </button>

          {error && (
            <div className="px-3.5 py-2.5 rounded-[10px] bg-[#ff4d6d1a] text-danger text-[12px] font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-[14px] bg-teal text-navy-deep font-extrabold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="text-center text-[13px] text-v2-muted mt-6">
          Already have an account?{" "}
          <Link to="/v2/login" className="text-teal font-bold">Sign in</Link>
        </div>
      </main>
    </PhoneFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-v2-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
