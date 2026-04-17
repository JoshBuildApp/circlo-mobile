import { Link } from "react-router-dom";
import { Users, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useFeaturedCommunities } from "@/hooks/use-community";
import { SafeImage } from "@/components/ui/safe-image";
import { resolveCoachImage } from "@/lib/coach-placeholders";
import SectionHeader from "./SectionHeader";

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);

const FeaturedCommunities = () => {
  const { communities, loading } = useFeaturedCommunities();

  if (loading) return null;

  // Hide empty communities — Stitch design says no zero-member states.
  const active = communities.filter((c) => c.memberCount > 0);
  if (active.length === 0) return null;

  const top = active.slice(0, 4);

  return (
    <section className="px-4 md:px-6 lg:px-8">
      <SectionHeader title="Elite Communities" linkTo="/community" linkLabel="See all" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {top.map((c, i) => {
          const cover = resolveCoachImage(c.image, c.coachId);
          return (
            <motion.div
              key={c.coachId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
            >
              <Link
                to={`/community/${c.coachId}`}
                className="group block rounded-[24px] overflow-hidden bg-card border border-border/40 hover:border-[#FF6B2C]/30 hover:shadow-[0_12px_40px_-12px_rgba(255,107,44,0.25)] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300"
              >
                {/* Banner */}
                <div className="relative h-32 w-full overflow-hidden">
                  <SafeImage
                    src={cover}
                    alt={c.coachName}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    protect={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <span className="bg-white/15 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                      {c.sport || "Sport"}
                    </span>
                    {c.isVerified && (
                      <span className="bg-sky-500/90 text-white text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <h3 className="font-black text-lg text-foreground mb-1 truncate">
                    {c.coachName}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-snug">
                    {c.tagline || `Train and compete with the ${c.sport || "Circlo"} community.`}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                      <Users className="h-3.5 w-3.5 text-[#FF6B2C]" />
                      {fmt(c.memberCount)} member{c.memberCount === 1 ? "" : "s"}
                    </div>
                    <span className="bg-foreground text-background px-4 py-2 rounded-full text-xs font-black group-hover:bg-[#FF6B2C] transition-colors">
                      Join community
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedCommunities;
