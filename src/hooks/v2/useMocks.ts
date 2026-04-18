/**
 * v2 mock-data hooks. Each wraps a mock array with useQuery + 300ms delay
 * so screens exercise loading states. Replace internals with real Supabase
 * queries phase-by-phase; hook contracts stay stable.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useCoaches() {
  return useQuery<Coach[]>({
    queryKey: ["v2", "coaches"],
    queryFn: () => delay(mockCoaches),
  });
}

export function useCoach(id: string | undefined) {
  return useQuery<Coach | null>({
    queryKey: ["v2", "coach", id],
    queryFn: () => delay(mockCoaches.find((c) => c.id === id) ?? null),
    enabled: Boolean(id),
  });
}

export function useCoachProfile(id: string | undefined) {
  return useQuery<CoachProfile | null>({
    queryKey: ["v2", "coach-profile", id],
    queryFn: () => delay(id === mockCoachProfile.id ? mockCoachProfile : null),
    enabled: Boolean(id),
  });
}

export function useMyPlayerProfile() {
  return useQuery<PlayerProfile>({
    queryKey: ["v2", "me"],
    queryFn: () => delay(mockPlayer),
  });
}

export function useMyCoachProfile() {
  return useQuery<CoachProfile>({
    queryKey: ["v2", "me", "coach"],
    queryFn: () => delay(mockCoachProfile),
  });
}

export function useMySessions(filter: "upcoming" | "past" | "cancelled" = "upcoming") {
  return useQuery<Session[]>({
    queryKey: ["v2", "sessions", filter],
    queryFn: () => {
      const now = Date.now();
      const all = mockSessions;
      if (filter === "upcoming") return delay(all.filter((s) => new Date(s.startsAt).getTime() >= now));
      if (filter === "past") return delay(all.filter((s) => new Date(s.startsAt).getTime() < now && s.status !== "cancelled"));
      return delay(all.filter((s) => s.status === "cancelled"));
    },
  });
}

export function useBookingRequests(filter: "new" | "responded" | "declined" = "new") {
  return useQuery<BookingRequest[]>({
    queryKey: ["v2", "booking-requests", filter],
    queryFn: () => {
      if (filter === "new") return delay(mockBookingRequests.filter((r) => r.status === "pending"));
      if (filter === "declined") return delay(mockBookingRequests.filter((r) => r.status === "declined"));
      return delay(mockBookingRequests.filter((r) => r.status === "accepted"));
    },
  });
}

export function useBookingRequestAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "decline" }) => {
      const req = mockBookingRequests.find((r) => r.id === id);
      if (!req) throw new Error("Request not found");
      req.status = action === "accept" ? "accepted" : "declined";
      return delay(req);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["v2", "booking-requests"] }),
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
  return useQuery<CirclePost[]>({
    queryKey: ["v2", "circle-posts", coachId ?? "all"],
    queryFn: () => delay(mockCirclePosts),
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
  return useQuery<MessageThread[]>({
    queryKey: ["v2", "threads"],
    queryFn: () => delay(mockThreads),
  });
}

export function useChat(threadId: string | undefined) {
  return useQuery<Message[]>({
    queryKey: ["v2", "chat", threadId],
    queryFn: () => delay(threadId ? mockMessages[threadId] ?? [] : []),
    enabled: Boolean(threadId),
  });
}

export function useVideos(coachId: string | undefined) {
  return useQuery<Video[]>({
    queryKey: ["v2", "videos", coachId],
    queryFn: () => delay(mockVideos.filter((v) => !coachId || v.coachId === coachId)),
  });
}

export function useVideo(id: string | undefined) {
  return useQuery<Video | null>({
    queryKey: ["v2", "video", id],
    queryFn: () => delay(mockVideos.find((v) => v.id === id) ?? null),
    enabled: Boolean(id),
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
  return useQuery<TrainingPlan | null>({
    queryKey: ["v2", "plan", id],
    queryFn: () => delay(mockTrainingPlans.find((p) => p.id === id) ?? null),
    enabled: Boolean(id),
  });
}

export function useCoachPlans(coachId: string | undefined) {
  return useQuery<TrainingPlan[]>({
    queryKey: ["v2", "plans", coachId],
    queryFn: () => delay(mockTrainingPlans.filter((p) => !coachId || p.coachId === coachId)),
  });
}

export function useCalendarEvents(startDate?: Date, endDate?: Date) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["v2", "calendar", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => {
      if (!startDate || !endDate) return delay(mockCalendarEvents);
      const s = startDate.getTime();
      const e = endDate.getTime();
      return delay(
        mockCalendarEvents.filter((ev) => {
          const t = new Date(ev.startsAt).getTime();
          return t >= s && t <= e;
        })
      );
    },
  });
}

export function useDayEvents(date: Date | undefined) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["v2", "day-events", date?.toDateString()],
    queryFn: () => {
      if (!date) return delay([]);
      return delay(
        mockCalendarEvents.filter((ev) => new Date(ev.startsAt).toDateString() === date.toDateString())
      );
    },
    enabled: Boolean(date),
  });
}

export function useAddWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workout: Omit<CalendarEvent, "id"> & { id?: string }) => {
      const event: CalendarEvent = { id: `ce-${Date.now()}`, ...workout };
      mockCalendarEvents.push(event);
      return delay(event);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["v2", "calendar"] }),
  });
}

export function useSubscribeToPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, startDate }: { planId: string; startDate: Date }) => {
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
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["v2", "calendar"] }),
  });
}
