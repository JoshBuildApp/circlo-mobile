/**
 * v2 Supabase query helpers.
 *
 * Each function returns the same shape as its mock-hook counterpart in
 * `useMocks.ts`, so the two are interchangeable. Hooks pick which one to
 * call based on whether the current user is authenticated.
 *
 * Reads from these tables:
 *   - public.profiles       (user_id PK, username, avatar_url, age, ...)
 *   - public.user_roles     (user_id, role)
 *   - public.coach_profiles (id PK, user_id FK, coach_name, sport, image_url,
 *                            tagline, bio, rating, price, followers,
 *                            total_sessions, is_verified, location, ...)
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  BookingRequest,
  CalendarEvent,
  CirclePost,
  Coach,
  CoachBadge,
  CoachProfile,
  Message,
  MessageThread,
  PlanWorkout,
  PlayerProfile,
  Session,
  SessionStatus,
  SportKey,
  TrainingPlan,
  UserRole,
  Video,
  WorkoutType,
} from "@/types/v2";

/* ---------- shared mappers ---------- */

const SPORT_MAP: Record<string, SportKey> = {
  padel: "padel",
  boxing: "boxing",
  strength: "strength",
  yoga: "yoga",
  running: "running",
  tennis: "tennis",
};

function toSport(s: string | null | undefined): SportKey {
  if (!s) return "padel";
  return SPORT_MAP[s.toLowerCase()] ?? "padel";
}

function pickGradient(seed: string): Coach["avatarGradient"] {
  const choices: Coach["avatarGradient"][] = ["teal-gold", "orange-peach", "teal-mint", "gold-teal"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return choices[h % choices.length];
}

interface DbCoachRow {
  id: string;
  user_id: string;
  coach_name: string | null;
  sport: string | null;
  tagline: string | null;
  bio: string | null;
  image_url: string | null;
  location: string | null;
  price: number | null;
  rating: number | null;
  followers: number | null;
  total_sessions: number | null;
  is_verified: boolean | null;
  specialties: string[] | null;
}

interface DbProfileRow {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  age: number | null;
  interests: string[] | null;
}

interface DbUserRoleRow {
  user_id: string;
  role: string;
}

function rowToCoach(c: DbCoachRow, p?: DbProfileRow): Coach {
  const fullName = c.coach_name ?? p?.username ?? "Coach";
  const firstName = fullName.split(" ")[0] ?? "Coach";
  const badges: CoachBadge[] = [];
  if (c.is_verified) badges.push("verified");
  if ((c.followers ?? 0) > 200) badges.push("top1");

  return {
    id: c.id,
    name: fullName,
    firstName,
    tagline: c.tagline ?? `${firstName} · ${c.sport ?? "Coach"}`,
    bio: c.bio ?? "",
    city: c.location?.split(",")[0] ?? "Tel Aviv",
    sports: [toSport(c.sport)],
    rating: c.rating ?? 0,
    reviewCount: 0,
    priceFromILS: c.price ?? 0,
    badges,
    avatarUrl: c.image_url ?? p?.avatar_url ?? undefined,
    avatarGradient: pickGradient(c.id),
    followerCount: c.followers ?? 0,
    sessionsThisWeek: c.total_sessions ?? 0,
    isAvailable: true,
    avgResponseMin: 12,
  };
}

/* ---------- queries ---------- */

export async function fetchMyPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_url, age, interests")
    .eq("user_id", userId)
    .maybeSingle();
  if (pErr) {
    console.error("[v2] profiles fetch failed:", pErr.message);
    return null;
  }
  if (!profile) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const roleSet = new Set<UserRole>();
  (roles ?? []).forEach((r: DbUserRoleRow) => {
    if (r.role === "coach") roleSet.add("coach");
    else roleSet.add("player");
  });
  if (roleSet.size === 0) roleSet.add("player");

  const username = profile.username ?? "Member";
  return {
    id: profile.user_id,
    firstName: username.split(/[ .]/)[0] ?? "You",
    fullName: username.replace(/\./g, " "),
    email: "",
    city: "Tel Aviv",
    joinedAt: new Date().toISOString(),
    sport: "padel",
    level: "intermediate",
    sportsCount: profile.interests?.length ?? 1,
    sessionCount: 0,
    circleCount: 0,
    rating: 4.8,
    roles: Array.from(roleSet),
    avatarUrl: profile.avatar_url ?? undefined,
  };
}

