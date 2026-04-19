import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { supabase } from "@/integrations/supabase/client";

export default function LoginV2() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/v2/home", { replace: true });
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
        <h1 className="text-[28px] font-extrabold tracking-tight">Welcome back</h1>
        <p className="text-[13px] text-v2-muted mt-1.5">Sign in to keep training.</p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-3.5">
          <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-v2-muted mb-1.5">Email</span>
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
          </label>

          <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-v2-muted mb-1.5">Password</span>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 pr-10 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal"
                placeholder="••••••••"
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
          </label>

          {error && (
            <div className="v2-danger-soft px-3.5 py-2.5 rounded-[10px] text-danger text-[12px] font-semibold">
              {error}
            </div>
          )}

          <Link to="/v2/forgot-password" className="text-[12px] text-teal font-semibold self-end">
            Forgot password?
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-[14px] bg-teal text-navy-deep font-extrabold text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="flex-1" />

        <div className="text-center text-[13px] text-v2-muted mt-6">
          New to Circlo?{" "}
          <Link to="/v2/signup" className="text-teal font-bold">Create an account</Link>
        </div>
      </main>
    </PhoneFrame>
  );
}
