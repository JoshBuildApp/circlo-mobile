import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUser = { id: "user-1" };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}));

// Chainable Supabase query builder mock
function createQueryMock(resolveWith: { data?: any; error?: any; count?: number } = {}) {
  const chain: any = {};
  for (const method of ["select", "eq", "in", "or", "order", "maybeSingle", "single", "update", "range"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (resolve: any) => resolve(resolveWith);
  // Make it thenable so await works
  (chain as any)[Symbol.toStringTag] = "Promise";
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
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { useBookingRequests } from "@/hooks/use-booking-requests";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

beforeEach(() => {
  vi.clearAllMocks();
  fromHandlers = {};
  (useAuth as any).mockReturnValue({ user: mockUser });
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("useBookingRequests", () => {
  it("starts in loading state then transitions to loaded", async () => {
    // Coach profile lookup returns null → falls to user bookings path
    fromHandlers["coach_profiles"] = () => createQueryMock({ data: null });
    fromHandlers["bookings"] = () => createQueryMock({ data: [] });

    const { result } = renderHook(() => useBookingRequests());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.requests).toEqual([]);
  });

  it("loads and enriches coach booking requests with user profiles", async () => {
    const bookings = [
      { id: "b1", user_id: "u1", coach_id: "c1", status: "pending", created_at: "2026-01-01" },
      { id: "b2", user_id: "u2", coach_id: "c1", status: "confirmed", created_at: "2026-01-02" },
    ];

    const profiles = [
      { user_id: "u1", username: "Alice", avatar_url: "alice.jpg" },
      { user_id: "u2", username: "Bob", avatar_url: null },
    ];

    fromHandlers["coach_profiles"] = () => createQueryMock({ data: { id: "c1" } });
    fromHandlers["bookings"] = () => createQueryMock({ data: bookings });
    fromHandlers["profiles"] = () => createQueryMock({ data: profiles });

    const { result } = renderHook(() => useBookingRequests());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.requests).toHaveLength(2);
    expect(result.current.requests[0].user_name).toBe("Alice");
    expect(result.current.requests[1].user_avatar).toBeNull();
    expect(result.current.pendingCount).toBe(1); // only "pending" status
  });

  it("returns empty list and stops loading when user is null", async () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { result } = renderHook(() => useBookingRequests());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.requests).toEqual([]);
  });

  it("acceptRequest updates status optimistically and shows toast on success", async () => {
    const bookings = [
      { id: "b1", user_id: "u1", coach_id: "c1", status: "pending", created_at: "2026-01-01" },
    ];

    fromHandlers["coach_profiles"] = () => createQueryMock({ data: null });
    fromHandlers["bookings"] = () => createQueryMock({ data: bookings });

    const { result } = renderHook(() => useBookingRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock the update call for acceptRequest
    fromHandlers["bookings"] = () => createQueryMock({ data: null, error: null });

    await act(async () => {
      await result.current.acceptRequest("b1");
    });

    expect(result.current.requests[0].status).toBe("confirmed");
    expect(toast.success).toHaveBeenCalledWith("Booking confirmed!");
  });

  it("rejectRequest shows error toast on failure", async () => {
    const bookings = [
      { id: "b1", user_id: "u1", coach_id: "c1", status: "pending", created_at: "2026-01-01" },
    ];

    fromHandlers["coach_profiles"] = () => createQueryMock({ data: null });
    fromHandlers["bookings"] = () => createQueryMock({ data: bookings });

    const { result } = renderHook(() => useBookingRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock a failing update
    fromHandlers["bookings"] = () => createQueryMock({ data: null, error: { message: "DB error" } });

    await act(async () => {
      await result.current.rejectRequest("b1");
    });

    // Status should NOT change on error
    expect(result.current.requests[0].status).toBe("pending");
    expect(toast.error).toHaveBeenCalledWith("Failed to reject request");
  });
});
