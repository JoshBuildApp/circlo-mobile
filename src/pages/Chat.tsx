import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Users, Check, CheckCheck, Loader2, Mic, Plus, Info } from "lucide-react";
import { useMessages } from "@/hooks/use-messages";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getActivityLabel } from "@/hooks/use-activity";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { usePresenceHeartbeat } from "@/hooks/use-presence-heartbeat";
import { useMessageLimits } from "@/hooks/use-rate-limits";
import { toast } from "sonner";

const Chat = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messages, loading, loadingOlder, hasMore, sendMessage, loadOlder } = useMessages(partnerId || "");
  const messageLimits = useMessageLimits(partnerId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ name: string; avatar: string | null }>({ name: "Loading...", avatar: null });
  const partnerStatus = useOnlineStatus(partnerId);
  const partnerStatusLabel = getActivityLabel(partnerStatus.status);
  const { isPartnerTyping, onKeystroke, stopTyping } = useTypingIndicator(partnerId);
  usePresenceHeartbeat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!partnerId) return;
    const load = async () => {
      const { data: coach } = await supabase
        .from("coach_profiles")
        .select("coach_name, image_url")
        .eq("user_id", partnerId)
        .maybeSingle();
      if (coach) {
        setPartnerInfo({ name: coach.coach_name, avatar: coach.image_url });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", partnerId)
        .maybeSingle();
      if (profile) {
        setPartnerInfo({ name: profile.username, avatar: profile.avatar_url });
      }
    };
    load();
  }, [partnerId]);

  const prevMessageCountRef = useRef(0);
  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const addedToTop = messages.length > prevMessageCountRef.current && prevScrollHeightRef.current > 0 && loadingOlder === false && el.scrollTop < 100;

    if (addedToTop && prevScrollHeightRef.current < el.scrollHeight) {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, loadingOlder]);

  const handleLoadOlder = async () => {
    if (!scrollRef.current) return;
    prevScrollHeightRef.current = scrollRef.current.scrollHeight;
    await loadOlder();
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;

    if (!messageLimits.hasBooking && !messageLimits.canSend) {
      if (messageLimits.inboxFull) {
        toast.error("This coach's inbox is full — try again later");
      } else {
        toast.error("You've reached your daily message limit. Book a session to unlock unlimited messaging");
      }
      return;
    }

    const msg = text;
    setText("");
    stopTyping();
    setSending(true);
    try {
      await sendMessage(msg, undefined, {
        canSend: messageLimits.canSend,
        hasBooking: messageLimits.hasBooking,
        inboxFull: messageLimits.inboxFull,
        sentToday: messageLimits.sentToday,
        cap: messageLimits.cap,
        incrementMessageCount: messageLimits.incrementMessageCount,
      });
    } catch (err: any) {
      if (err?.message === "INBOX_FULL") {
        toast.error("This coach's inbox is full — try again later");
      } else if (err?.message === "MESSAGE_LIMIT") {
        toast.error("Daily message limit reached. Book a session for unlimited messaging");
      }
    }
    setSending(false);
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background relative">
      {/* Glass floating header */}
      <header className="fixed top-0 left-0 right-0 z-20 pt-2 app-top-nav">
        <div className="mx-3 mt-2 flex justify-between items-center px-4 py-3 bg-card/80 backdrop-blur-2xl border border-border/40 rounded-b-2xl shadow-lg">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate("/inbox")}
              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted/40 active:scale-95 transition-all flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-card border border-[#46f1c5]/30">
                {partnerInfo.avatar ? (
                  <img src={partnerInfo.avatar} alt={partnerInfo.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-kinetic">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              {partnerStatus.status === "online" && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#46f1c5] rounded-full border-2 border-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base tracking-tight text-foreground leading-none truncate">
                {partnerInfo.name}
              </h1>
              {isPartnerTyping ? (
                <span className="text-[10px] font-bold text-[#46f1c5] uppercase tracking-widest animate-pulse">
                  Typing...
                </span>
              ) : partnerStatusLabel ? (
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  partnerStatus.status === "online" ? "text-[#46f1c5]" : "text-muted-foreground"
                )}>
                  {partnerStatusLabel}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-24 pb-32 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 border-2 border-[#46f1c5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-card border border-[#46f1c5]/20 flex items-center justify-center mb-3">
              {partnerInfo.avatar ? (
                <img src={partnerInfo.avatar} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <Users className="h-6 w-6 text-[#46f1c5]" />
              )}
            </div>
            <p className="text-sm font-bold text-foreground">{partnerInfo.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Start the conversation</p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadOlder}
                  disabled={loadingOlder}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-card border border-border/40 disabled:opacity-50"
                >
                  {loadingOlder ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load earlier"
                  )}
                </button>
              </div>
            )}

            {messages.map((msg, i) => {
              const isMine = msg.sender_id === user.id;
              const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 300000;
              return (
                <div key={msg.id}>
                  {showTime && (
                    <div className="flex justify-center py-2">
                      <span className="px-4 py-1 rounded-full bg-card border border-border/40 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                        {format(new Date(msg.created_at), "MMM d · h:mm a")}
                      </span>
                    </div>
                  )}
                  {isMine ? (
                    <div className="flex justify-end">
                      <div
                        className={cn(
                          "max-w-[85%] bg-gradient-kinetic px-4 py-3 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl text-white text-sm leading-relaxed shadow-lg",
                          msg._pending && "opacity-60"
                        )}
                      >
                        {msg.content}
                        <span className="inline-flex items-center ml-2 -mb-0.5" title={msg.read_at ? `Read ${format(new Date(msg.read_at), "MMM d, h:mm a")}` : undefined}>
                          {msg._pending ? (
                            <Check className="h-3 w-3 text-white/60" />
                          ) : msg.read_at ? (
                            <CheckCheck className="h-3 w-3 text-white" />
                          ) : (
                            <CheckCheck className="h-3 w-3 text-white/60" />
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2 max-w-[85%]">
                      <div className="flex-shrink-0 mb-1">
                        {partnerInfo.avatar ? (
                          <img src={partnerInfo.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-kinetic" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "bg-card border border-border/40 px-4 py-3 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl text-foreground text-sm leading-relaxed",
                          msg._pending && "opacity-60"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isPartnerTyping && (
              <div className="flex items-end gap-2">
                <div className="flex-shrink-0 mb-1">
                  {partnerInfo.avatar ? (
                    <img src={partnerInfo.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-kinetic" />
                  )}
                </div>
                <div className="bg-card border border-border/40 px-4 py-3 rounded-full flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#46f1c5]/40 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#46f1c5]/60 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#46f1c5]/80 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Glass floating input */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-background via-background/80 to-transparent app-bottom-nav">
        {!messageLimits.loading && !messageLimits.hasBooking && (
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {messageLimits.sentToday} / {messageLimits.cap} today
            </span>
            {messageLimits.inboxFull && (
              <span className="text-[10px] text-[#ffb59a] font-bold uppercase tracking-wider">High demand</span>
            )}
          </div>
        )}
        <div className="bg-card/80 backdrop-blur-2xl border border-border/60 rounded-full flex items-center px-3 py-2 gap-2 shadow-2xl">
          <button className="text-muted-foreground hover:text-[#46f1c5] transition-colors flex-shrink-0">
            <Plus className="h-5 w-5" />
          </button>
          <div className="flex-1 bg-muted/40 rounded-full px-4 py-2">
            <input
              value={text}
              onChange={(e) => { setText(e.target.value); onKeystroke(); }}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={
                !messageLimits.hasBooking && !messageLimits.canSend
                  ? "Daily message limit reached"
                  : messageLimits.inboxFull
                    ? "Inbox is full"
                    : "Type a message..."
              }
              disabled={!messageLimits.hasBooking && (!messageLimits.canSend || messageLimits.inboxFull)}
              className="bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground/60 w-full disabled:opacity-50"
            />
          </div>
          <button className="text-muted-foreground hover:text-[#46f1c5] transition-colors flex-shrink-0">
            <Mic className="h-5 w-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending || (!messageLimits.hasBooking && !messageLimits.canSend)}
            className="h-10 w-10 rounded-full bg-gradient-kinetic flex items-center justify-center text-white shadow-[0_6px_18px_rgba(0,212,170,0.25)] disabled:opacity-30 disabled:shadow-none active:scale-90 transition-all flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
