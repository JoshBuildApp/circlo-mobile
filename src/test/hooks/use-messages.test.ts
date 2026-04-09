import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUser = { id: "user-1" };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}));

function createQueryMock(resolveWith: { data?: any; error?: any; count?: number | null } = {}) {
  const chain: any = {};
  for (const method of [
    "select", "eq", "in", "or", "order", "maybeSingle", "single",
    "insert", "update", "range",
  ]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (resolve: any) => resolve(resolveWith);
  return chain;
}

let fromHandlers: Record<string, () => any> = {};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (fromHandlers[table]) return fromHandlers[table]();
      return createQueryMock({ data: null });
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    rpc: vi.fn(() => ({ then: (r: any) => r({ data: null }) })),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { useMessages, useConversations } from "@/hooks/use-messages";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

beforeEach(() => {
  vi.clearAllMocks();
  fromHandlers = {};
  (useAuth as any).mockReturnValue({ user: mockUser });
});

// ── useMessages Tests ──────────────────────────────────────────────────────────

describe("useMessages", () => {
  it("loads initial messages and sets loading=false", async () => {
    const msgs = [
      { id: "m1", sender_id: "user-1", receiver_id: "partner-1", content: "Hi", is_read: false, created_at: "2026-01-01T00:00:00Z" },
      { id: "m2", sender_id: "partner-1", receiver_id: "user-1", content: "Hello", is_read: false, created_at: "2026-01-01T00:01:00Z" },
    ];

    // The hook calls from("messages") multiple times (count query, data query, mark-read)
    // We need to handle the count call (with head:true) and the data call differently
    let callCount = 0;
    fromHandlers["messages"] = () => {
      callCount++;
      if (callCount === 1) {
        // Count query
        return createQueryMock({ data: null, count: 2 });
      }
      if (callCount === 2) {
        // Data query
        return createQueryMock({ data: msgs });
      }
      // Mark-read update
      return createQueryMock({ data: null });
    };

    const { result } = renderHook(() => useMessages("partner-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe("Hi");
  });

  it("sends a message with optimistic insert then replaces with real data", async () => {
    // Initial load: empty conversation
    let callCount = 0;
    fromHandlers["messages"] = () => {
      callCount++;
      if (callCount <= 2) return createQueryMock({ data: callCount === 1 ? null : [], count: 0 });
      // Mark-read
      return createQueryMock({ data: null });
    };

    const { result } = renderHook(() => useMessages("partner-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock insert for sendMessage — returns a real message
    const realMsg = {
      id: "real-1",
      sender_id: "user-1",
      receiver_id: "partner-1",
      content: "Test message",
      is_read: false,
      created_at: "2026-01-01T00:05:00Z",
    };
    fromHandlers["messages"] = () => createQueryMock({ data: realMsg, error: null });

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    // Should have the message (optimistic replaced with real)
    expect(result.current.messages.some((m) => m.content === "Test message")).toBe(true);
    // The temp id should be replaced
    expect(result.current.messages.every((m) => !m.id.startsWith("temp-"))).toBe(true);
  });

  it("removes optimistic message on send failure", async () => {
    // Initial load
    let callCount = 0;
    fromHandlers["messages"] = () => {
      callCount++;
      if (callCount <= 2) return createQueryMock({ data: callCount === 1 ? null : [], count: 0 });
      return createQueryMock({ data: null });
    };

    const { result } = renderHook(() => useMessages("partner-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock insert to fail
    fromHandlers["messages"] = () => createQueryMock({ data: null, error: { message: "Insert failed" } });

    await act(async () => {
      await result.current.sendMessage("Will fail");
    });

    // Optimistic message should be removed on error
    expect(result.current.messages).toHaveLength(0);
  });

  it("sets up real-time subscription channel and cleans up on unmount", async () => {
    let callCount = 0;
    fromHandlers["messages"] = () => {
      callCount++;
      return createQueryMock({ data: callCount === 1 ? null : [], count: 0 });
    };

    const { unmount } = renderHook(() => useMessages("partner-1"));

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith("chat-user-1-partner-1");
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});

// ── useConversations Tests ─────────────────────────────────────────────────────

describe("useConversations", () => {
  it("returns empty conversations when user has no messages", async () => {
    fromHandlers["messages"] = () => createQueryMock({ data: [] });

    const { result } = renderHook(() => useConversations());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conversations).toEqual([]);
  });

  it("returns loading=false immediately when user is null", async () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { result } = renderHook(() => useConversations());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conversations).toEqual([]);
  });
});