export interface CoachSearchFilters {
  /** Free-text search (matches name, tagline, bio, sport). */
  query?: string;
  /** Limit to a single sport. */
  sport?: SportKey | null;
  /** Optional max price in ILS. */
  priceMax?: number;
  /** Optional min rating (0-5). */
  minRating?: number;
}

export async function fetchCoaches(filters: CoachSearchFilters = {}): Promise<Coach[]> {
  let q = supabase
    .from("coach_profiles")
    .select(
      "id, user_id, coach_name, sport, tagline, bio, image_url, location, price, rating, followers, total_sessions, is_verified, specialties"
    );

  if (filters.sport) q = q.eq("sport", filters.sport);
  if (typeof filters.priceMax === "number") q = q.lte("price", filters.priceMax);
  if (typeof filters.minRating === "number" && filters.minRating > 0) {
    q = q.gte("rating", filters.minRating);
  }
  if (filters.query && filters.query.trim()) {
    const term = filters.query.trim();
    // Postgres ILIKE wildcard search across the most-relevant text columns.
    // We OR them so any field can match; Supabase string syntax for OR.
    q = q.or(
      `coach_name.ilike.%${term}%,tagline.ilike.%${term}%,bio.ilike.%${term}%,sport.ilike.%${term}%`
    );
  }

  const { data, error } = await q
    .order("followers", { ascending: false })
    .limit(40);
  if (error) {
    console.error("[v2] coach_profiles fetch failed:", error.message);
    return [];
  }
  const rows = (data ?? []) as DbCoachRow[];
  if (rows.length === 0) return [];

  // Backfill avatar_url from profiles where coach_profiles.image_url is null.
  const userIds = rows.map((r) => r.user_id).filter(Boolean);
  let profileMap = new Map<string, DbProfileRow>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url, age, interests")
      .in("user_id", userIds);
    (profiles ?? []).forEach((p: DbProfileRow) => profileMap.set(p.user_id, p));
  }
  return rows.filter((r) => r.coach_name?.trim()).map((r) => rowToCoach(r, profileMap.get(r.user_id)));
}

export async function fetchCoach(id: string): Promise<Coach | null> {
  const { data, error } = await supabase
    .from("coach_profiles")
    .select(
      "id, user_id, coach_name, sport, tagline, bio, image_url, location, price, rating, followers, total_sessions, is_verified, specialties"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[v2] coach fetch failed:", error.message);
    return null;
  }
  const row = data as DbCoachRow;
  let profile: DbProfileRow | undefined;
  if (row.user_id) {
    const { data: p } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url, age, interests")
      .eq("user_id", row.user_id)
      .maybeSingle();
    if (p) profile = p as DbProfileRow;
  }
  return rowToCoach(row, profile);
}

/* ---------- bookings & requests ---------- */

interface DbBookingRow {
  id: string;
  user_id: string | null;
  coach_id: string | null;
  coach_name: string | null;
  date: string | null;        // "YYYY-MM-DD"
  time: string | null;        // "HH:MM"
  time_label: string | null;
  status: string | null;
  price: number | null;
  total_participants: number | null;
  is_group: boolean | null;
  training_type: string | null;
  booking_code: string | null;
  created_at: string | null;
}

function combineDateTime(date: string | null, time: string | null): string {
  if (!date) return new Date().toISOString();
  const t = time && /^\d{2}:\d{2}/.test(time) ? time : "00:00";
  return new Date(`${date}T${t}:00`).toISOString();
}

function statusFor(s: string | null): SessionStatus {
  switch ((s ?? "").toLowerCase()) {
    case "confirmed":
    case "accepted":
    case "approved":
      return "confirmed";
    case "completed":
    case "done":
      return "completed";
    case "cancelled":
    case "canceled":
    case "declined":
      return "cancelled";
    default:
      return "pending";
  }
}

