import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[0-9!@#$%^&*]/.test(password)) {
      toast.error("Password must contain a number or special character");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/home");
    }
    setLoading(false);
  };

  if (!valid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center animate-fade-in">
          <p className="text-foreground font-medium mb-4">Invalid or expired reset link</p>
          <Link to="/forgot-password" className="text-primary hover:underline font-medium text-sm">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <Link to="/home" className="inline-flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
              <span className="font-heading text-xl font-bold text-primary-foreground">C</span>
            </div>
            <span className="font-heading text-2xl font-bold text-foreground tracking-tight">CIRCLO</span>
          </Link>
          <p className="text-muted-foreground text-sm mt-3">Set your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-foreground">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm text-foreground">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-heading font-semibold text-sm tracking-wide transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 glow-primary disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
