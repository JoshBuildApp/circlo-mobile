import { Navigate, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import {
  Settings as SettingsIcon,
  ChevronRight,
  Calendar,
  Star,
  Edit3,
  Loader2,
  Trophy,
  Flame,
  Instagram,
  Youtube,
  Music2,
  Plus,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  PhoneFrame,
  StatusBar,
  TabBar,
  RoundButton,
  Avatar,
  SectionHeader,
  Chip,
  HScroll,
} from "@/components/v2/shared";
import { CoachCard } from "@/components/v2/home/CoachCard";
import { useMyPlayerProfile, useMySessions, useCoaches } from "@/hooks/v2/useMocks";
import { useRole } from "@/contexts/v2/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { uploadAvatar } from "@/lib/v2/storage";

/**
 * Rich player profile. Mirrors the coach AboutTab section rhythm so both
 * surfaces feel part of the same family:
 *   Identity → Level/streak → Stats → About → Next session → Achievements
 *          → Activity → My coaches → My circles → Social.
 * Sections without live data use thoughtful defaults. The profile builder
 * (Option A) will make all of this configurable later.
 */
export default function UserProfileV2() {
  const navigate = useNavigate();
  const { isCoach } = useRole();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: me } = useMyPlayerProfile();
  const { data: pastSessions = [] } = useMySessions("past");
  const { data: upcomingSessions = [] } = useMySessions("upcoming");
  const { data: coaches = [] } = useCoaches();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Coaches get their dashboard, not a player-shaped profile. Public view and
  // edit entry points live on CoachSelfPage directly.
  if (isCoach) return <Navigate to="/v2/coach-me" replace />;

  const handlePickPhoto = () => {
    if (!user) {
      toast.error("Sign in to upload an avatar.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still fires
    if (!file || !user) return;
    setUploading(true);
    try {
      await uploadAvatar(user.id, file);
      toast.success("Photo updated.");
      qc.invalidateQueries({ queryKey: ["v2", "me"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Level derivation from the mock session count. Replace with a real XP
  // field when the backend lands it. Each 5 sessions = +1 level, current
  // progress is (sessionCount % 5) / 5.
  const sessionCount = me?.sessionCount ?? 0;
  const level = Math.max(1, Math.floor(sessionCount / 5) + 1);
  const xpProgress = ((sessionCount % 5) / 5) * 100;
  const streakDays = Math.min(12, Math.max(1, sessionCount)); // placeholder until backend

  const activity = [
    ...upcomingSessions.slice(0, 1).map((s) => ({
      key: `upcoming-${s.id}`,
      icon: Calendar,
      iconClass: "bg-teal-dim text-teal",
      title: `Booked ${s.format === "group" ? "group session" : "1-on-1"} with ${s.coachName}`,
      sub: `${new Date(s.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${s.durationMin} min`,
    })),
    ...pastSessions.slice(0, 3).map((s) => ({
      key: `past-${s.id}`,
      icon: Star,
      iconClass: "bg-orange-dim text-orange",
      title: `Completed with ${s.coachName}`,
      sub: `${new Date(s.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${s.durationMin} min`,
    })),
  ];

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />

      {/* Identity card */}
      <header className="px-5 pt-4 pb-4">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-[22px] font-extrabold tracking-tight">Profile</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/v2/profile/edit")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-card text-offwhite text-[12px] font-semibold border border-navy-line"
            >
              <Edit3 size={12} strokeWidth={2.5} /> Edit
            </button>
            <RoundButton ariaLabel="Settings" onClick={() => navigate("/v2/profile/settings")}>
              <SettingsIcon size={16} />
            </RoundButton>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative shrink-0">
            <Avatar
              size={80}
              gradient="teal-mint"
              src={me?.avatarUrl}
              alt={me?.fullName ?? "You"}
            />
            <button
              aria-label="Change photo"
              onClick={handlePickPhoto}
              disabled={uploading}
              className="absolute bottom-[-2px] right-[-2px] w-7 h-7 rounded-full bg-navy-card border-[3px] border-navy-deep flex items-center justify-center disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={12} className="text-offwhite animate-spin" strokeWidth={2.5} />
              ) : (
                <Edit3 size={12} className="text-offwhite" strokeWidth={2.5} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[22px] font-extrabold tracking-tight leading-tight truncate">
              {me?.fullName ?? "Member"}
            </h2>
            <div className="text-v2-muted text-[12px] mt-0.5 truncate">
              {me?.city ?? "—"}
              {me?.joinedAt && (
                <>
                  {" · Since "}
                  {new Date(me.joinedAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                </>
              )}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {me?.sport && (
                <Chip variant="teal" className="!text-[10px] !px-2 !py-0.5">
                  {me.sport} · {me.level}
                </Chip>
              )}
              {(me?.sportsCount ?? 0) > 0 && (
                <Chip className="!text-[10px] !px-2 !py-0.5">💪 {me?.sportsCount}</Chip>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Level + XP progress card. Replace derivation with real XP once backend lands it. */}
      <div className="px-5 mb-3">
        <div data-grad="teal-soft" className="p-4 rounded-[16px] border border-teal-dim">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-teal" strokeWidth={2.5} />
              <div className="text-[13px] font-bold text-offwhite">Level {level}</div>
            </div>
            <div className="text-[11px] text-v2-muted tnum">
              {sessionCount % 5} / 5 to next
            </div>
          </div>
          <div className="h-2 rounded-full bg-navy-deep overflow-hidden">
            <div className="h-full bg-teal rounded-full transition-[width] duration-500" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Streak card */}
      <div className="px-5 mb-3">
        <div data-grad="orange-soft" className="p-4 rounded-[16px] flex items-center gap-3 border border-orange-dim">
          <Flame size={22} className="text-orange shrink-0" strokeWidth={2.5} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold">{streakDays}-day streak</div>
            <div className="text-[11px] text-v2-muted mt-0.5">Keep it alive — train today</div>
          </div>
        </div>
      </div>

      {/* 4-stat grid */}
      <div className="px-5 mb-4 grid grid-cols-2 gap-2">
        <MiniStat label="Sessions" value={sessionCount} />
        <MiniStat label="Circles" value={me?.circleCount ?? 0} accent="teal" />
        <MiniStat label="Sports" value={me?.sportsCount ?? 0} />
        <MiniStat label="Rating" value={`${me?.rating ?? 0}★`} accent="orange" />
      </div>

      {/* About me */}
      <ProfileSection label="About me">
        <p className="text-[13px] text-offwhite leading-relaxed">
          {me?.sport ? `${me.level} ${me.sport} player based in ${me?.city ?? "—"}. ` : ""}
          {sessionCount} sessions on Circlo so far.
        </p>
      </ProfileSection>

      {/* Next session */}
      {me?.nextSession && (
        <div className="px-5 mb-3">
          <button
            onClick={() => navigate("/v2/profile/bookings")}
            className="w-full p-4 rounded-[16px] flex items-center gap-3.5 text-left bg-navy-card"
          >
            <Avatar size={44} gradient="teal-gold" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-teal font-bold tracking-wider">NEXT SESSION</div>
              <div className="text-[14px] font-bold truncate">
                {me.nextSession.coachName.split(" ")[0]} · {me.nextSession.when.split(" · ")[1] ?? me.nextSession.when}
              </div>
              <div className="text-[11px] text-v2-muted mt-0.5 truncate">{me.nextSession.location}</div>
            </div>
            <ChevronRight size={14} className="text-v2-muted" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Achievements — earned badges computed from session count. */}
      <ProfileSection label="Achievements">
        <div className="grid grid-cols-2 gap-2">
          <AchievementBadge
            icon="🎯"
            title="Early Adopter"
            sub="Joined v2"
            earned
          />
          <AchievementBadge
            icon="🔥"
            title={`${streakDays}-Day Streak`}
            sub="Consistency"
            earned
          />
          <AchievementBadge
            icon="⚡"
            title="Velocity"
            sub={`${sessionCount}+ sessions`}
            earned={sessionCount >= 5}
          />
          <AchievementBadge
            icon="🏆"
            title="Champion"
            sub="Top 10%"
            earned={false}
          />
        </div>
      </ProfileSection>

      {/* Activity feed */}
      <SectionHeader title="Activity" action="My bookings" onAction={() => navigate("/v2/profile/bookings")} />
      <div className="px-5 flex flex-col gap-2 mb-3">
        {activity.length === 0 ? (
          <ActivityRow
            icon={Calendar}
            iconClass="bg-navy-card-2 text-v2-muted"
            title="No activity yet"
            sub="Book a session to get started."
          />
        ) : (
          activity.map((it) => (
            <ActivityRow key={it.key} icon={it.icon} iconClass={it.iconClass} title={it.title} sub={it.sub} />
          ))
        )}
      </div>

      {/* My coaches */}
      {coaches.length > 0 && (
        <>
          <SectionHeader title="My coaches" action="Discover" onAction={() => navigate("/v2/discover")} />
          <HScroll>
            {coaches.slice(0, 4).map((c) => (
              <CoachCard key={c.id} coach={c} ctaLabel="Book again" onClick={() => navigate(`/v2/coach/${c.id}`)} />
            ))}
          </HScroll>
        </>
      )}

      {/* My circles */}
      {coaches.length > 0 && (
        <>
          <SectionHeader title="My circles" />
          <div className="px-5 flex flex-col gap-2 mb-4">
            {coaches.slice(0, 2).map((c, i) => (
              <button
                key={c.id}
                onClick={() => navigate(`/v2/coach/${c.id}/community`)}
                className="p-3.5 rounded-[14px] bg-navy-card flex gap-3 items-center text-left"
              >
                <Avatar size={40} src={c.avatarUrl} alt={c.name} gradient={c.avatarGradient} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate">{c.firstName}'s {c.sports[0]} Circle</div>
                  <div className="text-[11px] text-v2-muted mt-0.5 truncate">
                    {i === 0 ? "★ Circle member" : `Follower · ${(c.followerCount ?? 0).toLocaleString()} members`}
                  </div>
                </div>
                <ChevronRight size={14} className="text-v2-muted" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* FAQ — mirrors coach profile rhythm. */}
      <ProfileSection label="Frequently asked">
        <FaqRow q="How do I cancel a booking?" a="Open My bookings, pick the session, tap Cancel. Coaches get notified automatically." />
        <FaqRow q="What happens when I follow a coach?" />
        <FaqRow q="Can I have more than one sport?" />
      </ProfileSection>

      {/* Social */}
      <ProfileSection label="Socials">
        <div className="grid grid-cols-3 gap-2">
          <SocialButton icon={Instagram} label="Instagram" />
          <SocialButton icon={Youtube} label="YouTube" />
          <SocialButton icon={Music2} label="TikTok" />
        </div>
      </ProfileSection>

      <TabBar mode="player" active="profile" />
    </PhoneFrame>
  );
}

/* ---------- section primitives ---------- */

function ProfileSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mx-5 mb-3 p-4 rounded-[14px] bg-navy-card">
      <div className="text-[10px] text-v2-muted font-bold uppercase tracking-wider mb-2.5">{label}</div>
      {children}
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "teal" | "orange";
}) {
  return (
    <div className="p-3.5 rounded-[14px] bg-navy-card">
      <div className="text-[10px] text-v2-muted font-bold uppercase tracking-wider">{label}</div>
      <div
        className={`text-[20px] font-extrabold tnum mt-1 ${
          accent === "teal" ? "text-teal" : accent === "orange" ? "text-orange" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function AchievementBadge({
  icon,
  title,
  sub,
  earned,
}: {
  icon: string;
  title: string;
  sub: string;
  earned: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-[12px] bg-navy-card-2 ${
        earned ? "" : "opacity-45"
      }`}
    >
      <div className="text-[24px] leading-none mb-1.5">{icon}</div>
      <div className="text-[12px] font-bold truncate">{title}</div>
      <div className="text-[10px] text-v2-muted mt-0.5 truncate">{sub}</div>
    </div>
  );
}

function ActivityRow({
  icon: Icon,
  iconClass,
  title,
  sub,
}: {
  icon: typeof Calendar;
  iconClass: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="p-3.5 rounded-[14px] bg-navy-card flex gap-3">
      <div className={`w-9 h-9 rounded-[10px] ${iconClass} flex items-center justify-center shrink-0`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate">{title}</div>
        <div className="text-[11px] text-v2-muted mt-0.5 truncate">{sub}</div>
      </div>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a?: string }) {
  return (
    <div className="py-2 border-b border-navy-line last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex justify-between items-center text-[13px] font-bold">
        <span>{q}</span>
        {a ? <ChevronDown size={14} className="text-v2-muted rotate-180" /> : <Plus size={14} className="text-v2-muted" />}
      </div>
      {a && <div className="text-[12px] text-v2-muted mt-1 leading-snug">{a}</div>}
    </div>
  );
}

function SocialButton({ icon: Icon, label }: { icon: typeof Instagram; label: string }) {
  return (
    <button
      onClick={() => toast(`${label} link coming soon.`)}
      className="flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-navy-card-2 text-offwhite text-[12px] font-semibold"
    >
      <Icon size={13} strokeWidth={2.2} />
      {label}
    </button>
  );
}