function rowToSession(b: DbBookingRow): Session {
  const startsAt = combineDateTime(b.date, b.time);
  const durationMin = b.is_group ? 90 : 60;
  const ends = new Date(new Date(startsAt).getTime() + durationMin * 60_000).toISOString();
  return {
    id: b.id,
    coachId: b.coach_id ?? "",
    coachName: b.coach_name ?? "Coach",
    format: b.is_group ? "group" : "one-on-one",
    durationMin,
    startsAt,
    endsAt: ends,
    location: undefined,
    locationSubline: undefined,
    status: statusFor(b.status),
    priceILS: b.price ?? 0,
    totalILS: b.price ?? 0,
    capacity: b.is_group ? b.total_participants ?? 4 : undefined,
    ref: b.booking_code ?? undefined,
  };
}

function rowToBookingRequest(b: DbBookingRow, studentName?: string): BookingRequest {
  return {
    id: b.id,
    studentId: b.user_id ?? "",
    studentName: studentName ?? "Student",
    format: b.is_group ? "group" : b.training_type === "video-review" ? "video-review" : "one-on-one",
    durationMin: b.is_group ? 90 : 60,
    startsAt: combineDateTime(b.date, b.time),
    priceILS: b.price ?? 0,
    createdAt: b.created_at ?? new Date().toISOString(),
    status: statusFor(b.status) === "confirmed" ? "accepted" : statusFor(b.status) === "cancelled" ? "declined" : "pending",
  };
}

export async function fetchMySessions(userId: string, filter: "upcoming" | "past" | "cancelled"): Promise<Session[]> {
  const today = new Date().toISOString().slice(0, 10);
  let q = supabase
    .from("bookings")
    .select("id, user_id, coach_id, coach_name, date, time, time_label, status, price, total_participants, is_group, training_type, booking_code, created_at")
    .eq("user_id", userId);
  if (filter === "upcoming") q = q.gte("date", today).neq("status", "cancelled");
  else if (filter === "past") q = q.lt("date", today).neq("status", "cancelled");
  else q = q.eq("status", "cancelled");
  const { data, error } = await q.order("date", { ascending: filter === "upcoming" }).limit(40);
  if (error) {
    console.error("[v2] bookings fetch failed:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToSession(r as DbBookingRow));
}

export async function fetchBookingRequestsForCoach(
  coachUserId: string,
  filter: "new" | "responded" | "declined"
): Promise<BookingRequest[]> {
  // First find this coach's text id from coach_profiles.
  const { data: coachRow } = await supabase
    .from("coach_profiles")
    .select("id")
    .eq("user_id", coachUserId)
    .maybeSingle();
  const coachId = coachRow?.id;
  if (!coachId) return [];

  let q = supabase
    .from("bookings")
    .select("id, user_id, coach_id, coach_name, date, time, time_label, status, price, total_participants, is_group, training_type, booking_code, created_at")
    .eq("coach_id", coachId);
  if (filter === "new") q = q.eq("status", "pending");
  else if (filter === "declined") q = q.eq("status", "cancelled");
  else q = q.in("status", ["confirmed", "completed"]);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(40);
  if (error) {
    console.error("[v2] booking requests fetch failed:", error.message);
    return [];
  }
  const rows = (data ?? []) as DbBookingRow[];
  // Look up student usernames in one round trip.
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean) as string[]));
  const nameMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username")
      .in("user_id", userIds);
    (profiles ?? []).forEach((p: { user_id: string; username: string | null }) =>
      nameMap.set(p.user_id, p.username ?? "Student")
    );
  }
  return rows.map((r) => rowToBookingRequest(r, r.user_id ? nameMap.get(r.user_id) : undefined));
}

export async function fetchSession(bookingId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, user_id, coach_id, coach_name, date, time, time_label, status, price, total_participants, is_group, training_type, booking_code, created_at")
    .eq("id", bookingId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[v2] fetchSession failed:", error.message);
    return null;
  }
  return rowToSession(data as DbBookingRow);
}

