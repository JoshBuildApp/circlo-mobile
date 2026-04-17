import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * Welcome — guest landing screen (Stitch "onboarding_gradient" mockup).
 *
 * Shown on `/` for unauthenticated users as the first impression of Circlo.
 * After signup/login, users proceed through the multi-step `/onboarding` wizard.
 */
export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-between py-16 px-8 app-top-nav app-bottom-nav"
      style={{
        background:
          "radial-gradient(circle at top right, rgba(70,241,197,0.35) 0%, transparent 45%), radial-gradient(circle at bottom left, rgba(205,72,2,0.35) 0%, transparent 45%), hsl(var(--background))",
      }}
    >
      {/* Decorative glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#46f1c5]/20 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#cd4802]/20 blur-[100px]" />
      </div>

      {/* Wordmark cluster with orbital rings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full text-center space-y-6"
      >
        <div className="relative inline-block">
          <motion.div
            className="absolute -inset-8 border border-[#46f1c5]/20 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, ease: "linear", repeat: Infinity }}
          />
          <motion.div
            className="absolute -inset-14 border border-[#ffb59a]/10 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 60, ease: "linear", repeat: Infinity }}
          />
          <h1
            className="relative font-black italic tracking-[0.2em] text-5xl md:text-6xl text-[#46f1c5] uppercase"
            style={{ textShadow: "0 0 24px rgba(70, 241, 197, 0.45)" }}
          >
            CIRCLO
          </h1>
        </div>
        <p className="text-lg md:text-xl font-bold text-foreground tracking-tight leading-tight mt-4">
          Find Your Circle
        </p>
      </motion.div>

      {/* Central visual anchor */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative z-10 w-full flex justify-center items-center"
      >
        <div className="w-52 h-52 rounded-full border border-border/40 flex items-center justify-center p-2">
          <div className="w-full h-full rounded-full overflow-hidden bg-card relative">
            <div className="absolute inset-0 bg-gradient-kinetic opacity-50 mix-blend-overlay" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#46f1c5] mb-2">
                  Join
                </p>
                <p className="text-lg font-black uppercase tracking-tight text-foreground leading-tight">
                  Athletes
                  <br />
                  Coaches
                  <br />
                  Clubs
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        </div>
      </motion.div>

      {/* Action block */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 w-full space-y-4 max-w-sm mx-auto"
      >
        <p className="text-xs text-center font-label text-muted-foreground tracking-[0.3em] uppercase">
          Connect • Compete • Conquer
        </p>

        <button
          onClick={() => navigate("/signup")}
          className="w-full h-14 rounded-lg bg-foreground text-background font-black tracking-[0.2em] text-sm uppercase shadow-lg active:scale-95 transition-transform inline-flex items-center justify-center gap-2"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="flex items-center justify-between gap-3">
          <Link
            to="/login"
            className="flex-1 h-12 rounded-lg bg-card border border-border/60 text-foreground font-bold tracking-[0.15em] text-xs uppercase active:scale-95 transition-transform inline-flex items-center justify-center"
          >
            Log in
          </Link>
          <Link
            to="/home"
            className="flex-1 h-12 rounded-lg text-muted-foreground hover:text-foreground font-bold tracking-[0.15em] text-xs uppercase transition-colors inline-flex items-center justify-center"
          >
            Browse as guest
          </Link>
        </div>

        <div className="flex justify-center pt-2">
          <div className="w-12 h-1 bg-muted/60 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-gradient-kinetic" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
