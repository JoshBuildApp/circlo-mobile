import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPasswordV2() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Email is required.");
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/v2/login`,
    });
    setLoading(false);
    if (err) return setError(err.message);
    setSent(true);
    toast.success("Reset link sent.");
  };

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <header className="px-5 pt-3.5">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate("/v2/login")}>
          <ChevronLeft size={14} />
        </RoundButton>
      </header>

      <main className="flex-1 px-7 pt-6 pb-8 flex flex-col">
        <h1 className="text-[28px] font-extrabold tracking-tight">Forgot password?</h1>
        <p className="text-[13px] text-v2-muted mt-1.5">
          Enter the email you signed up with. We'll send you a reset link.
        </p>

        {sent ? (
          <div className="mt-8 p-4 rounded-[14px] bg-teal-dim flex gap-3 items-start">
            <Mail size={18} className="text-teal mt-0.5 shrink-0" />
            <div>
              <div className="text-[14px] font-bold text-teal">Check your inbox</div>
              <div className="text-[12px] text-offwhite mt-1 leading-snug">
                If an account with <strong>{email}</strong> exists, we've sent a reset link. It expires in 1 hour.
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 flex flex-col gap-3.5">
            <label className="block">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-v2-muted mb-1.5">Email</span>
              <input
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal"
                placeholder="you@example.com"
              />
            </label>
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
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <div className="flex-1" />
        <button
          onClick={() => navigate("/v2/login")}
          className="text-center text-[13px] text-v2-muted mt-6"
        >
          Back to sign in
        </button>
      </main>
    </PhoneFrame>
  );
}
