import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TYPING_TIMEOUT_MS = 3000;

/**
 * Real-time typing indicator using Supabase Presence.
 * Broadcasts typing state to a partner and listens for their typing state.
 */
export const useTypingIndicator = (partnerId: string | undefined) => {
  const { user } = useAuth();
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!user || !partnerId) return;

    // Create a deterministic channel name (sorted IDs so both users join the same channel)
    const ids = [user.id, partnerId].sort();
    const channelName = `typing:${ids[0]}:${ids[1]}`;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // Check if partner is in the presence state and typing
        const partnerPresence = state[partnerId] as Array<{ typing?: boolean }> | undefined;
        const typing = partnerPresence?.some((p) => p.typing === true) ?? false;
        setIsPartnerTyping(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ typing: false });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
      isTypingRef.current = false;
    };
  }, [user, partnerId]);

  const setTyping = useCallback((typing: boolean) => {
    const channel = channelRef.current;
    if (!channel) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (typing) {
      // Only send track if not already typing (avoid spamming)
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        channel.track({ typing: true });
      }
      // Auto-stop after timeout
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        channel.track({ typing: false });
      }, TYPING_TIMEOUT_MS);
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        channel.track({ typing: false });
      }
    }
  }, []);

  /** Call on every keystroke in the input */
  const onKeystroke = useCallback(() => {
    setTyping(true);
  }, [setTyping]);

  /** Call when the user sends a message (stop typing) */
  const stopTyping = useCallback(() => {
    setTyping(false);
  }, [setTyping]);

  return { isPartnerTyping, onKeystroke, stopTyping };
};
