import { Link } from "react-router-dom";
import { Users, CheckCircle } from "lucide-react";
import { useFeaturedCommunities } from "@/hooks/use-community";
import { SafeImage } from "@/components/ui/safe-image";
import SectionHeader from "./SectionHeader";

const fmt = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));

const FeaturedCommunities = () => {
  const { communities, loading } = useFeaturedCommunities();

  if (loading || communities.length === 0) return null;

  return (
    <section className="py-4">
      <div className="px-4 mb-3">
        <SectionHeader title="Communities" linkTo="/discover" linkLabel="See all" />
      </div>
      <div className="flex w-full max-w-full gap-3 overflow-x-auto hide-scrollbar px-4 pb-1">
        {communities.map((c) => (
          <Link
            key={c.coachId}
            to={`/community/${c.coachId}`}
            className="flex-shrink-0 w-44 rounded-2xl bg-card border border-border/20 overflow-hidden active:scale-[0.97] transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
          >
            {/* Cover gradient */}
            <div className="h-20 bg-brand-gradient-soft relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-gradient opacity-[0.06]" />
              <div className="absolute -bottom-5 left-3">
                <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-card bg-secondary shadow-sm">
                  {c.image ? (
                    <SafeImage src={c.image} alt={c.coachName} className="h-full w-full object-cover" loading="lazy" protect={false} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {c.coachName[0]}
                    </div>
                  )}
                </div>
              </div>
              {c.isVerified && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary fill-primary/20" />
                </div>
              )}
            </div>

            <div className="px-3 pt-7 pb-3 space-y-1.5">
              <p className="text-[12px] font-bold text-foreground truncate">{c.coachName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{c.tagline || c.sport + " community"}</p>
              <div className="flex items-center gap-1.5 pt-1">
                <Users className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">{fmt(c.memberCount)} members</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCommunities;