export interface CreateBookingInput {
  userId: string;
  coachId: string;
  coachName: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:MM
  durationMin: number;
  priceILS: number;
  feeILS: number;
  format: "one-on-one" | "group" | "video-review";
  note?: string;
  location?: string;
}

function generateBookingCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `CRC-${n}`;
}

export async function createBooking(input: CreateBookingInput): Promise<Session> {
  const code = generateBookingCode();
  const insert = {
    user_id: input.userId,
    coach_id: input.coachId,
    coach_name: input.coachName,
    date: input.date,
    time: input.time,
    time_label: input.time,
    status: "pending" as const,
    price: input.priceILS,
    platform_fee: input.feeILS,
    is_group: input.format === "group",
    training_type: input.format,
    booking_code: code,
  };
  const { data, error } = await supabase
    .from("bookings")
    .insert(insert)
    .select(
      "id, user_id, coach_id, coach_name, date, time, time_label, status, price, total_participants, is_group, training_type, booking_code, created_at"
    )
    .single();
  if (error || !data) {
    console.error("[v2] createBooking failed:", error?.message);
    throw error ?? new Error("Booking insert returned no row");
  }
  return rowToSession(data as DbBookingRow);
}

export async function setBookingStatus(bookingId: string, action: "accept" | "decline"): Promise<void> {
  const status = action === "accept" ? "confirmed" : "cancelled";
  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
  if (error) {
    console.error("[v2] booking status update failed:", error.message);
    throw error;
  }
}

/* ---------- coach posts ---------- */

interface DbPostRow {
  id: string;
  coach_id: string | null;
  user_id: string | null;
  text: string | null;
  created_at: string | null;
}

export async function fetchCirclePosts(coachId?: string): Promise<CirclePost[]> {
  let q = supabase
    .from("coach_posts")
    .select("id, coach_id, user_id, text, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (coachId) q = q.eq("coach_id", coachId);
  const { data, error } = await q;
  if (error) {
    console.error("[v2] coach_posts fetch failed:", error.message);
    return [];
  }
  const rows = (data ?? []) as DbPostRow[];
  if (rows.length === 0) return [];

  // Resolve author display names from profiles.
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean) as string[]));
  const nameMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username")
      .in("user_id", userIds);
    (profiles ?? []).forEach((p: { user_id: string; username: string | null }) =>
      nameMap.set(p.user_id, p.username ?? "Member")
    );
  }
  return rows.map((r) => ({
    id: r.id,
    author: r.user_id ? nameMap.get(r.user_id) ?? "Member" : "Member",
    authorGradient: pickGradient(r.user_id ?? r.id),
    isCoach: true, // coach_posts implies coach authorship
    body: r.text ?? "",
    likes: 0,
    comments: 0,
    createdAt: r.created_at ?? new Date().toISOString(),
  }));
}

/* ---------- videos ---------- */

interface DbVideoRow {
  id: string;
  coach_id: string | null;
  title: string | null;
  thumbnail_url: string | null;
  views: number | null;
  duration: number | null;
  created_at: string | null;
  is_exclusive: boolean | null;
  category: string | null;
}

function tierFor(row: DbVideoRow): Video["tier"] {
  if (row.is_exclusive) return "vip";
  if (row.category?.toLowerCase().includes("circle") || row.category?.toLowerCase().includes("member")) return "circle";
  return "free";
}

export async function fetchVideos(coachId?: string): Promise<Video[]> {
  let q = supabase
    .from("coach_videos")
    .select("id, coach_id, title, thumbnail_url, views, duration, created_at, is_exclusive, category")
    .order("created_at", { ascending: false })
    .limit(40);
  if (coachId) q = q.eq("coach_id", coachId);
  const { data, error } = await q;
  if (error) {
    console.error("[v2] coach_videos fetch failed:", error.message);
    return [];
  }
  return (data ?? []).map((r): Video => {
    const row = r as DbVideoRow;
    return {
      id: row.id,
      coachId: row.coach_id ?? "",
      title: row.title ?? "Untitled",
      durationSec: row.duration ?? 0,
      viewCount: row.views ?? 0,
      createdAt: row.created_at ?? new Date().toISOString(),
      tier: tierFor(row),
    };
  });
}

