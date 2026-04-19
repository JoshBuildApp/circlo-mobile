import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Share2, Video, Bell, Star, Clock } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StatusBar, RoundButton, Avatar, Chip } from "@/components/v2/shared";
import { useLiveSession } from "@/hooks/v2/useMocks";

export default function LiveEndedPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: live } = useLiveSession(sessionId);
  const [rating, setRating] = useState<number>(0);
  const [notified, setNotified] = useState(false);

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <header className="px-5 pt-3.5 flex justify-between items-center">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate("/v2/coach/maya/content")}>
          <ChevronLeft size={14} />
        </RoundButton>
        <div className="text-[14px] font-bold">Session ended</div>
        <RoundButton ariaLabel="Share" variant="solid-navy" size="sm">
          <Share2 size={14} />
        </RoundButton>
      </header>

      <main className="px-5 pt-6 pb-5 text-center">
        <div className="w-[72px] h-[72px] rounded-full mx-auto mb-4" style={{ background: "linear-gradient(135deg, #00D4AA, #ffd97a)" }} />
        <h1 className="text-[24px] font-extrabold tracking-tight mb-1.5">That was great 🎾</h1>
        <p className="text-[13px] text-v2-muted leading-relaxed">
          {live?.coachName ?? "Your coach"} wrapped up.<br />Recording available in 5 minutes.
        </p>
        <div className="flex gap-1.5 justify-center flex-wrap mt-5">
          <Chip variant="teal">42 min</Chip>
          <Chip><span className="tnum">{live?.viewerCount ?? 0}</span> watched live</Chip>
          <Chip><span className="tnum">1.2K</span> reactions</Chip>
        </div>
      </main>

      <div className="px-5 mb-3.5">
        <div
          className="p-4 rounded-[16px] border border-teal-dim"
          data-grad="teal-soft"
        >
          <div className="flex gap-3 items-center mb-3">
            <div className="w-10 h-10 rounded-[10px] bg-teal text-navy-deep flex items-center justify-center shrink-0">
              <Video size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold">Replay available soon</div>
              <div className="text-[11px] text-v2-muted mt-0.5">We'll notify you when it's ready</div>
            </div>
          </div>
          <button
            onClick={() => {
              setNotified(true);
              toast.success("We'll let you know when the replay is ready.");
            }}
            disabled={notified}
            className="w-full py-2.5 rounded-md bg-teal text-navy-deep font-bold text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <Bell size={14} /> {notified ? "We'll notify you ✓" : "Notify me"}
          </button>
        </div>
      </div>

      <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">QUICK HIGHLIGHTS</div>
      <div className="px-5 mb-4 flex flex-col gap-2">
        {[
          { time: "12:34", title: "Grip pressure demo", sub: "Requested by 8 viewers", tone: "teal" },
          { time: "28:02", title: "Slow-mo serve analysis", sub: "Peak engagement → 237 concurrent", tone: "orange" },
          { time: "35:18", title: "Q&A session starts", sub: "14 questions answered", tone: "teal" },
        ].map((h) => (
          <div key={h.title} className="p-3.5 rounded-[14px] bg-navy-card flex gap-3 items-start">
            <div className={`w-7 h-7 rounded-md ${h.tone === "teal" ? "bg-teal-dim text-teal" : "bg-orange-dim text-orange"} flex items-center justify-center shrink-0 mt-0.5`}>
              <Clock size={14} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold leading-snug">
                {h.title} at <span className={`tnum font-bold ${h.tone === "teal" ? "text-teal" : "text-orange"}`}>{h.time}</span>
              </div>
              <div className="text-[11px] text-v2-muted mt-0.5">{h.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 mb-3.5">
        <button
          onClick={() => navigate(`/v2/book/${live?.coachId ?? "maya"}`)}
          className="w-full p-4 rounded-[16px] flex gap-3 items-center text-left border border-orange-dim"
          data-grad="orange-soft"
        >
          <Avatar size={44} gradient="teal-gold" />
          <div className="flex-1">
            <div className="text-[14px] font-bold">Practice what you learned</div>
            <div className="text-[11px] text-v2-muted mt-0.5">Book a 1-on-1 with {live?.coachName?.split(" ")[0] ?? "Maya"}</div>
          </div>
          <div className="px-3.5 py-2.5 rounded-md bg-orange text-white font-bold text-[13px]">Book</div>
        </button>
      </div>

      <div className="px-5 mb-3.5">
        <div className="p-3.5 rounded-[14px] bg-navy-card flex gap-3 items-center">
          <div className="w-10 h-10 rounded-[10px] bg-teal-dim text-teal flex items-center justify-center shrink-0">
            <Star size={20} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold">Rate this session</div>
            <div className="text-[11px] text-v2-muted mt-0.5">Help your coach improve future content</div>
          </div>
          <div className="flex gap-1 text-base">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setRating(n);
                  toast.success(`Thanks for the ${n}-star rating!`);
                }}
                className={n <= rating ? "text-orange" : "text-v2-muted"}
                aria-label={`Rate ${n} stars`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">UPCOMING</div>
      <div className="px-5 pb-12">
        <div className="p-3.5 rounded-[14px] bg-navy-card flex gap-3 items-center">
          <div className="w-12 text-center shrink-0">
            <div className="text-[10px] text-orange font-bold tracking-wider">SUN</div>
            <div className="text-[22px] font-extrabold tracking-tight tnum">14</div>
          </div>
          <div className="w-px h-9 bg-navy-line" />
          <div className="flex-1">
            <div className="text-[13px] font-bold">Weekly Q&amp;A · 19:00</div>
            <div className="text-[11px] text-v2-muted mt-0.5">Circle members only</div>
          </div>
          <button className="px-3 py-1.5 rounded-full bg-navy-card-2 text-offwhite font-semibold text-[11px] flex items-center gap-1">
            <Bell size={11} /> Remind
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
