import { Link } from "react-router-dom";
import { Compass, Clapperboard } from "lucide-react";

const CtaSection = () => (
  <div className="px-4 pt-8 pb-6">
    <div className="bg-secondary rounded-2xl p-6 text-center">
      <p className="text-lg font-bold text-foreground mb-1">Ready for more?</p>
      <p className="text-[13px] text-muted-foreground mb-5 max-w-[240px] mx-auto">
        Explore coaches, watch reels, and find your circle.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          to="/discover"
          className="flex items-center justify-center gap-2 bg-background text-foreground h-12 px-6 rounded-xl text-[13px] font-bold active:scale-95 transition-transform border border-border touch-target"
        >
          <Compass className="h-4 w-4" strokeWidth={1.8} />
          Discover
        </Link>
        <Link
          to="/reels"
          className="flex items-center justify-center gap-2 bg-foreground text-background h-12 px-6 rounded-xl text-[13px] font-bold active:scale-95 transition-transform touch-target"
        >
          <Clapperboard className="h-4 w-4" strokeWidth={1.8} />
          Watch Reels
        </Link>
      </div>
    </div>
  </div>
);

export default CtaSection;