export async function fetchVideo(id: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from("coach_videos")
    .select("id, coach_id, title, thumbnail_url, views, duration, created_at, is_exclusive, category")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[v2] video fetch failed:", error.message);
    return null;
  }
  const row = data as DbVideoRow;
  return {
    id: row.id,
    coachId: row.coach_id ?? "",
    title: row.title ?? "Untitled",
    durationSec: row.duration ?? 0,
    viewCount: row.views ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    tier: tierFor(row),
  };
}

/* ---------- reviews ---------- */

export interface CoachReview {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: string;
}

export async function fetchCoachReviews(coachId: string, limit = 5): Promise<CoachReview[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, user_name, created_at")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[v2] reviews fetch failed:", error.message);
    return [];
  }
  return (data ?? []).map(
    (r: { id: string; rating: number; comment: string | null; user_name: string | null; created_at: string }) => ({
      id: r.id,
      rating: r.rating ?? 0,
      comment: r.comment,
      authorName: r.user_name ?? "Member",
      createdAt: r.created_at,
    })
  );
}

export async function fetchCoachReviewSummary(coachId: string): Promise<{ avg: number; count: number }> {
  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", coachId);
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("coach_id", coachId)
    .limit(500);
  const ratings = (data ?? []).map((r: { rating: number }) => r.rating ?? 0).filter((n: number) => n > 0);
  const avg = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
  return { avg: Math.round(avg * 10) / 10, count: count ?? ratings.length };
}

/* ---------- messages ---------- */

interface DbMessageRow {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  content: string | null;
  is_read: boolean | null;
  conversation_id: string | null;
  created_at: string | null;
}

export async function fetchMessageThreads(userId: string): Promise<MessageThread[]> {
  // Grab the most recent ~200 messages I'm a party to. Group by peer.
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, is_read, conversation_id, created_at")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[v2] messages fetch failed:", error.message);
    return [];
  }
  const rows = (data ?? []) as DbMessageRow[];
  if (rows.length === 0) return [];

  type Acc = { last: DbMessageRow; unread: number; peerId: string };
  const byPeer = new Map<string, Acc>();
  rows.forEach((m) => {
    const peerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
    if (!peerId) return;
    const existing = byPeer.get(peerId);
    if (!existing) {
      byPeer.set(peerId, {
        last: m,
        unread: m.receiver_id === userId && !m.is_read ? 1 : 0,
        peerId,
      });
    } else {
      // rows arrive newest-first, so existing.last is already the latest
      if (m.receiver_id === userId && !m.is_read) existing.unread += 1;
    }
  });
  if (byPeer.size === 0) return [];

  const peerIds = Array.from(byPeer.keys());
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_url")
    .in("user_id", peerIds);
  const profileMap = new Map<string, { username: string | null; avatar_url: string | null }>();
  (profiles ?? []).forEach((p: { user_id: string; username: string | null; avatar_url: string | null }) =>
    profileMap.set(p.user_id, p)
  );

  const { data: coachRows } = await supabase
    .from("coach_profiles")
    .select("user_id")
    .in("user_id", peerIds);
  const coachSet = new Set((coachRows ?? []).map((r: { user_id: string }) => r.user_id));

  return Array.from(byPeer.values())
    .sort((a, b) => new Date(b.last.created_at ?? 0).getTime() - new Date(a.last.created_at ?? 0).getTime())
    .map<MessageThread>((acc) => {
      const profile = profileMap.get(acc.peerId);
      return {
        id: acc.last.conversation_id ?? acc.peerId,
        peerId: acc.peerId,
        peerName: profile?.username ?? "Member",
        peerGradient: undefined,
        peerIsCoach: coachSet.has(acc.peerId),
        lastMessagePreview: acc.last.content ?? "",
        lastMessageAt: acc.last.created_at ?? new Date().toISOString(),
        unreadCount: acc.unread,
      };
    });
}

