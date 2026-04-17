import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const CtaSection = () => (
  <div className="px-4 md:px-6 lg:px-8">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
    >
      <Link
        to="/discover"
        className="group relative w-full h-28 md:h-32 rounded-[28px] flex items-center justify-between px-6 md:px-12 overflow-hidden shadow-[0_16px_48px_-16px_rgba(255,107,44,0.5)] hover:shadow-[0_20px_56px_-12px_rgba(255,107,44,0.65)] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, #FF6B2C 0%, #FF8C42 50%, #FF6B2C 100%)",
        }}
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#1A1A2E]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex-1 min-w-0">
          <p className="text-white text-base md:text-2xl lg:text-3xl font-black leading-tight">
            Ready to level up?
          </p>
          <p className="text-white/85 text-xs md:text-base font-semibold">
            Browse every coach on Circlo
          </p>
        </div>

        <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-white group-hover:translate-x-2 transition-transform duration-300 flex-shrink-0">
          <ArrowRight className="h-5 w-5 md:h-7 md:w-7" strokeWidth={2.5} />
        </div>
      </Link>
    </motion.div>
  </div>
);

export default CtaSection;
