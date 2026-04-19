import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Eye, Send } from "lucide-react";
import { PhoneFrame, StatusBar, Avatar, Chip } from "@/components/v2/shared";
import { useLiveSession } from "@/hooks/v2/useMocks";
import { cn } from "@/lib/utils";

export default function LiveViewerPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: live } = useLiveSession(sessionId);
  const [val, setVal] = useState("");

  return (
    <PhoneFrame className="min-h-[100dvh] pb-24">
      <StatusBar />
      <div className="w-full aspect-video bg-black relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 30%, rgba(255,107,44,0.35), transparent 50%),
                         radial-gradient(circle at 20% 70%, rgba(0,212,170,0.25), transparent 50%),
                         #000`,
          }}
        />
        <div className="absolute top-0 left-0 right-0 px-3.5 py-3 flex justify-between items-center z-10">
          <div className="flex gap-2 items-center">
            <button
              aria-label="Back"
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2.5 py-1 rounded-md bg-danger text-white text-[11px] font-extrabold tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white v2-pulse-dot" />
              LIVE
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-black/50 text-white text-[11px] font-semibold tnum flex items-center gap-1.5">
            <Eye size={12} />
            {live?.viewerCount ?? 0}
          </span>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-[3]">
          <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md mx-auto mb-2.5 flex items-center justify-center">
            <span className="text-3xl">📡</span>
          </div>
          <div className="text-white/60 text-[11px] font-semibold tracking-wider">BROADCASTING</div>
        </div>

        <div className="absolute right-4 bottom-20 flex flex-col gap-1 z-[5]">
          {["❤️", "🔥", "👏"].map((emoji, i) => (
            <span
              key={i}
              className="text-2xl"
              style={{
                animation: `v2-float-up 2s ease-out ${i * 0.5 + 0.2}s forwards`,
                opacity: 0,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <div className="absolute bottom-3.5 left-3.5 right-3.5 z-[5] flex flex-col gap-1.5 pointer-events-none">
          {(live?.chatMessages ?? []).slice(-3).map((m) => (
            <div
              key={m.id}
              className={cn(
                "px-2.5 py-1.5 backdrop-blur-md rounded-xl text-[12px] text-white max-w-[90%] flex gap-2",
                m.isSystem ? "bg-teal-dim text-teal font-semibold border border-teal/30" : "bg-black/55"
              )}
              style={{ animation: "v2-slide-up 0.4s ease-out both" }}
            >
              {!m.isSystem && (
                <span className={cn("font-bold shrink-0", m.isCoach ? "text-orange" : "text-teal")}>{m.author}</span>
              )}
              <span>{m.body}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pt-3.5 pb-2.5">
        <div className="flex gap-3 items-center">
          <div className="relative shrink-0">
            <Avatar size={44} gradient="teal-gold" />
            <span className="absolute bottom-[-2px] right-[-2px] w-3.5 h-3.5 rounded-full bg-danger border-2 border-navy-deep" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold">{live?.title}</div>
            <div className="text-[11px] text-v2-muted mt-0.5">{live?.coachName} · started 8m ago</div>
          </div>
          <button className="px-3.5 py-2 rounded-full bg-navy-card text-offwhite border border-teal font-bold text-[12px]">+ Follow</button>
        </div>
      </div>

      <div className="px-5 pt-2 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">
        LIVE CHAT · <span className="tnum">{live?.viewerCount}</span> watching
      </div>

      <div className="px-5 pb-3.5 flex-1 overflow-y-auto" style={{ maxHeight: 220 }}>
        {(live?.chatMessages ?? []).map((m) => {
          if (m.isSystem) {
            return (
              <div key={m.id} className="text-center py-2 text-[11px] text-teal font-semibold">
                {m.body}
              </div>
            );
          }
          const grad = m.isCoach ? "teal-gold" : m.author === "Yael" ? "orange-peach" : "teal-mint";
          return (
            <div
              key={m.id}
              className={cn(
                "px-3 py-2 rounded-[10px] mb-1.5 flex gap-2 items-start",
                m.isCoach ? "bg-orange-dim border-l-[3px] border-orange" : "bg-navy-card"
              )}
            >
              <Avatar size={24} gradient={grad as "teal-gold" | "orange-peach" | "teal-mint"} />
              <div className="flex-1">
                <div className="flex gap-1.5 items-center text-[11px]">
                  <span className={cn("font-bold", m.isCoach && "text-orange")}>{m.author}</span>
                  {m.isCoach && <Chip variant="orange" className="text-[9px] !px-1.5 !py-0.5">COACH</Chip>}
                  <span className="text-v2-muted tnum">just now</span>
                </div>
                <div className="text-[13px] mt-0.5">{m.body}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-3.5 pb-6 pt-2.5 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-navy-line v2-safe-bottom flex gap-2 items-center">
        <button className="w-10 h-10 rounded-full bg-navy-card flex items-center justify-center shrink-0">❤️</button>
        <button className="w-10 h-10 rounded-full bg-navy-card flex items-center justify-center shrink-0">🔥</button>
        <button className="w-10 h-10 rounded-full bg-navy-card flex items-center justify-center shrink-0">👏</button>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setVal("");
              navigate(`/v2/live/${sessionId}/ended`);
            }
          }}
          placeholder={`Ask ${live?.coachName?.split(" ")[0] ?? "the coach"} a question…`}
          className="flex-1 px-4 py-2.5 rounded-full bg-navy-card text-offwhite text-sm outline-none placeholder:text-v2-muted"
        />
        <button
          aria-label="Send"
          className="w-10 h-10 rounded-full bg-teal text-navy-deep flex items-center justify-center shrink-0"
        >
          <Send size={18} fill="currentColor" />
        </button>
      </div>
    </PhoneFrame>
  );
}
