import { useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { X, Check, Calendar, MessageSquare } from "lucide-react";
import { PhoneFrame, StatusBar, Avatar } from "@/components/v2/shared";
import { useSession } from "@/hooks/v2/useMocks";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function fmtTimeRange(startIso: string, endIso: string) {
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  return `${new Date(startIso).toLocaleTimeString([], opts)} → ${new Date(endIso).toLocaleTimeString([], opts)}`;
}

export default function BookingSuccessPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const reduceMotion = useReducedMotion();
  const { data: session } = useSession(bookingId);
  const refLabel = session?.ref ?? bookingId ?? "—";
  const coachName = session?.coachName ?? "Maya Rosenfeld";
  const formatLabel = session?.format === "group" ? "Group · 90 min" : session?.format === "video-review" ? "Video review" : `1-on-1 · ${session?.durationMin ?? 60} min`;
  const whenLabel = session ? fmtDate(session.startsAt) : "Fri";
  const timeLabel = session ? fmtTimeRange(session.startsAt, session.endsAt) : "18:00 → 19:00";
  const where = session?.location ?? "Jaffa Padel Club";
  const whereSub = session?.locationSubline ?? "2.1 km away";

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12 relative">
      <StatusBar />
      <button
        onClick={() => navigate("/v2/home")}
        aria-label="Close"
        className="absolute top-5 right-5 z-50 w-9 h-9 rounded-full bg-navy-card flex items-center justify-center"
      >
        <X size={14} />
      </button>

      <main className="px-6 pt-20 text-center">
        <motion.div
          initial={reduceMotion ? false : { scale: 0 }}
          animate={reduceMotion ? false : { scale: [0, 1.1, 1] }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-[110px] h-[110px] rounded-full bg-teal flex items-center justify-center mx-auto mb-6"
          style={{ boxShadow: "0 0 60px rgba(0,212,170,0.4)" }}
        >
          <Check size={56} strokeWidth={3} className="text-navy-deep" />
        </motion.div>

        <h1 className="text-[32px] font-extrabold tracking-tight mb-2">You're booked! 🎾</h1>
        <p className="text-[14px] text-v2-muted mb-8 leading-relaxed">
          Your coach will confirm within a few hours.<br />
          You'll get a notification when they do.
        </p>
      </main>

      <div className="px-5 mb-3.5">
        <div
          className="p-5 rounded-[18px] border border-teal-dim"
          data-grad="teal-soft"
        >
          <div className="flex justify-between items-center mb-3.5">
            <div className="text-[10px] font-bold text-teal tracking-wider">✓ CONFIRMED</div>
            <div className="text-[11px] text-v2-muted font-semibold tnum">#{refLabel}</div>
          </div>
          <div className="flex gap-3.5 items-center mb-3.5">
            <Avatar size={48} gradient="teal-gold" />
            <div>
              <div className="text-[15px] font-bold">{coachName}</div>
              <div className="text-[12px] text-v2-muted">{formatLabel}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-[10px] bg-black/20">
              <div className="text-[10px] text-teal font-bold tracking-wider">WHEN</div>
              <div className="text-[13px] font-bold mt-0.5">{whenLabel}</div>
              <div className="text-[11px] text-v2-muted mt-0.5 tnum">{timeLabel}</div>
            </div>
            <div className="p-3 rounded-[10px] bg-black/20">
              <div className="text-[10px] text-teal font-bold tracking-wider">WHERE</div>
              <div className="text-[13px] font-bold mt-0.5">{where}</div>
              <div className="text-[11px] text-v2-muted mt-0.5">{whereSub}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-5 mb-3.5">
        <button className="py-3.5 rounded-[14px] bg-navy-card text-offwhite text-[13px] font-semibold flex flex-col items-center gap-1.5">
          <Calendar size={18} className="text-teal" />
          Add to calendar
        </button>
        <button
          onClick={() => navigate("/v2/messages/th-maya")}
          className="py-3.5 rounded-[14px] bg-navy-card text-offwhite text-[13px] font-semibold flex flex-col items-center gap-1.5"
        >
          <MessageSquare size={18} className="text-teal" />
          Message Maya
        </button>
      </div>

      <div className="px-5 mb-3.5">
        <div className="p-4 rounded-[16px] bg-navy-card">
          <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase mb-3">WHAT HAPPENS NEXT</div>
          {[
            { n: 1, active: true, t: "Coach reviews and confirms (usually within 2h)" },
            { n: 2, active: false, t: "You'll get a reminder 1h before the session" },
            { n: 3, active: false, t: "Show up, play, get a video recap after" },
          ].map((s) => (
            <div key={s.n} className="flex gap-3 py-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[11px] shrink-0 tnum ${
                  s.active ? "bg-teal text-navy-deep" : "bg-navy-card-2 text-v2-muted"
                }`}
              >
                {s.n}
              </div>
              <div className={`text-[13px] leading-snug ${s.active ? "text-offwhite" : "text-v2-muted"}`}>
                {s.t}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mb-3.5">
        <button
          onClick={() => navigate("/v2/coach/maya/join")}
          className="w-full p-3.5 rounded-[14px] flex items-center gap-3 text-left border border-orange-dim"
          data-grad="orange-soft"
        >
          <Avatar size={40} gradient="teal-gold" />
          <div className="flex-1">
            <div className="text-[13px] font-bold">Join Maya's Circle</div>
            <div className="text-[11px] text-v2-muted mt-0.5">Get 15% off every future session</div>
          </div>
          <div className="px-3.5 py-2 rounded-full bg-orange text-white text-[12px] font-bold">View tiers</div>
        </button>
      </div>

      <div className="px-5 pb-12">
        <button
          onClick={() => navigate("/v2/home")}
          className="w-full py-3.5 rounded-[14px] bg-transparent text-v2-muted border border-navy-line text-[13px] font-semibold"
        >
          Back to home
        </button>
      </div>
    </PhoneFrame>
  );
}
