import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ADMIN_EMAILS } from "@/config/dev";
import CircloLogo from "@/components/CircloLogo";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Mail } from "lucide-react";
import loginRightPanel from "@/assets/login-right-panel.png";
import { authRedirect } from "@/lib/platform";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string })?.from || "/home";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error(t("login.enterEmail"));
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: authRedirect("/home"),
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setMagicLinkSent(true);
    toast.success(t("login.checkInbox"));
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("login.fillFields"));
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const isBypass = ADMIN_EMAILS.some((a) => a.toLowerCase() === data.user?.email?.toLowerCase());
    if (data.user && !data.user.email_confirmed_at && !isBypass) {
      toast.error(t("login.verifyEmailFirst"));
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    toast.success(t("login.welcomeBack"));
    navigate(redirectTo);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1760px] overflow-hidden rounded-[28px] border border-border/40 bg-card shadow-[0_24px_80px_-32px_hsl(var(--foreground)/0.18)] sm:min-h-[calc(100vh-3rem)] lg:grid lg:grid-cols-[0.82fr_1.18fr] relative">
        <Link
          to="/"
          className="absolute top-5 left-5 z-10 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>
        <div className="absolute top-4 right-5 z-10">
          <LanguageSwitcher variant="compact" />
        </div>
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[430px]">
            <h1 className="sr-only" tabIndex={-1}>{t("login.title")}</h1>
            <div className="mb-10 inline-flex items-center" aria-label="Circlo logo">
              <CircloLogo variant="full" size="lg" theme="light" />
            </div>

            {mode === "magic-link" ? (
              magicLinkSent ? (
                <div className="space-y-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-foreground">{t("login.checkYourEmail")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("login.magicLinkSent", { email })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setMagicLinkSent(false); setEmail(""); }}
                    className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    {t("login.useDifferentEmail")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="magic-email" className="block text-[15px] font-semibold text-foreground/80">
                      {t("login.email")}
                    </label>
                    <input
                      id="magic-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-border bg-background px-5 text-lg text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-4 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    >
                      {loading ? t("login.sending") : t("login.sendMagicLink")}
                    </button>

                    <Link
                      to="/signup"
                      className="flex h-14 w-full items-center justify-center rounded-full bg-brand-gradient text-base font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                    >
                      {t("login.signUp")}
                    </Link>
                  </div>
                </form>
              )
            ) : (
              <>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-[15px] font-semibold text-foreground/80">
                      {t("login.email")}
                    </label>
                    <input
                      id="email"
                      type="text"
                      placeholder={t("login.emailOrDevCode")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-border bg-background px-5 text-lg text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-[15px] font-semibold text-foreground/80">
                      {t("login.password")}
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder={t("login.passwordPlaceholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-border bg-background px-5 text-lg text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div className="space-y-4 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    >
                      {loading ? t("login.loggingIn") : t("login.logIn")}
                    </button>

                    <Link
                      to="/signup"
                      className="flex h-14 w-full items-center justify-center rounded-full bg-brand-gradient text-base font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                    >
                      {t("login.signUp")}
                    </Link>
                  </div>
                </form>

                {/* Social login divider + buttons */}
                <div className="pt-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">{t("login.orContinueWith")}</span>
                    </div>
                  </div>
                  <SocialLoginButtons variant="light" />
                </div>
              </>
            )}

            <div className="flex flex-col items-center gap-3 pt-6">
              <button
                type="button"
                onClick={() => { setMode(mode === "password" ? "magic-link" : "password"); setMagicLinkSent(false); }}
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                {mode === "password" ? t("login.switchToMagic") : t("login.switchToPassword")}
              </button>
              {mode === "password" && (
                <Link to="/forgot-password" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("login.forgotPassword")}
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="hidden lg:flex lg:items-center lg:justify-center lg:p-10 xl:p-14">
          <div className="w-full max-w-[860px]">
            <img
              src={loginRightPanel}
              alt="Circlo sports coaching illustration"
              className="h-auto w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
