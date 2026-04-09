import { Link } from "react-router-dom";
import { Users, Star, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";
import { SafeImage } from "@/components/ui/safe-image";
import type { HomeCoach } from "@/hooks/use-home-data";

interface TopCoachesProps {
  coaches: HomeCoach[];
}

const TopCoaches = ({ coaches }: TopCoachesProps) => {
  if (coaches.length === 0) return null;

  return (
    <div className="px-4">
      <SectionHeader title="Top Coaches" linkTo="/discover" linkLabel="Explore" />
      <div className="flex w-full max-w-full gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory -mx-4 px-4">
        {coaches.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Link
              to={`/coach/${c.id}`}
              className="flex-shrink-0 w-[150px] bg-card rounded-2xl overflow-hidden active:scale-[0.96] transition-transform duration-150 border border-border/40 shadow-sm hover:shadow-md block"
            >
              <div className="h-[110px] bg-secondary relative">
                <SafeImage
                  src={c.image_url || undefined}
                  alt={c.coach_name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  displayWidth={200}
                  srcSetWidths={[160, 320]}
                  sizes="160px"
                  fallbackIcon={<Users className="h-8 w-8 text-muted-foreground/20" />}
                />
                {c.is_verified && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#00D4AA] flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="p-2.5">
                <p className="text-[13px] font-bold text-foreground truncate leading-tight">{c.coach_name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{c.sport}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-0.5">
                    {c.rating && (
                      <>
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] text-muted-foreground font-semibold">{c.rating}</span>
                      </>
                    )}
                  </div>
                  {c.price != null && c.price > 0 && (
                    <span className="text-[11px] font-bold text-[#00D4AA]">₪{c.price}</span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TopCoaches;
