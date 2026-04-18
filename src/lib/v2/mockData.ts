/**
 * v2 mock data — all hooks (src/hooks/v2/*) wrap these with react-query
 * + a 300ms delay so screens exercise loading states.
 * Swap for real Supabase calls phase-by-phase.
 */
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
  PlanWorkout,
} from "@/types/v2";

const ISO = (d: Date) => d.toISOString();
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
const atHour = (d: Date, h: number, m = 0) => {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
};

export const mockCoaches: Coach[] = [
  {
    id: "maya",
    name: "Maya Rosenfeld",
    firstName: "Maya",
    tagline: "Padel coach · Jaffa",
    bio: "Former WPT pro helping intermediate and advanced players unlock their best game.",
    city: "Tel Aviv",
    sports: ["padel"],
    rating: 4.9,
    reviewCount: 127,
    priceFromILS: 280,
    badges: ["verified", "top1"],
    avatarGradient: "teal-gold",
    isOnline: true,
    isAvailable: true,
    avgResponseMin: 12,
    followerCount: 340,
    memberCount: 127,
    vipCount: 8,
    sessionsThisWeek: 24,
    sessionsLast30d: 68,
    tags: ["Tactics", "Positioning", "Mental game"],
    nearKm: 1.2,
  },
  {
    id: "daniel",
    name: "Daniel Kramer",
    firstName: "Daniel",
    tagline: "Padel coach · Florentin",
    bio: "Fitness-first padel coach. Building athletes who last.",
    city: "Tel Aviv",
    sports: ["padel"],
    rating: 4.8,
    reviewCount: 92,
    priceFromILS: 240,
    badges: ["new"],
    avatarGradient: "orange-peach",
    avgResponseMin: 22,
    followerCount: 210,
    sessionsThisWeek: 16,
    nearKm: 2.4,
  },
  {
    id: "amir",
    name: "Amir Shaul",
    firstName: "Amir",
    tagline: "Mindset · Online",
    bio: "Sports psychologist. I help you win the rally before it starts.",
    city: "Online",
    sports: ["padel", "tennis"],
    rating: 4.9,
    reviewCount: 58,
    priceFromILS: 200,
    badges: [],
    avatarGradient: "teal-mint",
    avgResponseMin: 40,
  },
  {
    id: "yael",
    name: "Yael Tzachi",
    firstName: "Yael",
    tagline: "Padel · Tel Aviv",
    bio: "Group sessions and match play. Beginner-friendly.",
    city: "Tel Aviv",
    sports: ["padel"],
    rating: 4.7,
    reviewCount: 41,
    priceFromILS: 220,
    badges: [],
    avatarGradient: "gold-teal",
  },
  {
    id: "ron",
    name: "Ron Shem",
    firstName: "Ron",
    tagline: "Padel · 5 yrs pro",
    bio: "Tournament-grade coaching for advanced players.",
    city: "Tel Aviv",
    sports: ["padel"],
    rating: 4.6,
    reviewCount: 23,
    priceFromILS: 260,
    badges: ["new"],
    avatarGradient: "teal-gold",
  },
];

export const mockPlayer: PlayerProfile = {
  id: "guy",
  firstName: "Guy",
  fullName: "Guy Cohen",
  email: "guy@circlo.app",
  city: "Tel Aviv",
  joinedAt: "2025-11-02",
  sport: "padel",
  level: "intermediate",
  sportsCount: 3,
  sessionCount: 24,
  circleCount: 3,
  rating: 4.8,
  roles: ["player", "coach"],
  nextSession: {
    coachName: "Maya Rosenfeld",
    when: "Today · 18:00",
    location: "Jaffa Padel Club",
  },
};

export const mockCoachProfile: CoachProfile = {
  ...mockCoaches[0],
  monthlyRevenueILS: 12400,
  revenueDeltaPct: 18,
  payoutILS: 9680,
  payoutDate: "2026-04-30",
  activeStudents: 42,
  contentViews: 8524,
};

