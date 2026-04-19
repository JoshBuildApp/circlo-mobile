import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { PhoneFrame } from "@/components/v2/shared";
import { useAuth } from "@/contexts/AuthContext";

/**
 * v2 splash screen. Shows the brand mark, then routes:
 *  - logged in  → /v2/home
 *  - logged out → /v2/login
 *
 * Mounts the Circlo wordmark with a soft entrance, then redirects after
 * either auth resolves or 1.2s elapses (whichever comes first).
 */
export default function SplashV2() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { user, loading } = useAuth();

  useEffect(() => {
    const minDelay = setTimeout(() => {
      if (!loading) navigate(user ? "/v2/home" : "/v2/login", { replace: true });
    }, 900);
    return () => clearTimeout(minDelay);
  }, [user, loading, navigate]);

  // If auth resolves AFTER the 900ms timer fires we still need a redirect.
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => navigate(user ? "/v2/home" : "/v2/login", { replace: true }), 50);
    return () => clearTimeout(t);
  }, [loading, user, navigate]);

  return (
    <PhoneFrame className="min-h-[100dvh] items-center justify-center" noEntry>
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.94 }}
        animate={reduce ? false : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center justify-center flex-1 gap-4"
      >
        <div className="text-[42px] font-extrabold tracking-tight text-teal">
          Circlo
        </div>
        <div className="text-[12px] text-v2-muted-2 tracking-widest uppercase">
          coach · play · grow
        </div>
        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-teal"
              initial={{ opacity: 0.3 }}
              animate={reduce ? false : { opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
            />
          ))}
        </div>
      </motion.div>
      <div className="text-center text-[10px] text-v2-muted-2 pb-8 tracking-wider uppercase">
        v0.8.2 · preview
      </div>
    </PhoneFrame>
  );
}