export async function sendChatMessage(opts: {
  fromUserId: string;
  toPeerId: string;
  body: string;
  threadId?: string;
}): Promise<void> {
  const insert = {
    sender_id: opts.fromUserId,
    receiver_id: opts.toPeerId,
    content: opts.body,
    is_read: false,
    conversation_id: opts.threadId && /^[0-9a-f-]{30,}$/i.test(opts.threadId) ? opts.threadId : null,
    message_type: "text",
  };
  const { error } = await supabase.from("messages").insert(insert);
  if (error) {
    console.error("[v2] sendChatMessage failed:", error.message);
    throw error;
  }
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
  if (error) {
    console.error("[v2] cancelBooking failed:", error.message);
    throw error;
  }
}

export async function followCoach(userId: string, coachId: string): Promise<void> {
  const { error } = await supabase
    .from("user_follows")
    .insert({ user_id: userId, coach_id: coachId });
  if (error && !error.message.includes("duplicate")) {
    console.error("[v2] followCoach failed:", error.message);
    throw error;
  }
}

export async function unfollowCoach(userId: string, coachId: string): Promise<void> {
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("user_id", userId)
    .eq("coach_id", coachId);
  if (error) {
    console.error("[v2] unfollowCoach failed:", error.message);
    throw error;
  }
}

export async function isFollowingCoach(userId: string, coachId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_follows")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId)
    .eq("coach_id", coachId);
  return Boolean(data);
}

/** Real availability for a coach: returns the time strings ("HH:MM") that
 *  the coach has marked as available on a given weekday (0–6, Sun–Sat).
 *  Empty array means "no slots configured" — caller should treat as either
 *  "fully booked" or "show all hours" depending on context. */
export async function fetchCoachSlots(coachId: string, weekday: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("availability")
    .select("start_time, end_time, is_active")
    .eq("coach_id", coachId)
    .eq("day_of_week", weekday);
  if (error) {
    console.error("[v2] availability fetch failed:", error.message);
    return [];
  }
  const slots: string[] = [];
  (data ?? []).forEach((row: { start_time: string; end_time: string; is_active: boolean | null }) => {
    if (row.is_active === false) return;
    // Generate hourly slots between start and end.
    const start = parseInt(row.start_time.slice(0, 2), 10);
    const end = parseInt(row.end_time.slice(0, 2), 10);
    for (let h = start; h < end; h++) {
      slots.push(`${h.toString().padStart(2, "0")}:00`);
    }
  });
  return Array.from(new Set(slots)).sort();
}

