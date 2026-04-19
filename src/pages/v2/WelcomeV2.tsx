import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PhoneFrame, StatusBar } from "@/components/v2/shared";

export default function WelcomeV2() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <main className="flex-1 flex flex-col px-7 pt-12 pb-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={reduce ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6"
        >
          <div className="text-[42px] font-extrabold tracking-tight text-teal leading-none">
            Circlo
          </div>
          <h1 className="text-[34px] font-extrabold tracking-tight leading-tight">
            Train with the<br />best coaches.<br /><span className="text-teal">Anywhere.</span>
          </h1>
          <p className="text-[14px] text-v2-muted leading-relaxed max-w-[300px]">
            Find a coach, book a session, follow your progress. All in one place.
          </p>
        </motion.div>

        <div className="flex-1" />

        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? false : { opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col gap-3 mt-8"
        >
          <button
            onClick={() => navigate("/v2/signup")}
            className="w-full py-4 rounded-[16px] bg-teal text-navy-deep font-extrabold text-[15px] flex items-center justify-center gap-2"
          >
            Create an account <ArrowRight size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate("/v2/login")}
            className="w-full py-4 rounded-[16px] bg-navy-card text-offwhite font-bold text-[15px]"
          >
            I already have an account
          </button>
          <button
            onClick={() => navigate("/v2/home")}
            className="text-center text-[12px] text-v2-muted-2 mt-3"
          >
            Browse without an account
          </button>
        </motion.div>
      </main>
    </PhoneFrame>
  );
}
