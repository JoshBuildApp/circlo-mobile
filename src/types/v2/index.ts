/**
 * v2 domain types. All optional v2 mock data and hooks consume these.
 * Real Supabase schemas may differ — wire adapters in hooks when connecting.
 */

export type UserRole = "player" | "coach";

export type SportKey = "padel" | "boxing" | "strength" | "yoga" | "running" | "tennis";

export type TierKey = "follower" | "member" | "vip";

export type CoachBadge = "verified" | "top1" | "new" | "pro" | "regular";

export interface Coach {
  id: string;
  name: string;
  firstName: string;
  tagline: string;
  bio: string;
  city: string;
  sports: SportKey[];
  rating: number;
  reviewCount: number;
  priceFromILS: number;
  badges: CoachBadge[];
  avatarGradient: "teal-gold" | "orange-peach" | "teal-mint" | "gold-teal";
  isOnline?: boolean;
  isAvailable?: boolean;
  avgResponseMin?: number;
  followerCount?: number;
  memberCount?: number;
  vipCount?: number;
  sessionsThisWeek?: number;
  sessionsLast30d?: number;
  tags?: string[];
  nearKm?: number;
}

export type SessionFormat = "one-on-one" | "group" | "video-review";
export type SessionStatus = "confirmed" | "pending" | "completed" | "cancelled";

export interface Session {
  id: string;
  coachId: string;
  coachName: string;
  format: SessionFormat;
  durationMin: number;
  startsAt: string; // ISO
  endsAt: string;
  location?: string;
  locationSubline?: string;
  status: SessionStatus;
  priceILS: number;
  totalILS: number;
  notes?: string;
  ref?: string;
  recurring?: boolean;
  capacity?: number;
  filled?: number;
}

export type BookingRequestStatus = "pending" | "accepted" | "declined";

export interface BookingRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentLevel?: string;
  isNewStudent?: boolean;
  pastSessionCount?: number;
  format: SessionFormat;
  durationMin: number;
  startsAt?: string;
  location?: string;
  priceILS: number;
  note?: string;
  createdAt: string;
  status: BookingRequestStatus;
  quantity?: number;
  bringing?: string;
}

export type BobNotificationType = "insight" | "action" | "alert" | "draft" | "celebration";

export interface BobInsight {
  id: string;
  type: BobNotificationType;
  title: string;
  description?: string;
  createdAt: string;
  status?: "published" | "done";
  unread?: boolean;
}

export interface BobThread {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface CirclePost {
  id: string;
  author: string;
  authorGradient?: string;
  isCoach?: boolean;
  body: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface ShopItem {
  id: string;
  coachId: string;
  title: string;
  subtitle: string;
  priceILS: number;
  priceLabel: "one-time" | "monthly" | "pack";
  variant: "teal" | "orange" | "teal-2" | "dark";
  icon: string;
  isFeatured?: boolean;
}

export interface TrainingPlan {
  id: string;
  coachId: string;
  coachName: string;
  title: string;
  description: string;
  durationDays: number;
  totalWorkouts: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  priceILS: number;
  priceLabel: "one-time" | "monthly";
  rating: number;
  reviewCount: number;
  isBestSeller?: boolean;
  workouts: PlanWorkout[];
}

export type WorkoutType = "strength" | "cardio" | "mobility" | "sport" | "recovery";

export interface PlanWorkout {
  id: string;
  planId: string;
  dayNumber: number;
  weekNumber: number;
  title: string;
  type: WorkoutType;
  durationMin: number;
  description: string;
  videoId?: string;
  drillCount?: number;
}

export interface PlanSubscription {
  id: string;
  userId: string;
  planId: string;
  startedAt: string;
  completedWorkoutIds: string[];
  currentDayNumber: number;
  status: "active" | "paused" | "completed" | "cancelled";
}

export type CalendarEventType = "session" | "workout" | "plan-item" | "blocked" | "live";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  startsAt: string;
  durationMin: number;
  coachId?: string;
  coachName?: string;
  location?: string;
  planId?: string;
  planDayNumber?: number;
  notes?: string;
  completedAt?: string;
  workoutType?: WorkoutType;
}

export interface MessageThread {
  id: string;
  peerId: string;
  peerName: string;
  peerGradient?: string;
  peerIsCoach?: boolean;
  peerIsOnline?: boolean;
  isChannel?: boolean;
  channelMemberCount?: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount?: number;
  pinned?: boolean;
  typing?: boolean;
}

export interface Message {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  body: string;
  sentAt: string;
  isMe: boolean;
  read?: boolean;
  delivered?: boolean;
  kind?: "text" | "booking-ref" | "product-ref";
  bookingRef?: {
    title: string;
    when: string;
    location: string;
    status: SessionStatus;
  };
  productRef?: {
    title: string;
    subtitle: string;
    priceILS: number;
  };
}

export interface Video {
  id: string;
  coachId: string;
  title: string;
  durationSec: number;
  viewCount: number;
  createdAt: string;
  tier: "free" | "circle" | "vip";
  progressPct?: number;
  isNew?: boolean;
  chapters?: { num: number; title: string; startSec: number }[];
}

export interface LiveSession {
  id: string;
  coachId: string;
  coachName: string;
  title: string;
  startedAt: string;
  viewerCount: number;
  chatMessages: { id: string; author: string; body: string; isCoach?: boolean; isSystem?: boolean }[];
}

export interface PlayerProfile {
  id: string;
  firstName: string;
  fullName: string;
  email: string;
  city: string;
  joinedAt: string;
  sport: SportKey;
  level: "beginner" | "intermediate" | "advanced";
  sportsCount: number;
  sessionCount: number;
  circleCount: number;
  rating: number;
  roles: UserRole[];
  nextSession?: {
    coachName: string;
    when: string;
    location: string;
  };
}

export interface CoachProfile extends Coach {
  monthlyRevenueILS: number;
  revenueDeltaPct: number;
  payoutILS: number;
  payoutDate: string;
  activeStudents: number;
  contentViews: number;
}
