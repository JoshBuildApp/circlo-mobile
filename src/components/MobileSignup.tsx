import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Dumbbell,
  GraduationCap,
  Zap,
  Users,
  Mail,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import CircloLogo from "@/components/CircloLogo";
import SocialLoginButtons from "@/components/SocialLoginButtons";

const SPORTS = [
  { label: "Padel", emoji: "\uD83C\uDFBE" },
  { label: "Fitness", emoji: "\uD83D\uDCAA" },
  { label: "Tennis", emoji: "\uD83C\uDFBE" },
  { label: "Boxing", emoji: "\uD83E\uDD4A" },
  { label: "Soccer", emoji: "\u26BD" },
  { label: "Basketball", emoji: "\uD83C\uDFC0" },
  { label: "Yoga", emoji: "\uD83E\uDDD8" },
  { label: "Swimming", emoji: "\uD83C\uDFCA" },
  { label: "Running", emoji: "\uD83C\uDFC3" },
  { label: "MMA", emoji: "\uD83E\uDD3C" },
  { label: "CrossFit", emoji: "\uD83C\uDFCB\uFE0F" },
  { label: "Martial Arts", emoji: "\uD83E\uDD4B" },
];

type Step = 1 | 2 | 3 | 4;
type Role = "user" | "coach";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const MobileSignup = () => {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [role, setRole] = useState<Role | null>(null);

  // Step 1
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Step 2
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 4
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [resending, setResending] = useState(false);

  const goNext = () => {
    setDirection(1);
    setStep((s) => (s + 1) as Step);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => (s - 1) as Step);
  };

  const passwordStrength = (() => {
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*]/.test(password),
    ];
    return checks.filter(Boolean).length;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];

  const validateStep1 = () => {
    if (!username.trim() || !email.trim()) {
      toast.error("Please fill in all fields");
      return false;
    }
    if (username.trim().length < 2) {
      toast.error("Username must be at least 2 characters");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (!/[0-9!@#$%^&*]/.test(password)) {
      toast.error("Password must include a number or special character");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleContinueStep1 = () => {
    if (validateStep1()) goNext();
  };

  const handleContinueStep2 = () => {
    if (validateStep2()) goNext();
  };

  const handleRoleSelect = (selected: Role) => {
    setRole(selected);
    goNext();
  };

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleSignup = async () => {
    if (selectedSports.length === 0) {
      toast.error("Select at least one sport");
      return;
    }

    setLoading(true);

    const metadata: Record<string, unknown> = {
      username: username.trim(),
      role,
      interests: selectedSports,
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (role === "coach" && data.user) {
      const { error: coachError } = await supabase.from("coach_profiles").insert({
        user_id: data.user.id,
        coach_name: username.trim(),
        sport: selectedSports[0],
        bio: "",
      });
      if (coachError) console.error("Coach profile error:", coachError);
    }

    setShowVerification(true);
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) toast.error(error.message);
    else toast.success("Verification email sent!");
    setResending(false);
  };

  // Verification screen
  if (showVerification) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#0A0A0F" }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="h-20 w-20 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-[#00D4AA]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-gray-400 text-sm mb-1">We sent a verification link to</p>
          <p className="text-white font-medium text-sm mb-6">{email}</p>
          <p className="text-gray-500 text-xs leading-relaxed mb-8">
            Click the link in your email to verify your account. Check your spam folder too!
          </p>
          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full h-[52px] rounded-xl font-semibold text-sm text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
            style={{ background: "linear-gradient(135deg, #00D4AA, #00B894)" }}
          >
            <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Sending..." : "Resend Verification Email"}
          </button>
          <Link
            to="/login"
            className="block w-full h-[52px] rounded-xl font-semibold text-sm text-white bg-[#1A1A2E] flex items-center justify-center transition-all active:scale-95"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#0A0A0F" }}>
      {/* Teal radial glow at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,212,170,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-12 pb-4 px-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/home">
            <CircloLogo variant="full" size="lg" theme="white" tagline="Find Your Circle" />
          </Link>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: s === step ? 24 : 8,
                background: s <= step ? "#00D4AA" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Back button */}
      <div className="relative z-10 px-6 h-10 flex items-center">
        {step > 1 && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 active:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </motion.button>
        )}
      </div>

      {/* Content area */}
      <div className="relative z-10 flex-1 px-6 pb-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 1: Name + Email */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Create your account</h2>
                <p className="text-sm text-gray-400">Let's start with the basics</p>
              </div>

              {/* Social login options */}
              <SocialLoginButtons variant="dark" />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 text-gray-500" style={{ background: "#0A0A0F" }}>or sign up with email</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">Username</label>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-[52px] rounded-xl px-4 text-white text-sm placeholder:text-gray-500 outline-none transition-all border border-white/10 focus:border-[#00D4AA]/50 focus:ring-2 focus:ring-[#00D4AA]/20"
                    style={{ background: "#12121A" }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[52px] rounded-xl px-4 text-white text-sm placeholder:text-gray-500 outline-none transition-all border border-white/10 focus:border-[#00D4AA]/50 focus:ring-2 focus:ring-[#00D4AA]/20"
                    style={{ background: "#12121A" }}
                  />
                </div>
              </div>

              <button
                onClick={handleContinueStep1}
                className="w-full h-[52px] rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] shadow-lg shadow-[#00D4AA]/20"
                style={{ background: "linear-gradient(135deg, #00D4AA, #00B894)" }}
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Secure your account</h2>
                <p className="text-sm text-gray-400">Create a strong password</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-[52px] rounded-xl px-4 pr-12 text-white text-sm placeholder:text-gray-500 outline-none transition-all border border-white/10 focus:border-[#00D4AA]/50 focus:ring-2 focus:ring-[#00D4AA]/20"
                      style={{ background: "#12121A" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength indicator */}
                  {password.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              i <= passwordStrength ? strengthColors[passwordStrength] : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-500">{strengthLabel} password</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-[52px] rounded-xl px-4 pr-12 text-white text-sm placeholder:text-gray-500 outline-none transition-all border border-white/10 focus:border-[#00D4AA]/50 focus:ring-2 focus:ring-[#00D4AA]/20"
                      style={{ background: "#12121A" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                  {confirmPassword.length > 0 && password === confirmPassword && password.length > 0 && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleContinueStep2}
                className="w-full h-[52px] rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] shadow-lg shadow-[#00D4AA]/20"
                style={{ background: "linear-gradient(135deg, #00D4AA, #00B894)" }}
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* Step 3: Role selection */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Who are you?</h2>
                <p className="text-sm text-gray-400">Choose your path in Circlo</p>
              </div>

              <div className="space-y-4">
                {/* Athlete card */}
                <button
                  onClick={() => handleRoleSelect("user")}
                  className="w-full group relative rounded-2xl p-[2px] transition-all active:scale-[0.98]"
                  style={{
                    background:
                      role === "user"
                        ? "linear-gradient(135deg, #00D4AA, #00B894)"
                        : "rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl py-8 px-4"
                    style={{ background: "#1A1A2E" }}
                  >
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(0,212,170,0.1)" }}
                    >
                      <Dumbbell className="h-8 w-8 text-[#00D4AA]" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Athlete</h3>
                    <p className="text-xs text-gray-400 text-center">
                      Discover coaches & level up your game
                    </p>
                  </div>
                </button>

                {/* Coach card */}
                <button
                  onClick={() => handleRoleSelect("coach")}
                  className="w-full group relative rounded-2xl p-[2px] transition-all active:scale-[0.98]"
                  style={{
                    background:
                      role === "coach"
                        ? "linear-gradient(135deg, #FF6B2C, #FF8F5E)"
                        : "rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl py-8 px-4"
                    style={{ background: "#1A1A2E" }}
                  >
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(255,107,44,0.1)" }}
                    >
                      <GraduationCap className="h-8 w-8 text-[#FF6B2C]" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Coach</h3>
                    <p className="text-xs text-gray-400 text-center">
                      Build your brand & grow your community
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Sport selection */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Pick your sports</h2>
                <p className="text-sm text-gray-400">Select all that interest you</p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {SPORTS.map(({ label, emoji }) => {
                  const selected = selectedSports.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleSport(label)}
                      className="h-10 px-4 rounded-full text-sm font-medium transition-all active:scale-95 flex items-center gap-1.5 border"
                      style={{
                        background: selected ? "rgba(0,212,170,0.15)" : "transparent",
                        borderColor: selected ? "#00D4AA" : "rgba(255,255,255,0.1)",
                        color: selected ? "#00D4AA" : "rgba(255,255,255,0.6)",
                      }}
                    >
                      <span>{emoji}</span>
                      {label}
                      {selected && <Check className="h-3.5 w-3.5 ml-0.5" />}
                    </button>
                  );
                })}
              </div>

              {selectedSports.length > 0 && (
                <p className="text-xs text-gray-500">
                  {selectedSports.length} sport{selectedSports.length !== 1 ? "s" : ""} selected
                </p>
              )}

              <button
                onClick={handleSignup}
                disabled={loading || selectedSports.length === 0}
                className="w-full h-[52px] rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] shadow-lg shadow-[#00D4AA]/20 disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #00D4AA, #00B894)" }}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : role === "coach" ? (
                  <>
                    <Users className="h-4 w-4" />
                    Launch My Profile
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Start Training
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-6 pb-8 space-y-4">
        <p className="text-center text-xs text-gray-500">
          Join 10,000+ athletes and coaches
        </p>
        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-[#00D4AA] font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default MobileSignup;
