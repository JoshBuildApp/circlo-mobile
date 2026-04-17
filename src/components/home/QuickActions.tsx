import { Link } from "react-router-dom";
import { CalendarDays, UserSearch, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  { label: "Book a session", icon: CalendarDays, to: "/discover" },
  { label: "Find a coach", icon: UserSearch, to: "/discover" },
  { label: "Join community", icon: Users, to: "/community" },
  { label: "Track progress", icon: TrendingUp, to: "/profile" },
];

const QuickActions = () => (
  <div className="px-4 md:px-6 lg:px-8">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {actions.map((a, i) => (
        <motion.div
          key={a.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <Link
            to={a.to}
            className="group h-[80px] md:h-[88px] rounded-[24px] bg-card border border-border/40 flex items-center justify-center gap-3 px-3 hover:border-[#FF6B2C]/30 hover:shadow-[0_8px_24px_-12px_rgba(255,107,44,0.25)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-2xl bg-[#FF6B2C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF6B2C]/15 group-hover:scale-110 transition-all">
              <a.icon className="h-5 w-5 text-[#FF6B2C]" strokeWidth={2.2} />
            </div>
            <span className="text-sm font-bold text-foreground truncate">
              {a.label}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  </div>
);

export default QuickActions;
