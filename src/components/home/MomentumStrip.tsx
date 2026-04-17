import { memo } from "react";
import { Link } from "react-router-dom";
import { Flame, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTraineeProgress } from "@/hooks/use-trainee-progress";

const MomentumStrip = memo(() => {
  const { user } = useAuth();
  const { progress, xpInCurrentLevel, xpProgress, loading } = useTraineeProgress();

  if (!user || loading) return null;

  const sessionsToNextLevel = Math.max(1, Math.ceil((500 - xpInCurrentLevel) / 100));

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative h-auto md:h-[140px] rounded-[28px] px-6 md:px-10 py-5 md:py-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6 overflow-hidden bg-[#1A1A2E] text-white"
      >
        {/* Glow accent */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#FF6B2C]/30 blur-[80px] rounded-full pointer-events-none" />

        {/* Left: level + streak + xp bar */}
        <div className="relative z-10 flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-[#FF6B2C]" />
              <span className="text-2xl md:text-3xl font-black tracking-tight">
                Level {progress.level}
              </span>
            </div>
            {progress.streak_days > 0 && (
              <span className="flex items-center gap-1 text-[#FF6B2C] font-bold text-sm">
                <Flame className="h-4 w-4 fill-[#FF6B2C]" />
                {progress.streak_days} day streak
              </span>
            )}
          </div>

          <div className="w-full max-w-md">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50 font-bold mb-1">
              <span>{xpInCurrentLevel} XP</span>
              <span>500 XP</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8C42] rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Right: next goal CTA card */}
        <div className="relative z-10 flex-shrink-0 bg-white/[0.06] border border-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-5">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-black tracking-widest text-white/50">
              Next goal
            </span>
            <span className="text-xs md:text-sm font-bold leading-tight">
              {sessionsToNextLevel} more session{sessionsToNextLevel === 1 ? "" : "s"} to Level {progress.level + 1}
            </span>
          </div>
          <Link
            to="/discover"
            className="flex-shrink-0 bg-white text-[#1A1A2E] px-4 py-2 rounded-full text-xs font-black hover:bg-[#FF6B2C] hover:text-white transition-colors active:scale-95"
          >
            Book now
          </Link>
        </div>
      </motion.div>
    </div>
  );
});

MomentumStrip.displayName = "MomentumStrip";

export default MomentumStrip;
