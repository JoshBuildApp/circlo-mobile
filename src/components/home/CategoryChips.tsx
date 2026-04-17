import { Link } from "react-router-dom";
import {
  Dumbbell,
  Swords,
  Target,
  Flame,
  Heart,
  Circle,
  Dribbble,
  Waves,
  Sparkles,
  Footprints,
  ShieldHalf,
  Bike,
} from "lucide-react";
import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";

const categories = [
  { label: "Padel", icon: Target, query: "padel" },
  { label: "Fitness", icon: Dumbbell, query: "fitness" },
  { label: "Tennis", icon: Swords, query: "tennis" },
  { label: "Boxing", icon: Flame, query: "boxing" },
  { label: "Yoga", icon: Heart, query: "yoga" },
  { label: "Soccer", icon: Circle, query: "soccer" },
  { label: "Basketball", icon: Dribbble, query: "basketball" },
  { label: "Swimming", icon: Waves, query: "swimming" },
  { label: "Running", icon: Footprints, query: "running" },
  { label: "MMA", icon: ShieldHalf, query: "mma" },
  { label: "CrossFit", icon: Sparkles, query: "crossfit" },
  { label: "Cycling", icon: Bike, query: "cycling" },
];

const CategoryChips = () => (
  <div className="px-4 md:px-6 lg:px-8">
    <SectionHeader title="Explore Sports" linkTo="/discover" linkLabel="See all" />
    <div className="flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar pb-3 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 snap-x">
      {categories.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03, duration: 0.3 }}
          className="snap-start flex-shrink-0"
        >
          <Link
            to={`/discover?sport=${c.query}`}
            className="group w-[120px] md:w-[140px] h-[120px] md:h-[140px] flex flex-col items-center justify-center gap-3 rounded-[24px] bg-card border-2 border-transparent hover:border-[#FF6B2C]/30 hover:bg-[#FF6B2C]/[0.04] active:scale-[0.97] transition-all duration-200"
          >
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#FF6B2C] to-[#FF8C42] flex items-center justify-center shadow-md shadow-[#FF6B2C]/20 group-hover:scale-110 transition-transform">
              <c.icon className="h-6 w-6 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-foreground/70 group-hover:text-foreground transition-colors">
              {c.label}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  </div>
);

export default CategoryChips;
