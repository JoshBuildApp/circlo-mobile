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
  Coach,
  CoachBadge,
  CoachProfile,
  PlayerProfile,
  SportKey,
  UserRole,
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
  };
}

export async function fetchCoaches(): Promise<Coach[]> {
  const { data, error } = await supabase
    .from("coach_profiles")
    .select(
      "id, user_id, coach_name, sport, tagline, bio, image_url, location, price, rating, followers, total_sessions, is_verified, specialties"
    )
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
