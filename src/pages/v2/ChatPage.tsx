import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Phone, Video, Plus, Smile, Mic, Send, Calendar, Check, CheckCheck } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton, Avatar } from "@/components/v2/shared";
import { useChat, useMessageThreads } from "@/hooks/v2/useMocks";
import { formatPrice } from "@/lib/v2/currency";
import type { Message } from "@/types/v2";
import { cn } from "@/lib/utils";

function timeShort(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ m, gradient }: { m: Message; gradient: "teal-gold" | "orange-peach" | "teal-mint" }) {
  if (m.kind === "booking-ref" && m.bookingRef) {
    return (
      <div
        className="self-start max-w-[82%] ml-5 mb-2 p-3 rounded-[14px] cursor-pointer border border-teal-dim"
        style={{ background: "linear-gradient(135deg, #0f3b33, #0a2722)" }}
      >
        <div className="text-[10px] text-teal font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
          <Calendar size={10} /> BOOKING REMINDER
        </div>
        <div className="text-[13px] font-bold mb-0.5">{m.bookingRef.title}</div>
        <div className="text-[11px] text-v2-muted">{m.bookingRef.when}</div>
        <div className="flex gap-1.5 mt-2.5">
          <button className="flex-1 py-2 rounded-lg bg-black/25 text-offwhite text-[11px] font-semibold">Directions</button>
          <button className="flex-1 py-2 rounded-lg bg-teal text-navy-deep text-[11px] font-bold">Confirmed ✓</button>
        </div>
      </div>
    );
  }
  if (m.kind === "product-ref" && m.productRef) {
    return (
      <div className="self-start max-w-[80%] ml-5 mb-2 p-2.5 rounded-[18px_18px_18px_4px] bg-navy-card">
        <div className="flex gap-2.5 items-center mb-2">
          <div className="w-10 h-10 rounded-[10px] bg-orange-dim text-orange flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold">{m.productRef.title}</div>
            <div className="text-[11px] text-v2-muted mt-px tnum">{m.productRef.subtitle} · {formatPrice(m.productRef.priceILS)}</div>
          </div>
        </div>
        <button className="w-full py-2 rounded-lg bg-teal text-navy-deep text-[12px] font-bold">View details →</button>
      </div>
    );
  }
  if (m.isMe) {
    return (
      <div className="self-end max-w-[78%] mr-5 mb-1 px-3.5 py-2.5 rounded-[18px_18px_4px_18px] bg-teal text-navy-deep text-sm font-medium">
        {m.body}
        <div className="text-[10px] text-navy-deep/60 text-right mt-1 flex justify-end items-center gap-0.5 tnum">
          {m.read ? <><CheckCheck size={10} className="text-navy-deep" /> Read {timeShort(m.sentAt)}</> : m.delivered ? <><Check size={10} /> Delivered</> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2 items-end ml-5 mr-5 mb-1.5">
      <Avatar size={26} gradient={gradient} />
      <div className="max-w-[80%] px-3.5 py-2.5 rounded-[18px_18px_18px_4px] bg-navy-card text-sm leading-snug">{m.body}</div>
    </div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { threadId } = useParams<{ threadId: string }>();
  const { data: messages = [], isLoading } = useChat(threadId);
  const { data: threads = [] } = useMessageThreads();
  const thread = threads.find((t) => t.id === threadId);
  const [val, setVal] = useState("");

  const grad =
    thread?.peerGradient === "orange-peach"
      ? "orange-peach"
      : thread?.peerGradient === "teal-mint"
      ? "teal-mint"
      : "teal-gold";

  return (
    <PhoneFrame className="min-h-[100dvh] pb-24">
      <StatusBar />
      <header className="px-5 pt-2.5 pb-3 flex items-center justify-between border-b border-navy-line">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate("/v2/messages")}>
          <ChevronLeft size={14} />
        </RoundButton>
        <button className="flex-1 flex items-center justify-center gap-2.5">
          <Avatar size={34} gradient={grad} online={thread?.peerIsOnline} />
          <div className="text-left">
            <div className="text-[14px] font-bold">{thread?.peerName ?? "Chat"}</div>
            {thread?.peerIsOnline && <div className="text-[11px] text-teal font-semibold">Active now</div>}
          </div>
        </button>
        <div className="flex gap-1.5">
          <RoundButton ariaLabel="Call" variant="solid-navy" size="sm"><Phone size={14} /></RoundButton>
          <RoundButton ariaLabel="Video" variant="solid-navy" size="sm"><Video size={14} /></RoundButton>
        </div>
      </header>

      <main className="flex-1 pt-3 pb-32 flex flex-col">
        {isLoading && <div className="text-center text-v2-muted text-[12px] py-6">Loading…</div>}
        {!isLoading && messages.length === 0 && (
          <div className="px-8 py-12 text-center text-v2-muted text-[13px]">
            No messages yet. Say hi!
          </div>
        )}
        {messages.map((m) => <MessageBubble key={m.id} m={m} gradient={grad} />)}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-3.5 pb-6 pt-2.5 bg-[rgba(10,10,15,0.96)] backdrop-blur-xl border-t border-navy-line v2-safe-bottom flex gap-2 items-end">
        <button aria-label="Attach" className="w-9 h-9 rounded-full bg-navy-card flex items-center justify-center shrink-0">
          <Plus size={16} />
        </button>
        <div className="flex-1 bg-navy-card rounded-[20px] px-3.5 py-2 flex gap-2 items-center min-h-[40px]">
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={`Message ${thread?.peerName?.split(" ")[0] ?? ""}…`}
            className="flex-1 bg-transparent border-none outline-none text-offwhite text-sm py-0.5"
          />
          <button aria-label="Emoji"><Smile size={18} className="text-v2-muted" /></button>
          <button aria-label="Voice"><Mic size={18} className="text-v2-muted" /></button>
        </div>
        <button
          aria-label="Send"
          className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", val ? "bg-teal text-navy-deep" : "bg-navy-card text-v2-muted")}
        >
          <Send size={16} fill={val ? "currentColor" : "none"} />
        </button>
      </div>
    </PhoneFrame>
  );
}