export const mockSessions: Session[] = [
  {
    id: "s1",
    coachId: "maya",
    coachName: "Maya Rosenfeld",
    format: "one-on-one",
    durationMin: 60,
    startsAt: ISO(atHour(addDays(2), 18)),
    endsAt: ISO(atHour(addDays(2), 19)),
    location: "Jaffa Padel Club",
    locationSubline: "2.1 km · 12 min drive",
    status: "confirmed",
    priceILS: 280,
    totalILS: 294,
    ref: "CRC-2814",
  },
  {
    id: "s2",
    coachId: "daniel",
    coachName: "Daniel Kramer",
    format: "group",
    durationMin: 90,
    startsAt: ISO(atHour(addDays(4), 10)),
    endsAt: ISO(atHour(addDays(4), 11, 30)),
    location: "Florentin Club",
    locationSubline: "3 of 4 spots filled",
    status: "pending",
    priceILS: 140,
    totalILS: 140,
    filled: 3,
    capacity: 4,
  },
  {
    id: "s3",
    coachId: "maya",
    coachName: "Maya Rosenfeld",
    format: "one-on-one",
    durationMin: 60,
    startsAt: ISO(atHour(addDays(9), 18)),
    endsAt: ISO(atHour(addDays(9), 19)),
    location: "Jaffa Padel Club",
    locationSubline: "Weekly recurring",
    status: "confirmed",
    priceILS: 280,
    totalILS: 294,
    recurring: true,
  },
];

