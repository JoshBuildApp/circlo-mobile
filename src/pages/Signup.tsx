import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Dumbbell, GraduationCap, ArrowLeft, Zap, Users, Mail, RefreshCw } from "lucide-react";
import CircloLogo from "@/components/CircloLogo";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import MobileSignup from "@/components/MobileSignup";
import { useMobile } from "@/hooks/use-mobile";


const INTERESTS = [
  "Padel", "Fitness", "Tennis", "Boxing", "Soccer",
  "Basketball", "Yoga", "Swimming", "Running", "MMA",
];

const SPORTS = [
  "Padel", "Fitness", "Tennis", "Boxing", "Soccer",
  "Basketball", "Yoga", "Swimming", "Running", "MMA",
  "CrossFit", "Martial Arts",
];

type Step = "account" | "role" | "trainee-profile" | "coach-profile";
type Role = "user" | "coach";

const Signup = () => {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("account");
  const [role, setRole] = useState<Role | null>(null);

  // Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");

  // Trainee
  const [age, setAge] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Coach
  const [coachName, setCoachName] = useState("");
  const [sport, setSport] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [resending, setResending] = useState(false);

  const stepIndex = step === "account" ? 0 : step === "role" ? 1 : 2;
  const totalSteps = 3;

  const handleAccountContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) {
      toast.error("Please fill in all fields");
      return;
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (username.length < 2) {
      toast.error("Username must be at least 2 characters");
      return;
    }
    // Password strength: min 8 chars
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    // Password strength: must have a number or special char
    if (!/[0-9!@#$%^&*]/.test(password)) {
      toast.error("Password must include a number or special character");
      return;
    }
    if (password !== confirmPassword) {
      return;
    }
    setStep("role");
  };

  const handleRoleSelect = (selected: Role) => {
    setRole(selected);
    setStep(selected === "coach" ? "coach-profile" : "trainee-profile");
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSignup = async () => {
    // Validate based on role
    if (role === "user") {
      if (!age || parseInt(age) < 13) {
        toast.error("You must be at least 13 years old");
        return;
      }
      if (selectedInterests.length === 0) {
        toast.error("Select at least one interest");
        return;
      }
    } else {
      if (!coachName.trim()) {
        toast.error("Please enter your coach name");
        return;
      }
      if (!sport) {
        toast.error("Please select your sport");
        return;
      }
    }

    setLoading(true);

    const metadata: Record<string, any> = {
      username,
      role,
    };

    if (role === "user") {
      metadata.age = parseInt(age);
      metadata.interests = selectedInterests;
    } else {
      metadata.coach_name = coachName.trim();
      metadata.sport = sport;
      metadata.bio = bio.trim();
    }

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

    // If coach, insert coach_profiles row
    if (role === "coach" && data.user) {
      const { error: coachError } = await supabase.from("coach_profiles").insert({
        user_id: data.user.id,
        coach_name: coachName.trim(),
        sport,
        bio: bio.trim(),
      });
      if (coachError) {
        console.error("Coach profile error:", coachError);
      }
    }


    // Show verification message
    setShowVerification(true);
    setLoading(false);
  };

  const goBack = () => {
    if (step === "role") setStep("account");
    else if (step === "trainee-profile" || step === "coach-profile") setStep("role");
  };

  const handleResendVerification = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) toast.error(error.message);
    else toast.success("Verification email sent! Check your inbox.");
    setResending(false);
  };

  // Mobile: use dedicated mobile signup flow
  if (isMobile) return <MobileSignup />;

  // ─── Verification Screen ───
  if (showVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-2">
            We sent a verification link to
          </p>
          <p className="text-foreground font-medium text-sm mb-6">{email}</p>
          <p className="text-muted-foreground text-xs leading-relaxed mb-8">
            Click the link in your email to verify your account and start using CIRCLO.
            Don't forget to check your spam folder!
          </p>
          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 glow-primary disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
          >
            <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Sending…" : "Resend Verification Email"}
          </button>
          <Link
            to="/login"
            className="block w-full h-12 bg-secondary text-foreground rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:bg-secondary/80 active:scale-95 flex items-center justify-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="sr-only" tabIndex={-1}>Sign up for Circlo</h1>
          <Link to="/home" className="inline-flex items-center justify-center">
            <CircloLogo variant="full" size="lg" theme="light" tagline="Join the Circle" />
          </Link>
          <p className="text-muted-foreground text-sm mt-4">
            {step === "account" && "Create your account"}
            {step === "role" && "Choose your path"}
            {step === "trainee-profile" && "Tell us about yourself"}
            {step === "coach-profile" && "Set up your coach profile"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= stepIndex ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        {/* Back button for steps after account */}
        {step !== "account" && (
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {/* ─── Step 1: Account ─── */}
        {step === "account" && (
          <form onSubmit={handleAccountContinue} className="space-y-5 animate-fade-in">
            {/* Social login options */}
            <SocialLoginButtons variant="light" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">or sign up with email</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-foreground">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
              />
              {/* Password strength indicator */}
              {password.length > 0 && (() => {
                const strength = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[!@#$%^&*]/.test(password)].filter(Boolean).length;
                const labels = ['Weak', 'Fair', 'Good', 'Strong'];
                const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400'];
                return (
                  <div className="mt-1.5">
                    <div className="flex gap-1 mb-1">
                      {[0,1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength ? colors[strength-1] : 'bg-muted/30'}`} />)}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{labels[Math.max(0, strength-1)]} password</p>
                  </div>
                );
              })()}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-foreground">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <button
              type="submit"
              disabled={confirmPassword.length > 0 && password !== confirmPassword}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 glow-primary disabled:opacity-50"
            >
              Continue
            </button>
          </form>
        )}

        {/* ─── Step 2: Role Selection ─── */}
        {step === "role" && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => handleRoleSelect("user")}
              className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] ${
                role === "user"
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                  <Dumbbell className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-foreground text-lg mb-1">I want to train</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Discover coaches, book sessions, and level up your game.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect("coach")}
              className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] ${
                role === "coach"
                  ? "border-accent bg-accent/10"
                  : "border-border/50 bg-card hover:border-accent/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 transition-colors">
                  <GraduationCap className="h-7 w-7 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-foreground text-lg mb-1">I am a coach</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Build your brand, upload content, and grow your community.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ─── Step 3a: Trainee Profile ─── */}
        {step === "trainee-profile" && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm text-foreground">Age</Label>
              <Input
                id="age"
                type="number"
                min={13}
                max={99}
                placeholder="Your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-foreground">Training Interests</Label>
              <p className="text-xs text-muted-foreground">Select all that apply</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {INTERESTS.map((interest) => {
                  const selected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`h-11 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                        selected
                          ? "bg-primary text-primary-foreground glow-primary"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 glow-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Start Training
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── Step 3b: Coach Profile ─── */}
        {step === "coach-profile" && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="coachName" className="text-sm text-foreground">Coach Name</Label>
              <Input
                id="coachName"
                type="text"
                placeholder="Your display name as a coach"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                className="h-12 rounded-xl bg-secondary border-border/50 focus:border-accent/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-foreground">Sport</Label>
              <div className="grid grid-cols-3 gap-2">
                {SPORTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSport(s)}
                    className={`h-10 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 ${
                      sport === s
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm text-foreground">Short Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell trainees about yourself and your coaching style…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="rounded-xl bg-secondary border-border/50 focus:border-accent/50 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="w-full h-12 bg-accent text-accent-foreground rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 glow-accent disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Launch My Profile
                </>
              )}
            </button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
