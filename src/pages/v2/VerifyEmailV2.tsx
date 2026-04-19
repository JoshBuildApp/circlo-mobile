import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { supabase } from "@/integrations/supabase/client";

export default function VerifyEmailV2() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [resentOnce, setResentOnce] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email address.");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/v2/login` },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResentOnce(true);
    toast.success("Confirmation email sent again.");
  };

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <header className="px-5 pt-3.5">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate("/v2/login")}>
          <ChevronLeft size={14} />
        </RoundButton>
      </header>

      <main className="flex-1 px-7 pt-8 pb-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-teal-dim text-teal flex items-center justify-center mb-6">
          <Mail size={32} />
        </div>
        <h1 className="text-[28px] font-extrabold tracking-tight">Check your email</h1>
        <p className="text-[14px] text-v2-muted leading-relaxed mt-3 max-w-[300px]">
          We sent a confirmation link to{" "}
          <strong className="text-offwhite">{email || "your inbox"}</strong>.
          Tap it to finish creating your account.
        </p>

        <div className="mt-8 w-full max-w-[300px] flex flex-col gap-3">
          <button
            onClick={() => window.open("https://mail.google.com", "_blank")}
            className="w-full py-3.5 rounded-[14px] bg-teal text-navy-deep font-bold text-[14px]"
          >
            Open Gmail
          </button>
          <button
            onClick={() => window.open("https://outlook.live.com", "_blank")}
            className="w-full py-3.5 rounded-[14px] bg-navy-card text-offwhite font-bold text-[14px]"
          >
            Open Outlook
          </button>
        </div>

        <div className="mt-10 text-[13px] text-v2-muted">
          Didn't get it?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-teal font-bold inline-flex items-center gap-1.5"
          >
            {resending && <Loader2 size={12} className="animate-spin" />}
            {resentOnce ? "Resend again" : "Resend email"}
          </button>
        </div>

        <button
          onClick={() => navigate("/v2/login")}
          className="mt-12 text-[12px] text-v2-muted-2"
        >
          Back to sign in
        </button>
      </main>
    </PhoneFrame>
  );
}
