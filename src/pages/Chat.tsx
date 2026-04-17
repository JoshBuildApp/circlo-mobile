import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Users, Check, CheckCheck, Loader2 } from "lucide-react";
import { useMessages, Message } from "@/hooks/use-messages";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { ActiveIndicator } from "@/components/ActiveIndicator";
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

  // Load partner info
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

  // Auto-scroll to bottom on new messages (but not when loading older)
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const addedToTop = messages.length > prevMessageCountRef.current && prevScrollHeightRef.current > 0 && loadingOlder === false && el.scrollTop < 100;

    if (addedToTop && prevScrollHeightRef.current < el.scrollHeight) {
      // Preserve scroll position after prepending older messages
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
    } else {
      // Normal new message: scroll to bottom
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

    // Check message limits for non-booked pairs
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
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Chat header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border safe-area-top">
        <div className="flex items-center gap-3 h-14 px-4">
          <button onClick={() => navigate("/inbox")} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary active:scale-95 transition-all">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="relative h-9 w-9 rounded-full overflow-hidden bg-secondary flex-shrink-0">
            {partnerInfo.avatar ? (
              <img src={partnerInfo.avatar} alt={partnerInfo.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Users className="h-4 w-4 text-muted-foreground/30" />
              </div>
            )}
            <ActiveIndicator isActive={partnerStatus.status === "online"} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{partnerInfo.name}</p>
            {isPartnerTyping ? (
              <p className="text-[10px] text-green-500 animate-pulse">Typing...</p>
            ) : partnerStatusLabel ? (
              <p className={cn("text-[10px]", partnerStatus.status === "online" ? "text-green-500" : "text-muted-foreground")}>{partnerStatusLabel}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-3">
              {partnerInfo.avatar ? (
                <img src={partnerInfo.avatar} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <Users className="h-6 w-6 text-muted-foreground/20" />
              )}
            </div>
            <p className="text-sm font-bold text-foreground">{partnerInfo.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Start the conversation</p>
          </div>
        ) : (
          <>
          {hasMore && (
            <div className="flex justify-center py-2">
              <button
                onClick={handleLoadOlder}
                disabled={loadingOlder}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary disabled:opacity-50"
              >
                {loadingOlder ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load earlier messages"
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
                  <p className="text-center text-[10px] text-muted-foreground/60 my-3">
                    {format(new Date(msg.created_at), "MMM d, h:mm a")}
                  </p>
                )}
                <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      isMine
                        ? "bg-foreground text-background rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md",
                      msg._pending && "opacity-60"
                    )}
                  >
                    {msg.content}
                    {isMine && (
                      <span className="inline-flex items-center ml-1.5 -mb-0.5" title={msg.read_at ? `Read ${format(new Date(msg.read_at), "MMM d, h:mm a")}` : undefined}>
                        {msg._pending ? (
                          <Check className="h-3 w-3 text-background/40" />
                        ) : msg.read_at ? (
                          <CheckCheck className="h-3 w-3 text-primary" />
                        ) : (
                          <CheckCheck className="h-3 w-3 text-background/40" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Typing indicator bubble */}
          {isPartnerTyping && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border/10 px-4 py-3 safe-area-bottom">
        {/* Message limit indicator */}
        {!messageLimits.loading && !messageLimits.hasBooking && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] text-muted-foreground">
              {messageLimits.sentToday} / {messageLimits.cap} messages today
            </span>
            {messageLimits.inboxFull && (
              <span className="text-[10px] text-amber-500 font-medium">High demand</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={
              !messageLimits.hasBooking && !messageLimits.canSend
                ? "Daily message limit reached. Book a session to unlock unlimited messaging"
                : messageLimits.inboxFull
                  ? "This coach's inbox is full — try again later"
                  : "Type a message..."
            }
            disabled={!messageLimits.hasBooking && (!messageLimits.canSend || messageLimits.inboxFull)}
            className="flex-1 h-11 px-4 rounded-2xl bg-secondary/70 border border-border/10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending || (!messageLimits.hasBooking && !messageLimits.canSend)}
            className="h-11 w-11 rounded-full bg-foreground flex items-center justify-center text-background disabled:opacity-30 active:scale-90 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
