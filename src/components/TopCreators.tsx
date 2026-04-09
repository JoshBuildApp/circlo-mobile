import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import type { Coach } from "@/data/coaches";

interface TopCreatorsProps {
  coaches: Coach[];
}

const formatFollowers = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
};

const TopCreators = ({ coaches }: TopCreatorsProps) => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Top Creators</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-5">The coaches shaping the game</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {coaches.map((coach, i) => (
            <Link
              key={coach.id}
              to={`/coach/${coach.id}`}
              className="group block animate-fade-in opacity-0"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_8px_40px_hsl(0,100%,59%,0.1)]">
                <div className="aspect-[3/4] overflow-hidden relative">
                  <SafeImage
                    src={coach.image}
                    alt={coach.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-heading text-lg font-bold text-foreground mb-0.5">
                      {coach.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">{coach.sport} · {coach.location}</p>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span className="font-semibold text-foreground">{formatFollowers(coach.followers)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                        Check out
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopCreators;
