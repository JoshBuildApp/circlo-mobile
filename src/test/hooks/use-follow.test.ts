import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUser = { id: "user-1" };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}));

function createQueryMock(resolveWith: { data?: any; error?: any } = {}) {
  const chain: any = {};
  for (const method of ["select", "eq", "in", "or", "order", "maybeSingle", "single", "insert", "delete"]) {
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

import { useFollow } from "@/hooks/use-follow";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

beforeEach(() => {
  vi.clearAllMocks();
  fromHandlers = {};
  (useAuth as any).mockReturnValue({ user: mockUser });
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("useFollow", () => {
  it("loads initial follow state — not following", async () => {
    fromHandlers["user_follows"] = () => createQueryMock({ data: null });

    const { result } = renderHook(() => useFollow("coach-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.following).toBe(false);
  });

  it("loads initial follow state — already following", async () => {
    fromHandlers["user_follows"] = () => createQueryMock({ data: { id: "f1" } });

    const { result } = renderHook(() => useFollow("coach-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.following).toBe(true);
  });

  it("toggleFollow performs optimistic update then commits on success", async () => {
    // Start as not following
    fromHandlers["user_follows"] = () => createQueryMock({ data: null });

    const { result } = renderHook(() => useFollow("coach-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.following).toBe(false);

    // Mock insert (follow)
    fromHandlers["user_follows"] = () => createQueryMock({ data: null, error: null });
    // Mock coach_profiles lookup for notification
    fromHandlers["coach_profiles"] = () => createQueryMock({ data: { user_id: "coach-owner-1" } });

    const followEvents: any[] = [];
    const listener = (e: Event) => followEvents.push((e as CustomEvent).detail);
    window.addEventListener("follow-changed", listener);

    await act(async () => {
      await result.current.toggleFollow();
    });

    expect(result.current.following).toBe(true);
    expect(followEvents).toContainEqual({ coachId: "coach-1", following: true });

    window.removeEventListener("follow-changed", listener);
  });

  it("toggleFollow rolls back on error and shows toast", async () => {
    // Start as following
    fromHandlers["user_follows"] = () => createQueryMock({ data: { id: "f1" } });

    const { result } = renderHook(() => useFollow("coach-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.following).toBe(true);

    // Mock delete (unfollow) to fail
    fromHandlers["user_follows"] = () => createQueryMock({ data: null, error: { message: "DB error" } });

    await act(async () => {
      await result.current.toggleFollow();
    });

    // Should rollback to true (was following)
    expect(result.current.following).toBe(true);
    expect(toast.error).toHaveBeenCalledWith("Something went wrong. Try again.");
  });

  it("returns loading=false immediately when coachId is undefined", async () => {
    const { result } = renderHook(() => useFollow(undefined));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.following).toBe(false);
  });
});
