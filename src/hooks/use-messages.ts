import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export type MessageType = "text" | "image" | "voice" | "booking_request";

export interface BookingMetadata {
  booking_id: string;
  coach_name: string;
  sport: string;
  date: string;
  time: string;
  price: number;
  status: string;
  training_type?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  message_type: MessageType;
  file_url: string | null;
  metadata: BookingMetadata | null;
  created_at: string;
  /** Client-only: true while optimistically inserted but not yet confirmed */
  _pending?: boolean;
}

// Canonical UUID guard — used to gate every .or() / filter-string path in
// this file. .or() does not parameterize its argument, so any ID that flows
// into it MUST be a well-formed UUID. RLS blocks actual data leakage, but
// this closes the belt-and-suspenders gap.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

/* ─────────────────────────────────────────────
   useConversations — inbox list with realtime
   ───────────────────────────────────────────── */
export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    if (!UUID_RE.test(user.id)) { setLoading(false); return; }
    setLoading(true);

    // Two separate queries instead of a single .or() with template literals.
    // .or() does not parameterize — even with a trusted auth.uid() today, a
    // future refactor could pass unvalidated input into the same code path.
    const [{ data: sent }, { data: received }] = await Promise.all([
      supabase.from("messages").select("*").eq("sender_id", user.id).order("created_at", { ascending: false }),
      supabase.from("messages").select("*").eq("receiver_id", user.id).order("created_at", { ascending: false }),
    ]);
    const msgs = [...(sent ?? []), ...(received ?? [])]
      .sort((a: any, b: any) => (b.created_at > a.created_at ? 1 : -1));

    if (!msgs || msgs.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convMap: Record<string, { msgs: any[]; unread: number }> = {};
    for (const m of msgs) {
      const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!convMap[partnerId]) convMap[partnerId] = { msgs: [], unread: 0 };
      convMap[partnerId].msgs.push(m);
      if (!m.read_at && m.receiver_id === user.id) convMap[partnerId].unread++;
    }

    const partnerIds = Object.keys(convMap);
    const [{ data: profiles }, { data: coachProfiles }] = await Promise.all([
      supabase.from("profiles").select("user_id, username, avatar_url").in("user_id", partnerIds),
      supabase.from("coach_profiles").select("user_id, coach_name, image_url").in("user_id", partnerIds),
    ]);

    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    if (profiles) for (const p of profiles) profileMap[p.user_id] = { name: p.username, avatar: p.avatar_url };
    if (coachProfiles) for (const p of coachProfiles) profileMap[p.user_id] = { name: p.coach_name, avatar: p.image_url };

    const convs: Conversation[] = partnerIds.map((pid) => {
      const lastMsg = convMap[pid].msgs[0];
      const profile = profileMap[pid];
      return {
        partnerId: pid,
        partnerName: profile?.name || "User",
        partnerAvatar: profile?.avatar || null,
        lastMessage: lastMsg.content,
        lastMessageAt: lastMsg.created_at,
        unreadCount: convMap[pid].unread,
      };
    });

    convs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    setConversations(convs);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime: refresh conversation list on any new/updated message
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("inbox-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => refresh())
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${user.id}`,
      }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  return { conversations, loading, refresh };
};

const PAGE_SIZE = 50;

/* ─────────────────────────────────────────────
   useMessages — chat with realtime + optimistic
   ───────────────────────────────────────────── */
export const useMessages = (partnerId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pendingSendRef = useRef(false);
  const totalCountRef = useRef(0);
  const offsetRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!user || !partnerId) return;
    if (!isUuid(partnerId) || !isUuid(user.id)) {
      setLoading(false);
      setMessages([]);
      return;
    }
    setLoading(true);

    const filter = `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`;

    // Get total count first
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .or(filter);

    const total = count || 0;
    totalCountRef.current = total;

    // Load most recent PAGE_SIZE messages using range on descending order
    const from = Math.max(total - PAGE_SIZE, 0);
    const to = total - 1;
    offsetRef.current = from;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(filter)
      .order("created_at", { ascending: true })
      .range(from, to);

    setMessages((data as unknown as Message[]) || []);
    setHasMore(from > 0);
    setLoading(false);

    // Mark received as read with timestamp
    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() } as any)
      .eq("sender_id", partnerId)
      .eq("receiver_id", user.id)
      .is("read_at", null)
      .then(() => {});
  }, [user, partnerId]);

  const loadOlder = useCallback(async () => {
    if (!user || !partnerId || loadingOlder || !hasMore) return;
    if (!isUuid(partnerId) || !isUuid(user.id)) return;
    setLoadingOlder(true);

    const filter = `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`;

    const currentFrom = offsetRef.current;
    const newFrom = Math.max(currentFrom - PAGE_SIZE, 0);
    const newTo = currentFrom - 1;

    if (newTo < 0) {
      setHasMore(false);
      setLoadingOlder(false);
      return;
    }

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(filter)
      .order("created_at", { ascending: true })
      .range(newFrom, newTo);

    if (data && data.length > 0) {
      offsetRef.current = newFrom;
      setMessages((prev) => [...(data as unknown as Message[]), ...prev]);
      setHasMore(newFrom > 0);
    } else {
      setHasMore(false);
    }

    setLoadingOlder(false);
  }, [user, partnerId, loadingOlder, hasMore]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime: listen for new messages in this conversation
  useEffect(() => {
    if (!user || !partnerId) return;

    const channel = supabase
      .channel(`chat-${user.id}-${partnerId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${partnerId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        // Only add if it belongs to this conversation
        if (newMsg.receiver_id === user.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Auto-mark as read since chat is open
          supabase.from("messages").update({ read_at: new Date().toISOString() } as any).eq("id", newMsg.id).then(() => {});
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
      }, (payload) => {
        const updated = payload.new as Message;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, is_read: updated.is_read, read_at: updated.read_at } : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, partnerId]);

  const sendMessage = useCallback(async (
    content: string,
    options?: {
      message_type?: MessageType;
      file_url?: string;
      metadata?: BookingMetadata;
    },
    messageLimitCheck?: { canSend: boolean; hasBooking: boolean; inboxFull: boolean; sentToday: number; cap: number; incrementMessageCount: () => Promise<void> }
  ) => {
    if (!user || !partnerId || pendingSendRef.current) return;

    // Check message limits if provided (non-booked pairs only)
    if (messageLimitCheck && !messageLimitCheck.hasBooking) {
      if (messageLimitCheck.inboxFull) {
        throw new Error("INBOX_FULL");
      }
      if (!messageLimitCheck.canSend) {
        throw new Error("MESSAGE_LIMIT");
      }
    }

    const type = options?.message_type || "text";
    // Text messages require content; image messages can have empty content
    if (type === "text" && !content.trim()) return;
    pendingSendRef.current = true;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: partnerId,
      content: content.trim(),
      is_read: false,
      read_at: null,
      message_type: type,
      file_url: options?.file_url || null,
      metadata: options?.metadata || null,
      created_at: new Date().toISOString(),
      _pending: true,
    };

    // Optimistic insert
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const insertPayload: Record<string, unknown> = {
        sender_id: user.id,
        receiver_id: partnerId,
        content: content.trim() || (type === "image" ? "Sent an image" : ""),
        message_type: type,
      };
      if (options?.file_url) insertPayload.file_url = options.file_url;
      if (options?.metadata) insertPayload.metadata = options.metadata;

      const { data, error } = await supabase
        .from("messages")
        .insert(insertPayload as any)
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...(data as unknown as Message), _pending: false } : m)
      );

      // Increment daily message counter for non-booked pairs
      if (messageLimitCheck && !messageLimitCheck.hasBooking) {
        messageLimitCheck.incrementMessageCount();
      }

      // Fire-and-forget notification for the receiver
      const notifBody = type === "image" ? "Sent you a photo"
        : type === "booking_request" ? "Sent a booking request"
        : content.trim().slice(0, 100);

      supabase.rpc("create_notification", {
        _user_id: partnerId,
        _type: "message",
        _title: "New Message",
        _body: notifBody,
        _reference_id: user.id,
        _reference_type: "chat",
      }).then(() => {});

      // Push notification to recipient
      supabase.functions.invoke("send-push", {
        body: {
          user_id: partnerId,
          title: "New Message",
          body: notifBody,
          url: `/chat/${user.id}`,
        },
      }).catch(() => {});
    } catch {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      pendingSendRef.current = false;
    }
  }, [user, partnerId]);

  return { messages, loading, loadingOlder, hasMore, sendMessage, refresh, loadOlder };
};
