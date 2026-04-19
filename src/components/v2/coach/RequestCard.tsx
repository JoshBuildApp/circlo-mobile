import { Avatar } from "@/components/v2/shared";
import { formatPrice } from "@/lib/v2/currency";
import type { BookingRequest } from "@/types/v2";

function relTime(iso: string) {
  const d = new Date(iso);
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface RequestCardProps {
  req: BookingRequest;
  onAccept: () => void;
  onDecline: () => void;
  detailed?: boolean;
}

export function RequestCard({ req, onAccept, onDecline, detailed }: RequestCardProps) {
  const grad = req.studentName.toLowerCase().includes("yael") ? "orange-peach" : "teal-gold";
  const fmtLabel =
    req.format === "one-on-one" ? `1-on-1 · ${req.durationMin} min` :
    req.format === "group" ? `Group · ${req.durationMin} min` :
    "Video review · async";
  return (
    <div className="p-3.5 rounded-[16px] bg-navy-card border-l-[3px] border-l-teal mb-2.5">
      <div className="flex gap-2.5 items-center mb-2.5">
        <Avatar size={36} gradient={grad} />
        <div className="flex-1">
          <div className="text-[14px] font-bold">{req.studentName}</div>
          {req.studentLevel && (
            <div className="text-[11px] text-v2-muted mt-0.5">
              Padel · {req.studentLevel}
              {req.isNewStudent && <span className="text-teal"> · New student</span>}
              {req.pastSessionCount !== undefined && !req.isNewStudent && ` · ${req.pastSessionCount} past sessions`}
            </div>
          )}
        </div>
        <div className="text-[11px] text-v2-muted ml-auto self-start mt-0.5">{relTime(req.createdAt)}</div>
      </div>

      {detailed ? (
        <div className="p-3 rounded-[12px] bg-navy-card-2 mb-2.5">
          <div className="flex justify-between mb-2">
            <strong className="text-offwhite text-[13px] font-bold">{fmtLabel}</strong>
            <span className="text-orange font-bold text-[13px] tnum">{formatPrice(req.priceILS)}{req.quantity ? ` × ${req.quantity}` : ""}</span>
          </div>
          {req.startsAt && (
            <div className="text-[12px] text-v2-muted leading-snug">
              {new Date(req.startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {new Date(req.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {req.location && ` · ${req.location}`}
            </div>
          )}
          {req.note && (
            <div className="text-[12px] text-offwhite leading-snug mt-2 pt-2 border-t border-navy-line italic">"{req.note}"</div>
          )}
          {req.bringing && (
            <div className="text-[12px] text-offwhite leading-snug mt-2 pt-2 border-t border-navy-line">
              Bringing <strong>{req.bringing}</strong> (new to Circlo)
            </div>
          )}
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-[10px] bg-navy-card-2 text-[12px] text-v2-muted mb-2.5">
          <strong className="text-offwhite font-semibold">{fmtLabel}</strong>
          {req.startsAt && ` · ${new Date(req.startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${new Date(req.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          {req.location && ` · ${req.location}`}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onDecline} className="flex-1 py-2.5 rounded-md bg-transparent text-v2-muted border border-navy-line text-[13px] font-bold">
          Decline
        </button>
        <button onClick={onAccept} className="flex-1 py-2.5 rounded-md bg-teal text-navy-deep text-[13px] font-bold">
          Accept{detailed && " ✓"}
        </button>
      </div>
    </div>
  );
}
