import { Link } from "react-router-dom";
import { Clock, ChevronRight } from "lucide-react";

interface NextAvailableProps {
  coachName?: string;
  coachId?: string;
  time?: string;
}

const NextAvailable = ({ coachName, coachId, time }: NextAvailableProps) => {
  if (!coachName || !coachId) return null;

  return (
    <div className="px-4 pt-6">
      <Link
        to={`/coach/${coachId}`}
        className="flex items-center gap-3 bg-secondary rounded-2xl p-4 active:bg-muted transition-colors touch-target"
      >
        <div className="h-11 w-11 rounded-full bg-background flex items-center justify-center flex-shrink-0 border border-border">
          <Clock className="h-5 w-5 text-foreground" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-accent font-semibold uppercase tracking-wider">Next Available</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            Train {time ? `today at ${time}` : "now"} with {coachName}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </Link>
    </div>
  );
};

export default NextAvailable;