export const mockBookingRequests: BookingRequest[] = [
  {
    id: "req1",
    studentId: "guy",
    studentName: "Guy Cohen",
    studentLevel: "Intermediate",
    pastSessionCount: 12,
    format: "one-on-one",
    durationMin: 60,
    startsAt: ISO(atHour(addDays(2), 18)),
    location: "Jaffa Padel Club",
    priceILS: 280,
    note: "Working on backhand volley, want to match play next week.",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "req2",
    studentId: "yael",
    studentName: "Yael Avraham",
    studentLevel: "Beginner",
    isNewStudent: true,
    format: "video-review",
    durationMin: 0,
    priceILS: 180,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "req3",
    studentId: "tomer",
    studentName: "Tomer Ben-Ami",
    studentLevel: "Advanced",
    pastSessionCount: 3,
    format: "group",
    durationMin: 90,
    startsAt: ISO(atHour(addDays(4), 10)),
    location: "Florentin Club",
    priceILS: 140,
    quantity: 2,
    bringing: "Maya Shalev",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
];

export const mockBobInsights: BobInsight[] = [
  {
    id: "b1",
    type: "alert",
    title: "Shira hasn't booked in 21 days",
    description: "She was on a weekly cadence. Churn probability: high.",
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    unread: true,
  },
  {
    id: "b2",
    type: "insight",
    title: "Revenue up 28% this week — ₪8,420",
    description: "VIP subs drove 60% of growth. Best week this quarter.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread: true,
  },
  {
    id: "b3",
    type: "draft",
    title: "Thank-you post to 8 VIPs",
    description: "Live · 2,300 views so far · 42 reactions",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: "published",
  },
  {
    id: "b4",
    type: "celebration",
    title: "🎉 You hit 100 members!",
    createdAt: addDays(-1).toISOString(),
  },
  {
    id: "b5",
    type: "action",
    title: "3 Fridays under 50% booked — campaign launched",
    createdAt: addDays(-1).toISOString(),
    status: "done",
  },
  {
    id: "b6",
    type: "insight",
    title: "Best session time: 18:00 weekdays · 92% rebook rate",
    createdAt: addDays(-3).toISOString(),
  },
];

export const mockBobThreads: BobThread[] = [
  { id: "t1", title: "Q4 pricing strategy", preview: "Considering a 15% raise on private…", updatedAt: addDays(-2).toISOString(), pinned: true },
  { id: "t2", title: "Revenue discussion", preview: "VIP subs drove 60% of growth…", updatedAt: ISO(new Date()) },
  { id: "t3", title: "New reel hook ideas", preview: "Try leading with the drill result…", updatedAt: ISO(new Date()) },
  { id: "t4", title: "Draft: thank-you post 💚", preview: "Published · 2.3k views so far", updatedAt: addDays(-3).toISOString() },
  { id: "t5", title: "Churn risk audit", preview: "2 members flagged · Shira, Omer", updatedAt: addDays(-4).toISOString() },
  { id: "t6", title: "Friday slot campaign", preview: "Offer 20% off Fridays this month…", updatedAt: addDays(-5).toISOString() },
];

export const mockCirclePosts: CirclePost[] = [
  {
    id: "p1",
    author: "Amir S.",
    authorGradient: "teal-mint",
    body: "New drill: 3-pattern footwork for faster court coverage ↗",
    likes: 128,
    comments: 14,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p2",
    author: "Daniel K.",
    authorGradient: "orange-peach",
    isCoach: true,
    body: "Serve clinic this Saturday — 4 spots open. Reply if interested 🎾",
    likes: 42,
    comments: 8,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p3",
    author: "Ron S.",
    authorGradient: "teal-gold",
    body: "Great doubles session tonight. Anyone up for a rematch this weekend?",
    likes: 18,
    comments: 6,
    createdAt: addDays(-1).toISOString(),
  },
];

export const mockShopItems: ShopItem[] = [
  {
    id: "sh1",
    coachId: "maya",
    title: "30-Day Padel Rebuild",
    subtitle: "12 video lessons + weekly drills",
    priceILS: 480,
    priceLabel: "one-time",
    variant: "orange",
    icon: "star",
    isFeatured: true,
  },
  { id: "sh2", coachId: "maya", title: "Serve clinic", subtitle: "4 weeks", priceILS: 220, priceLabel: "one-time", variant: "teal", icon: "calendar" },
  { id: "sh3", coachId: "maya", title: "Video review", subtitle: "1 session", priceILS: 180, priceLabel: "one-time", variant: "orange", icon: "video" },
  { id: "sh4", coachId: "maya", title: "10-pack sessions", subtitle: "Save 15%", priceILS: 2380, priceLabel: "pack", variant: "teal-2", icon: "repeat" },
  { id: "sh5", coachId: "maya", title: "Monthly plan", subtitle: "4 sessions", priceILS: 990, priceLabel: "monthly", variant: "dark", icon: "clock" },
];

export const mockTrainingPlans: TrainingPlan[] = [
  {
    id: "plan-padel-rebuild",
    coachId: "maya",
    coachName: "Maya Rosenfeld",
    title: "30-Day Padel Rebuild",
    description:
      "Rebuild your mechanics from scratch. 12 video lessons, weekly drills, and a printable schedule.",
    durationDays: 30,
    totalWorkouts: 12,
    difficulty: "intermediate",
    priceILS: 480,
    priceLabel: "one-time",
    rating: 4.8,
    reviewCount: 34,
    isBestSeller: true,
    workouts: Array.from({ length: 12 }).map<PlanWorkout>((_, i) => ({
      id: `pw-${i + 1}`,
      planId: "plan-padel-rebuild",
      dayNumber: (i + 1) * 2,
      weekNumber: Math.floor(i / 3) + 1,
      title: ["Grip & stance", "Footwork", "Serve builder", "Volley work", "Drills", "Positioning"][i % 6],
      type: (["strength", "cardio", "sport", "mobility", "recovery"] as const)[i % 5],
      durationMin: 45 + (i % 3) * 10,
      description: "Structured workout with drills and demo videos.",
      drillCount: 4 + (i % 3),
    })),
  },
];

export const mockThreads: MessageThread[] = [
  {
    id: "th-maya",
    peerId: "maya",
    peerName: "Maya Rosenfeld",
    peerGradient: "teal-gold",
    peerIsCoach: true,
    peerIsOnline: true,
    lastMessagePreview: "",
    lastMessageAt: ISO(new Date()),
    pinned: true,
    typing: true,
  },
  {
    id: "th-daniel",
    peerId: "daniel",
    peerName: "Daniel Kramer",
    peerGradient: "orange-peach",
    peerIsCoach: true,
    lastMessagePreview: "📹 Video recap · Session Dec 7",
    lastMessageAt: ISO(atHour(new Date(), 14, 22)),
    unreadCount: 1,
  },
  {
    id: "th-tlv",
    peerId: "ch-tlv",
    peerName: "Tel Aviv Padel",
    peerGradient: "teal-mint",
    isChannel: true,
    channelMemberCount: 1240,
    lastMessagePreview: "Ron: Anyone up for doubles tomorrow at 19:00, Jaffa?",
    lastMessageAt: ISO(atHour(new Date(), 11, 8)),
    unreadCount: 14,
  },
  {
    id: "th-amir",
    peerId: "amir",
    peerName: "Amir Shaul",
    peerGradient: "teal-mint",
    peerIsCoach: true,
    lastMessagePreview: "Perfect, see you Sunday ☀️",
    lastMessageAt: ISO(atHour(new Date(), 9, 41)),
  },
  {
    id: "th-yael",
    peerId: "yael",
    peerName: "Yael Avraham",
    peerGradient: "orange-peach",
    lastMessagePreview: "Thanks for the tip on grip pressure!",
    lastMessageAt: addDays(-1).toISOString(),
  },
];

export const mockMessages: Record<string, Message[]> = {
  "th-maya": [
    { id: "m1", threadId: "th-maya", authorId: "maya", authorName: "Maya", body: "Hey Guy! Saw you booked Friday at 18:00 — looking forward to it 💚", sentAt: addDays(-1).toISOString(), isMe: false },
    { id: "m2", threadId: "th-maya", authorId: "guy", authorName: "Guy", body: "Me too! One question — should I bring my own racquet or use the club's?", sentAt: addDays(-1).toISOString(), isMe: true, read: true },
    { id: "m3", threadId: "th-maya", authorId: "maya", authorName: "Maya", body: "Bring yours — we'll work on your backhand grip. What weight are you playing with right now?", sentAt: addDays(-1).toISOString(), isMe: false },
    { id: "m4", threadId: "th-maya", authorId: "guy", authorName: "Guy", body: "360g, Bullpadel Vertex", sentAt: addDays(-1).toISOString(), isMe: true, read: true },
    { id: "m5", threadId: "th-maya", authorId: "maya", authorName: "Maya", body: "Perfect. Warm up before — 10 min light cardio + shoulder rotations. Mobility matters for what we're doing 🔥", sentAt: addDays(-1).toISOString(), isMe: false },
    { id: "m6", threadId: "th-maya", authorId: "maya", authorName: "Maya", body: "", sentAt: ISO(new Date()), isMe: false, kind: "booking-ref", bookingRef: { title: "1-on-1 · 60 min · Tomorrow", when: "Fri Dec 12 · 18:00 · Jaffa Padel Club", location: "Jaffa Padel Club", status: "confirmed" } },
    { id: "m7", threadId: "th-maya", authorId: "maya", authorName: "Maya", body: "Quick heads up — there's a serve clinic Saturday morning if you want to join. Small group, 4 spots left", sentAt: ISO(new Date()), isMe: false },
    { id: "m8", threadId: "th-maya", authorId: "maya", authorName: "Maya", body: "", sentAt: ISO(new Date()), isMe: false, kind: "product-ref", productRef: { title: "Serve clinic · 4 weeks", subtitle: "Sat 09:00", priceILS: 220 } },
    { id: "m9", threadId: "th-maya", authorId: "guy", authorName: "Guy", body: "Interesting 🤔 let me check Saturday morning and get back to you", sentAt: ISO(new Date()), isMe: true, delivered: true },
  ],
};

export const mockVideos: Video[] = [
  { id: "v1", coachId: "maya", title: "Backhand volley · full breakdown", durationSec: 18 * 60 + 32, viewCount: 2340, createdAt: addDays(-4).toISOString(), tier: "circle", progressPct: 42, chapters: [
    { num: 1, title: "Grip & stance", startSec: 0 },
    { num: 2, title: "Contact point fundamentals", startSec: 3 * 60 + 24 },
    { num: 3, title: "Drill: volley progression", startSec: 7 * 60 + 50 },
    { num: 4, title: "Common mistakes", startSec: 12 * 60 + 18 },
    { num: 5, title: "Practice routine", startSec: 15 * 60 + 40 },
  ] },
  { id: "v2", coachId: "maya", title: "3-pattern footwork drill", durationSec: 12 * 60 + 8, viewCount: 1120, createdAt: addDays(-2).toISOString(), tier: "circle", isNew: true },
  { id: "v3", coachId: "maya", title: "Smash technique", durationSec: 8 * 60 + 42, viewCount: 4100, createdAt: addDays(-8).toISOString(), tier: "free" },
  { id: "v4", coachId: "maya", title: "Mental game: pressure", durationSec: 14 * 60 + 20, viewCount: 380, createdAt: addDays(-10).toISOString(), tier: "vip" },
  { id: "v5", coachId: "maya", title: "Serve warmup", durationSec: 6 * 60 + 18, viewCount: 2800, createdAt: addDays(-15).toISOString(), tier: "free" },
  { id: "v6", coachId: "maya", title: "Positioning deep-dive", durationSec: 22 * 60 + 4, viewCount: 890, createdAt: addDays(-12).toISOString(), tier: "circle" },
];

export const mockLiveSession: LiveSession = {
  id: "live-1",
  coachId: "maya",
  coachName: "Maya Rosenfeld",
  title: "Serve drills · live session",
  startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  viewerCount: 247,
  chatMessages: [
    { id: "lm1", author: "__system", body: "← Yael joined", isSystem: true },
    { id: "lm2", author: "Guy", body: "Looking sharp today 🔥" },
    { id: "lm3", author: "Maya", body: "Thanks! Next drill coming up", isCoach: true },
    { id: "lm4", author: "Ron", body: "What's the racquet weight you use?" },
    { id: "lm5", author: "Yael", body: "Can you show the grip again?" },
  ],
};

function mkEvent(
  id: string,
  type: CalendarEvent["type"],
  title: string,
  offsetDays: number,
  startH: number,
  durationMin: number,
  extras: Partial<CalendarEvent> = {}
): CalendarEvent {
  return {
    id,
    type,
    title,
    startsAt: ISO(atHour(addDays(offsetDays), startH)),
    durationMin,
    ...extras,
  };
}

export const mockCalendarEvents: CalendarEvent[] = [
  mkEvent("ce1", "session", "Maya Rosenfeld · 1-on-1", 2, 18, 60, { coachId: "maya", coachName: "Maya Rosenfeld", location: "Jaffa Padel Club" }),
  mkEvent("ce2", "session", "Daniel Kramer · Group", 4, 10, 90, { coachId: "daniel", coachName: "Daniel Kramer", location: "Florentin Club" }),
  mkEvent("ce3", "workout", "Leg day at the gym", 1, 7, 60, { workoutType: "strength" }),
  mkEvent("ce4", "plan-item", "30-Day Padel Rebuild · Day 8", 3, 17, 45, { planId: "plan-padel-rebuild", planDayNumber: 8 }),
  mkEvent("ce5", "workout", "Recovery ride", 5, 8, 40, { workoutType: "cardio" }),
  mkEvent("ce6", "session", "Maya Rosenfeld · 1-on-1", 9, 18, 60, { coachId: "maya", coachName: "Maya Rosenfeld", location: "Jaffa Padel Club" }),
  mkEvent("ce7", "live", "Serve drills · live session", 0, 19, 45, { coachId: "maya", coachName: "Maya Rosenfeld" }),
];
