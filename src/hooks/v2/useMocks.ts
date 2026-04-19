/**
 * v2 hooks. Phase-3 progress: useMyPlayerProfile, useCoaches, useCoach,
 * useMyCoachProfile now hit real Supabase when an auth session exists,
 * and fall back to mock data for guest browsing. Other hooks still use
 * mocks — replace one-by-one per V2_UPGRADE_PLAN Step 3.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { shouldUseMocks, shouldFallbackToMocks, useDataMode, devOverrideActive } from "@/lib/v2/devMode";
import {
  fetchMyPlayerProfile,
  fetchCoaches,
  fetchCoach,
  fetchMyCoachProfile,
  fetchMySessions,
  fetchBookingRequestsForCoach,
  setBookingStatus,
  fetchCirclePosts,
  fetchVideos,
  fetchVideo,
  fetchCoachReviews,
  fetchCoachReviewSummary,
  fetchMessageThreads,
  fetchChatMessages,
  fetchSession,
  createBooking,
  type CoachSearchFilters,
  fetchTrainingPlan,
  fetchCoachPlans,
  subscribeToPlanReal,
  addPersonalWorkout,
  fetchCalendarEventsReal,
  type CoachReview,
  type CreateBookingInput,
} from "@/hooks/v2/useSupabaseQueries";
import {
  mockCoaches,
  mockPlayer,
  mockCoachProfile,
  mockSessions,
  mockBookingRequests,
  mockBobInsights,
  mockBobThreads,
  mockCirclePosts,
  mockShopItems,
  mockThreads,
  mockMessages,
  mockVideos,
  mockLiveSession,
  mockCalendarEvents,
  mockTrainingPlans,
} from "@/lib/v2/mockData";
import type {
  Coach,
  Session,
  BookingRequest,
  BobInsight,
  BobThread,
  CirclePost,
  ShopItem,
  MessageThread,
  Message,
  Video,
  LiveSession,
  PlayerProfile,
  CoachProfile,
  CalendarEvent,
  TrainingPlan,
} from "@/types/v2";

const MOCK_DELAY_MS = 300;

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function useCoaches(filters: CoachSearchFilters = {}) {
  const { user } = useAuth();
  const dataMode = useDataMode(); // reactive — flips re-render when dev toggles
  // Cache key includes the filter shape so distinct searches don't collide.
  // Dev data mode is part of the key so flipping the toggle re-fetches.
  const filterKey = JSON.stringify(filters);
  const sourceKey = devOverrideActive(user) ? dataMode : user ? "live" : "mock";
  return useQuery<Coach[]>({
    queryKey: ["v2", "coaches", filterKey, sourceKey],
    queryFn: async () => {
      const filterMock = (list: Coach[]) => {
        let out = list;
        if (filters.sport) out = out.filter((c) => c.sports.includes(filters.sport!));
        if (typeof filters.priceMax === "number") out = out.filter((c) => c.priceFromILS <= filters.priceMax!);
        if (typeof filters.minRating === "number" && filters.minRating > 0) {
          out = out.filter((c) => c.rating >= filters.minRating!);
        }
        const term = filters.query?.trim().toLowerCase();
        if (term) {
          out = out.filter((c) =>
            (c.name + " " + c.tagline + " " + c.bio + " " + c.sports.join(" "))
              .toLowerCase()
              .includes(term)
          );
        }
        return out;
      };
      if (shouldUseMocks(user)) return delay(filterMock(mockCoaches));
      const real = await fetchCoaches(filters);
      if (real.length > 0) return real;
      return shouldFallbackToMocks(user) ? filterMock(mockCoaches) : [];
    },
  });
}

export function useCoach(id: string | undefined) {
  const { user } = useAuth();
  return useQuery<Coach | null>({
    queryKey: ["v2", "coach", id, user ? "live" : "mock"],
    queryFn: async () => {
      if (!id) return null;
      if (shouldUseMocks(user)) return delay(mockCoaches.find((c) => c.id === id) ?? mockCoaches[0] ?? null);
      const real = await fetchCoach(id);
      if (real) return real;
      return shouldFallbackToMocks(user) ? mockCoaches.find((c) => c.id === id) ?? null : null;
    },
    enabled: Boolean(id),
  });
}

export function useMyPlayerProfile() {
  const { user } = useAuth();
  return useQuery<PlayerProfile>({
    queryKey: ["v2", "me", user?.id ?? "guest"],
    queryFn: async () => {
      if (shouldUseMocks(user)) return delay(mockPlayer);
      const real = await fetchMyPlayerProfile(user.id);
      if (!real) return shouldFallbackToMocks(user) ? mockPlayer : ({ ...mockPlayer, fullName: user?.email ?? "You", email: user?.email ?? "" });
      // Inject the real email from auth into the profile.
      return { ...real, email: user.email ?? "" };
    },
  });
}

export function useMyCoachProfile() {
  const { user } = useAuth();
  return useQuery<CoachProfile>({
    queryKey: ["v2", "me", "coach", user?.id ?? "guest"],
    queryFn: async () => {
      if (shouldUseMocks(user)) return delay(mockCoachProfile);
      const real = await fetchMyCoachProfile(user.id);
      return real ?? (shouldFallbackToMocks(user) ? mockCoachProfile : { ...mockCoachProfile, name: "", tagline: "", bio: "" });
    },
  });
}

export function useMySessions(filter: "upcoming" | "past" | "cancelled" = "upcoming") {
  const { user } = useAuth();
  return useQuery<Session[]>({
    queryKey: ["v2", "sessions", filter, user?.id ?? "guest"],
    queryFn: async () => {
      if (shouldUseMocks(user)) {
        const now = Date.now();
        const all = mockSessions;
        if (filter === "upcoming") return delay(all.filter((s) => new Date(s.startsAt).getTime() >= now));
        if (filter === "past")
          return delay(all.filter((s) => new Date(s.startsAt).getTime() < now && s.status !== "cancelled"));
        return delay(all.filter((s) => s.status === "cancelled"));
      }
      const real = await fetchMySessions(user.id, filter);
      return real;
    },
  });
}

export function useBookingRequests(filter: "new" | "responded" | "declined" = "new") {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery<BookingRequest[]>({
    queryKey: ["v2", "booking-requests", filter, user?.id ?? "guest"],
    queryFn: async () => {
      if (shouldUseMocks(user)) {
        if (filter === "new") return delay(mockBookingRequests.filter((r) => r.status === "pending"));
        if (filter === "declined") return delay(mockBookingRequests.filter((r) => r.status === "declined"));
        return delay(mockBookingRequests.filter((r) => r.status === "accepted"));
      }
      return fetchBookingRequestsForCoach(user.id, filter);
    },
  });

  // Realtime: any change to public.bookings invalidates this list and the
  // sessions list. Filtering server-side per coach would require we know the
  // coach_profiles.id here; the cheap approach is to invalidate on any change
  // and let react-query re-run the scoped query.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`v2-bookings:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          qc.invalidateQueries({ queryKey: ["v2", "booking-requests"] });
          qc.invalidateQueries({ queryKey: ["v2", "sessions"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return query;
}

export function useSession(bookingId: string | undefined) {
  const { user } = useAuth();
  return useQuery<Session | null>({
    queryKey: ["v2", "session", bookingId, user?.id ?? "guest"],
    queryFn: async () => {
      if (!bookingId) return null;
      // Mock id pattern from old preview path: CRC-XXXX. Render mock session.
      if (bookingId.startsWith("CRC-")) return mockSessions[0];
      if (shouldUseMocks(user)) return mockSessions.find((s) => s.id === bookingId) ?? mockSessions[0];
      const real = await fetchSession(bookingId);
      return real ?? (shouldFallbackToMocks(user) ? mockSessions[0] : null);
    },
    enabled: Boolean(bookingId),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<CreateBookingInput, "userId">) => {
      if (shouldUseMocks(user)) {
        // Guest preview — return a mock-shaped Session without writing.
        await delay(null, 500);
        return {
          ...mockSessions[0],
          id: `CRC-${Math.floor(1000 + Math.random() * 9000)}`,
          coachId: input.coachId,
          coachName: input.coachName,
          status: "pending" as const,
        };
      }
      return createBooking({ ...input, userId: user.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["v2", "sessions"] });
      qc.invalidateQueries({ queryKey: ["v2", "booking-requests"] });
    },
  });
}

export function useBookingRequestAction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "decline" }) => {
      if (shouldUseMocks(user)) {
        const req = mockBookingRequests.find((r) => r.id === id);
        if (!req) throw new Error("Request not found");
        req.status = action === "accept" ? "accepted" : "declined";
        return delay(req);
      }
      await setBookingStatus(id, action);
      return { id, action };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["v2", "booking-requests"] });
      qc.invalidateQueries({ queryKey: ["v2", "sessions"] });
    },
  });
}

export function useBobInsights() {
  return useQuery<BobInsight[]>({
    queryKey: ["v2", "bob", "insights"],
    queryFn: () => delay(mockBobInsights),
  });
}

export function useBobThreads() {
  return useQuery<BobThread[]>({
    queryKey: ["v2", "bob", "threads"],
    queryFn: () => delay(mockBobThreads),
  });
}

export function useCirclePosts(coachId?: string) {
  const { user } = useAuth();
  return useQuery<CirclePost[]>({
    queryKey: ["v2", "circle-posts", coachId ?? "all", user ? "live" : "mock"],
    queryFn: async () => {
      if (shouldUseMocks(user)) return delay(mockCirclePosts);
      const real = await fetchCirclePosts(coachId);
      if (real.length > 0) return real;
      return shouldFallbackToMocks(user) ? mockCirclePosts : [];
    },
  });
}

export function useShopItems(coachId: string | undefined) {
  return useQuery<ShopItem[]>({
    queryKey: ["v2", "shop", coachId],
    queryFn: () => delay(mockShopItems.filter((s) => s.coachId === coachId)),
    enabled: Boolean(coachId),
  });
}

export function useMessageThreads() {
  const { user } = useAuth();
  return useQuery<MessageThread[]>({
    queryKey: ["v2", "threads", user?.id ?? "guest"],
    queryFn: async () => {
      if (shouldUseMocks(user)) return delay(mockThreads);
      const real = await fetchMessageThreads(user.id);
      // Empty inbox is a real state — show it instead of mocks once authed.
      return real;
    },
  });
}

export function useChat(threadId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery<Message[]>({
    queryKey: ["v2", "chat", threadId, user?.id ?? "guest"],
    queryFn: async () => {
      if (!threadId) return [];
      if (shouldUseMocks(user)) return delay(mockMessages[threadId] ?? []);
      return fetchChatMessages(threadId, user.id);
    },
    enabled: Boolean(threadId),
  });

  // Realtime: invalidate this chat (and the inbox) when any message lands.
  // We could narrow with a server-side filter, but messages are partitioned
  // by month so a global subscription is simpler and the payload is tiny.
  useEffect(() => {
    if (!user || !threadId) return;
    const channel = supabase
      .channel(`v2-chat:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          qc.invalidateQueries({ queryKey: ["v2", "chat", threadId] });
          qc.invalidateQueries({ queryKey: ["v2", "threads"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, threadId, qc]);

  return query;
}

export function useVideos(coachId: string | undefined) {
  const { user } = useAuth();
  return useQuery<Video[]>({
    queryKey: ["v2", "videos", coachId, user ? "live" : "mock"],
    queryFn: async () => {
      if (shouldUseMocks(user)) return delay(mockVideos.filter((v) => !coachId || v.coachId === coachId));
      const real = await fetchVideos(coachId);
      if (real.length > 0) return real;
      return shouldFallbackToMocks(user) ? mockVideos.filter((v) => !coachId || v.coachId === coachId) : [];
    },
  });
}

export function useVideo(id: string | undefined) {
  const { user } = useAuth();
  return useQuery<Video | null>({
    queryKey: ["v2", "video", id, user ? "live" : "mock"],
    queryFn: async () => {
      if (!id) return null;
      if (shouldUseMocks(user)) return delay(mockVideos.find((v) => v.id === id) ?? null);
      const real = await fetchVideo(id);
      if (real) return real;
      return shouldFallbackToMocks(user) ? mockVideos.find((v) => v.id === id) ?? null : null;
    },
    enabled: Boolean(id),
  });
}

export function useCoachReviews(coachId: string | undefined) {
  const { user } = useAuth();
  return useQuery<CoachReview[]>({
    queryKey: ["v2", "coach-reviews", coachId, user ? "live" : "mock"],
    queryFn: async () => {
      if (!coachId) return [];
      if (shouldUseMocks(user)) return [];
      return fetchCoachReviews(coachId);
    },
    enabled: Boolean(coachId),
  });
}

export function useCoachReviewSummary(coachId: string | undefined) {
  const { user } = useAuth();
  return useQuery<{ avg: number; count: number }>({
    queryKey: ["v2", "coach-review-summary", coachId, user ? "live" : "mock"],
    queryFn: async () => {
      if (!coachId || !user) return { avg: 0, count: 0 };
      return fetchCoachReviewSummary(coachId);
    },
    enabled: Boolean(coachId),
  });
}

export function useLiveSession(id: string | undefined) {
  return useQuery<LiveSession | null>({
    queryKey: ["v2", "live", id],
    queryFn: () => delay(id ? mockLiveSession : null),
    enabled: Boolean(id),
  });
}

export function useTrainingPlan(id: string | undefined) {
  const { user } = useAuth();
  return useQuery<TrainingPlan | null>({
    queryKey: ["v2", "plan", id, user ? "live" : "mock"],
    queryFn: async () => {
      if (!id) return null;
      if (shouldUseMocks(user)) return mockTrainingPlans.find((p) => p.id === id) ?? null;
      const real = await fetchTrainingPlan(id);
      if (real) return real;
      return shouldFallbackToMocks(user) ? mockTrainingPlans.find((p) => p.id === id) ?? null : null;
    },
    enabled: Boolean(id),
  });
}

export function useCoachPlans(coachId: string | undefined) {
  const { user } = useAuth();
  return useQuery<TrainingPlan[]>({
    queryKey: ["v2", "plans", coachId, user ? "live" : "mock"],
    queryFn: async () => {
      if (shouldUseMocks(user)) return mockTrainingPlans.filter((p) => !coachId || p.coachId === coachId);
      const real = await fetchCoachPlans(coachId);
      if (real.length > 0) return real;
      return shouldFallbackToMocks(user) ? mockTrainingPlans.filter((p) => !coachId || p.coachId === coachId) : [];
    },
  });
}

export function useCalendarEvents(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();
  return useQuery<CalendarEvent[]>({
    queryKey: ["v2", "calendar", startDate?.toISOString(), endDate?.toISOString(), user?.id ?? "guest"],
    queryFn: async () => {
      if (shouldUseMocks(user)) {
        if (!startDate || !endDate) return delay(mockCalendarEvents);
        const s = startDate.getTime();
        const e = endDate.getTime();
        return delay(mockCalendarEvents.filter((ev) => {
          const t = new Date(ev.startsAt).getTime();
          return t >= s && t <= e;
        }));
      }
      return fetchCalendarEventsReal(user.id, startDate, endDate);
    },
  });
}

export function useDayEvents(date: Date | undefined) {
  const { user } = useAuth();
  return useQuery<CalendarEvent[]>({
    queryKey: ["v2", "day-events", date?.toDateString(), user?.id ?? "guest"],
    queryFn: async () => {
      if (!date) return [];
      if (shouldUseMocks(user)) {
        return delay(
          mockCalendarEvents.filter((ev) => new Date(ev.startsAt).toDateString() === date.toDateString())
        );
      }
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      return fetchCalendarEventsReal(user.id, dayStart, dayEnd);
    },
    enabled: Boolean(date),
  });
}

export function useAddWorkout() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (workout: Omit<CalendarEvent, "id"> & { id?: string }) => {
      if (shouldUseMocks(user)) {
        // Guest preview — push into mock.
        const event: CalendarEvent = { id: `ce-${Date.now()}`, ...workout };
        mockCalendarEvents.push(event);
        return delay(event);
      }
      const id = await addPersonalWorkout({
        userId: user.id,
        title: workout.title,
        type: (workout.workoutType ?? "strength") as "strength" | "cardio" | "mobility" | "sport" | "recovery",
        startsAt: new Date(workout.startsAt),
        durationMin: workout.durationMin,
        notes: workout.notes,
      });
      return { ...workout, id } as CalendarEvent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["v2", "calendar"] });
      qc.invalidateQueries({ queryKey: ["v2", "day-events"] });
    },
  });
}

export function useSubscribeToPlan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ planId, startDate }: { planId: string; startDate: Date }) => {
      if (shouldUseMocks(user)) {
        // Guest preview path — write into mock array.
        const plan = mockTrainingPlans.find((p) => p.id === planId);
        if (!plan) throw new Error("Plan not found");
        plan.workouts.forEach((w) => {
          const start = new Date(startDate);
          start.setDate(start.getDate() + w.dayNumber - 1);
          start.setHours(17, 0, 0, 0);
          mockCalendarEvents.push({
            id: `ce-plan-${plan.id}-${w.dayNumber}-${Date.now()}`,
            type: "plan-item",
            title: `${plan.title} · Day ${w.dayNumber}`,
            startsAt: start.toISOString(),
            durationMin: w.durationMin,
            planId: plan.id,
            planDayNumber: w.dayNumber,
            workoutType: w.type,
          });
        });
        return delay({ ok: true });
      }
      await subscribeToPlanReal({ userId: user.id, planId, startDate });
      return { ok: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["v2", "calendar"] });
      qc.invalidateQueries({ queryKey: ["v2", "day-events"] });
    },
  });
}
