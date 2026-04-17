import { Calendar, Clock, DollarSign, Dumbbell, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { BookingMetadata } from "@/hooks/use-messages";

interface ChatBookingCardProps {
  metadata: BookingMetadata;
  isOwn: boolean;
  onAccept?: (bookingId: string) => void;
  onDecline?: (bookingId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pending", color: "text-amber-500", icon: Loader2 },
  confirmed: { label: "Confirmed", color: "text-emerald-500", icon: CheckCircle2 },
  cancelled: { label: "Declined", color: "text-red-400", icon: XCircle },
  completed: { label: "Completed", color: "text-primary", icon: CheckCircle2 },
};

export function ChatBookingCard({ metadata, isOwn, onAccept, onDecline }: ChatBookingCardProps) {
  const status = statusConfig[metadata.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const formattedDate = (() => {
    try {
      return format(new Date(metadata.date), "EEE, MMM d");
    } catch {
      return metadata.date;
    }
  })();

  return (
    <div
      className={cn(
        "w-64 rounded-xl overflow-hidden border",
        isOwn
          ? "bg-background/10 border-background/20"
          : "bg-background border-border"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-3 py-2 flex items-center gap-2",
        "bg-gradient-to-r from-[#00D4AA]/20 to-[#FF6B2C]/20"
      )}>
        <Dumbbell className={cn("h-3.5 w-3.5", isOwn ? "text-background/70" : "text-foreground/70")} />
        <span className={cn("text-xs font-semibold tracking-wide uppercase", isOwn ? "text-background/80" : "text-foreground/80")}>
          Booking Request
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-2">
        {/* Coach & sport */}
        <div>
          <p className={cn("text-sm font-bold leading-tight", isOwn ? "text-background" : "text-foreground")}>
            {metadata.coach_name}
          </p>
          <p className={cn("text-[11px]", isOwn ? "text-background/60" : "text-muted-foreground")}>
            {metadata.sport}{metadata.training_type ? ` · ${metadata.training_type}` : ""}
          </p>
        </div>

        {/* Details row */}
        <div className={cn(
          "flex flex-wrap gap-x-3 gap-y-1 text-[11px]",
          isOwn ? "text-background/70" : "text-muted-foreground"
        )}>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {metadata.time}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {metadata.price > 0 ? `₪${metadata.price}` : "Free"}
          </span>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <StatusIcon className={cn("h-3.5 w-3.5", status.color, metadata.status === "pending" && "animate-spin")} />
          <span className={cn("text-xs font-medium", status.color)}>
            {status.label}
          </span>
        </div>

        {/* Action buttons — only for coach viewing a pending request */}
        {!isOwn && metadata.status === "pending" && onAccept && onDecline && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onAccept(metadata.booking_id)}
              className="flex-1 h-8 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 active:scale-95 transition-all"
            >
              Accept
            </button>
            <button
              onClick={() => onDecline(metadata.booking_id)}
              className="flex-1 h-8 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 active:scale-95 transition-all"
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
