import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Flame, Heart, Calendar } from "lucide-react";

/**
 * "Inside the Circle" section — community/social proof block for the landing page.
 * Glassmorphic profile + stats + event cards orbiting an iridescent ring,
 * with floating CIRCLO letter pills below.
 */
export default function InsideTheCircle({ dark }: { dark: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="community"
      className={`relative py-24 sm:py-32 overflow-hidden ${
        dark ? "bg-navy-deep" : "bg-[#0B0B14]"
      }`}
    >
      {/* Ambient background glow — iridescent radial gradient */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,212,170,0.10) 0%, rgba(168,85,247,0.08) 35%, transparent 70%)",
        }}
      />

      {/* Bottom fog */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(255,255,255,0.06), transparent)",
          filter: "blur(20px)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-xs font-medium tracking-wider uppercase text-teal">
            Inside The Circle
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
            More than booking sessions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            Join training circles, build streaks, and meet your crew at live
            community sessions across Tel Aviv and beyond.
          </p>
        </div>

        {/* Visual stage */}
        <div className="relative h-[640px] sm:h-[600px] flex items-center justify-center">
          {/* Iridescent torus / ring */}
          <motion.div
            className="absolute"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Outer glow blur */}
              <div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(168,85,247,0.45), rgba(0,212,170,0.35), transparent 65%)",
                  filter: "blur(50px)",
                }}
              />

              {/* Conic gradient ring */}
              <motion.div
                aria-hidden
                className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, #00D4AA, #A855F7, #06B6D4, #00D4AA)",
                  WebkitMaskImage:
                    "radial-gradient(circle, transparent 56%, black 57%)",
                  maskImage:
                    "radial-gradient(circle, transparent 56%, black 57%)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              />

              {/* Secondary thin ring (rotated for the 3D layered look) */}
              <div
                aria-hidden
                className="absolute w-60 h-60 sm:w-64 sm:h-64 rounded-full border-2 border-white/15"
                style={{ transform: "rotate(35deg) scaleY(0.4)" }}
              />
              <div
                aria-hidden
                className="absolute w-60 h-60 sm:w-64 sm:h-64 rounded-full border border-teal/30"
                style={{ transform: "rotate(-25deg) scaleY(0.5)" }}
              />
            </div>
          </motion.div>

          {/* Connecting node dots — purely decorative */}
          <div aria-hidden className="absolute inset-0 pointer-events-none hidden sm:block">
            <div className="absolute top-[18%] left-[42%] w-1.5 h-1.5 rounded-full bg-white/60" />
            <div className="absolute top-[35%] right-[20%] w-1.5 h-1.5 rounded-full bg-white/60" />
            <div className="absolute bottom-[28%] right-[38%] w-1.5 h-1.5 rounded-full bg-white/60" />
            <div className="absolute bottom-[15%] left-[28%] w-1.5 h-1.5 rounded-full bg-white/60" />
          </div>

          {/* Profile card — top left */}
          <motion.div
            className="absolute top-4 left-2 sm:top-8 sm:left-4 w-[260px]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="backdrop-blur-xl bg-white/[0.07] border border-white/15 rounded-2xl p-5 shadow-2xl"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white tracking-tight">
                  circlo
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-300">@maya</p>
              <p className="mt-1 text-xs text-gray-500">
                member since · jan 2026
              </p>
            </motion.div>
          </motion.div>

          {/* Stats card — top right */}
          <motion.div
            className="absolute top-2 right-2 sm:top-12 sm:right-4 w-[230px]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="backdrop-blur-xl bg-white/[0.07] border border-white/15 rounded-2xl p-5 shadow-2xl"
              animate={{ y: [0, 6, 0] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
            >
              <div className="flex items-center justify-between text-sm text-white">
                <span className="flex items-center gap-2 text-gray-300">
                  <Users size={14} className="text-teal" />
                  coaches followed
                </span>
                <span className="font-semibold w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">
                  12
                </span>
              </div>
              <div className="my-3 h-px bg-white/10" />
              <div className="flex items-center justify-between text-sm text-white">
                <span className="flex items-center gap-2 text-gray-300">
                  <Flame size={14} className="text-orange-400" />
                  training streak
                </span>
                <span className="font-semibold text-xs text-gray-200">12d</span>
              </div>
              <div className="my-3 h-px bg-white/10" />
              <div className="flex items-center justify-between text-sm text-white">
                <span className="flex items-center gap-2 text-gray-300">
                  <Heart size={14} className="text-purple-400" />
                  kudos given
                </span>
                <span className="font-semibold w-10 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">
                  194
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Event card — bottom right */}
          <motion.div
            className="absolute bottom-4 right-2 sm:bottom-12 sm:right-8 w-[250px]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="backdrop-blur-xl bg-white/[0.07] border border-white/15 rounded-2xl p-5 shadow-2xl"
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6,
              }}
            >
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Calendar size={12} className="text-teal" />
                <span className="uppercase tracking-wider">Live session</span>
              </div>
              <p className="text-lg font-semibold text-white leading-tight">
                Padel meetup
              </p>
              <p className="mt-1 text-sm text-gray-400">sat · 5pm tel aviv</p>
              <button
                type="button"
                className="mt-4 w-full py-2.5 rounded-full text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(90deg, #A855F7, #06B6D4, #00D4AA)",
                }}
              >
                RSVP
              </button>
            </motion.div>
          </motion.div>

          {/* CIRCLO letter pills — bottom left */}
          <motion.div
            className="absolute bottom-6 left-4 sm:bottom-16 sm:left-12 flex gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {["C", "I", "R", "C", "L", "O"].map((letter, i) => (
              <motion.div
                key={i}
                className="w-9 h-9 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-lg"
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 2 + i * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
              >
                {letter}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