export async function fetchTakenSlots(coachId: string, date: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("bookings")
    .select("time")
    .eq("coach_id", coachId)
    .eq("date", date)
    .neq("status", "cancelled");
  if (error) {
    console.error("[v2] taken slots fetch failed:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r: { time: string | null }) => (r.time ?? "").slice(0, 5)));
}

export async function fetchChatMessages(threadId: string, userId: string): Promise<Message[]> {
  // threadId may be a conversation_id (uuid) or a fallback peer id.
  // Try conversation_id first, fall back to peer-pair lookup.
  let query = supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, is_read, conversation_id, created_at")
    .order("created_at", { ascending: true })
    .limit(200);
  // If looks like a uuid, prefer conversation_id; otherwise treat as peer.
  if (/^[0-9a-f-]{30,}$/i.test(threadId)) {
    query = query.eq("conversation_id", threadId);
  } else {
    query = query.or(`and(sender_id.eq.${userId},receiver_id.eq.${threadId}),and(sender_id.eq.${threadId},receiver_id.eq.${userId})`);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[v2] chat fetch failed:", error.message);
    return [];
  }
  const rows = (data ?? []) as DbMessageRow[];
  return rows.map<Message>((r) => ({
    id: r.id,
    threadId,
    authorId: r.sender_id ?? "",
    authorName: r.sender_id === userId ? "You" : "",
    body: r.content ?? "",
    sentAt: r.created_at ?? new Date().toISOString(),
    isMe: r.sender_id === userId,
    read: r.is_read ?? false,
    delivered: true,
  }));
}

/* ---------- training plans ---------- */

interface DbTrainingPlanRow {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  duration_days: number;
  total_workouts: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  price_ils: number;
  price_label: "one-time" | "monthly";
  rating: number | null;
  review_count: number | null;
  is_best_seller: boolean | null;
}

interface DbPlanWorkoutRow {
  id: string;
  plan_id: string;
  day_number: number;
  week_number: number;
  title: string;
  description: string | null;
  workout_type: WorkoutType;
  duration_min: number;
  drill_count: number | null;
  video_id: string | null;
}

function mapPlanWorkout(r: DbPlanWorkoutRow): PlanWorkout {
  return {
    id: r.id,
    planId: r.plan_id,
    dayNumber: r.day_number,
    weekNumber: r.week_number,
    title: r.title,
    type: r.workout_type,
    durationMin: r.duration_min,
    description: r.description ?? "",
    videoId: r.video_id ?? undefined,
    drillCount: r.drill_count ?? undefined,
  };
}

async function mapPlanRow(p: DbTrainingPlanRow): Promise<TrainingPlan> {
  const { data: workouts } = await supabase
    .from("plan_workouts")
    .select("id, plan_id, day_number, week_number, title, description, workout_type, duration_min, drill_count, video_id")
    .eq("plan_id", p.id)
    .order("day_number", { ascending: true });
  const { data: coach } = await supabase
    .from("coach_profiles")
    .select("coach_name")
    .eq("id", p.coach_id)
    .maybeSingle();
  return {
    id: p.id,
    coachId: p.coach_id,
    coachName: coach?.coach_name ?? "Coach",
    title: p.title,
    description: p.description ?? "",
    durationDays: p.duration_days,
    totalWorkouts: p.total_workouts,
    difficulty: p.difficulty,
    priceILS: p.price_ils,
    priceLabel: p.price_label,
    rating: p.rating ?? 0,
    reviewCount: p.review_count ?? 0,
    isBestSeller: Boolean(p.is_best_seller),
    workouts: (workouts ?? []).map((w) => mapPlanWorkout(w as DbPlanWorkoutRow)),
  };
}

export async function fetchTrainingPlan(id: string): Promise<TrainingPlan | null> {
  const { data, error } = await supabase
    .from("training_plans")
    .select("id, coach_id, title, description, duration_days, total_workouts, difficulty, price_ils, price_label, rating, review_count, is_best_seller")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[v2] fetchTrainingPlan failed:", error.message);
    return null;
  }
  return mapPlanRow(data as DbTrainingPlanRow);
}

export async function fetchCoachPlans(coachId?: string): Promise<TrainingPlan[]> {
  let q = supabase
    .from("training_plans")
    .select("id, coach_id, title, description, duration_days, total_workouts, difficulty, price_ils, price_label, rating, review_count, is_best_seller")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (coachId) q = q.eq("coach_id", coachId);
  const { data, error } = await q;
  if (error) {
    console.error("[v2] fetchCoachPlans failed:", error.message);
    return [];
  }
  return Promise.all((data ?? []).map((p) => mapPlanRow(p as DbTrainingPlanRow)));
}

export async function subscribeToPlanReal(opts: {
  userId: string;
  planId: string;
  startDate: Date;
}): Promise<void> {
  const plan = await fetchTrainingPlan(opts.planId);
  if (!plan) throw new Error("Plan not found");

  const { data: subRow, error: subErr } = await supabase
    .from("plan_subscriptions")
    .upsert(
      {
        user_id: opts.userId,
        plan_id: opts.planId,
        started_at: opts.startDate.toISOString(),
        current_day_number: 1,
        status: "active",
      },
      { onConflict: "user_id,plan_id" }
    )
    .select("id")
    .single();
  if (subErr || !subRow) {
    console.error("[v2] subscribeToPlanReal failed:", subErr?.message);
    throw subErr ?? new Error("subscribe failed");
  }

  // Generate one personal_workout per plan workout, scheduled relative to startDate.
  const inserts = plan.workouts.map((w) => {
    const start = new Date(opts.startDate);
    start.setDate(start.getDate() + w.dayNumber - 1);
    start.setHours(17, 0, 0, 0);
    return {
      user_id: opts.userId,
      title: `${plan.title} · Day ${w.dayNumber}`,
      workout_type: w.type,
      starts_at: start.toISOString(),
      duration_min: w.durationMin,
      plan_subscription_id: subRow.id,
      plan_workout_id: w.id,
    };
  });
  if (inserts.length > 0) {
    const { error: pwErr } = await supabase.from("personal_workouts").insert(inserts);
    if (pwErr) console.error("[v2] plan workouts insert failed:", pwErr.message);
  }
}

/* ---------- personal_workouts (calendar events) ---------- */

interface DbPersonalWorkoutRow {
  id: string;
  user_id: string;
  title: string;
  workout_type: WorkoutType;
  starts_at: string;
  duration_min: number;
  notes: string | null;
  plan_subscription_id: string | null;
  plan_workout_id: string | null;
  completed_at: string | null;
}

export async function addPersonalWorkout(opts: {
  userId: string;
  title: string;
  type: WorkoutType;
  startsAt: Date;
  durationMin: number;
  notes?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("personal_workouts")
    .insert({
      user_id: opts.userId,
      title: opts.title,
      workout_type: opts.type,
      starts_at: opts.startsAt.toISOString(),
      duration_min: opts.durationMin,
      notes: opts.notes ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[v2] addPersonalWorkout failed:", error?.message);
    throw error ?? new Error("insert failed");
  }
  return data.id;
}

export async function fetchCalendarEventsReal(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarEvent[]> {
  // Bookings the user owns.
  const start = startDate?.toISOString().slice(0, 10);
  const end = endDate?.toISOString().slice(0, 10);

  let bq = supabase
    .from("bookings")
    .select("id, coach_id, coach_name, date, time, status, is_group, training_type")
    .eq("user_id", userId)
    .neq("status", "cancelled");
  if (start) bq = bq.gte("date", start);
  if (end) bq = bq.lte("date", end);
  const { data: bookings } = await bq;

  let pwq = supabase
    .from("personal_workouts")
    .select("id, user_id, title, workout_type, starts_at, duration_min, notes, plan_subscription_id, plan_workout_id, completed_at")
    .eq("user_id", userId);
  if (startDate) pwq = pwq.gte("starts_at", startDate.toISOString());
  if (endDate) pwq = pwq.lte("starts_at", endDate.toISOString());
  const { data: workouts } = await pwq;

  const events: CalendarEvent[] = [];

  (bookings ?? []).forEach((b: DbBookingRow) => {
    if (!b.date || !b.time) return;
    events.push({
      id: b.id,
      type: "session",
      title: b.coach_name ?? "Session",
      startsAt: combineDateTime(b.date, b.time),
      durationMin: b.is_group ? 90 : 60,
      coachId: b.coach_id ?? undefined,
      coachName: b.coach_name ?? undefined,
    });
  });

  (workouts ?? []).forEach((w: DbPersonalWorkoutRow) => {
    events.push({
      id: w.id,
      type: w.plan_subscription_id ? "plan-item" : "workout",
      title: w.title,
      startsAt: w.starts_at,
      durationMin: w.duration_min,
      notes: w.notes ?? undefined,
      planId: w.plan_workout_id ? "plan" : undefined,
      workoutType: w.workout_type,
      completedAt: w.completed_at ?? undefined,
    });
  });

  return events.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export async function fetchMyCoachProfile(userId: string): Promise<CoachProfile | null> {
  const { data, error } = await supabase
    .from("coach_profiles")
    .select(
      "id, user_id, coach_name, sport, tagline, bio, image_url, location, price, rating, followers, total_sessions, is_verified, specialties"
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[v2] my coach profile fetch failed:", error.message);
    return null;
  }
  const base = rowToCoach(data as DbCoachRow);
  return {
    ...base,
    monthlyRevenueILS: 0,
    revenueDeltaPct: 0,
    payoutILS: 0,
    payoutDate: new Date().toISOString(),
    activeStudents: 0,
    contentViews: 0,
  };
}
