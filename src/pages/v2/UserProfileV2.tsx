import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { ChevronLeft, Settings as SettingsIcon, ChevronRight, Calendar, MessageSquare, Star, Users, Edit3, Repeat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StatusBar, TabBar, RoundButton, Avatar, SectionHeader, HScroll, Chip } from "@/components/v2/shared";
import { CoachCard } from "@/components/v2/home/CoachCard";
import { useMyPlayerProfile, useCoaches, useMySessions } from "@/hooks/v2/useMocks";
import { useRole } from "@/contexts/v2/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { uploadAvatar } from "@/lib/v2/storage";

export default function UserProfileV2() {
  const navigate = useNavigate();
  const { switchRole } = useRole();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: me } = useMyPlayerProfile();
  const { data: coaches = [] } = useCoaches();
  const { data: pastSessions = [] } = useMySessions("past");
  const { data: upcomingSessions = [] } = useMySessions("upcoming");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />
      <header
        className="px-5 pt-3 pb-4 relative"
        style={{ background: "linear-gradient(180deg, #1c1c30 0%, transparent 100%)" }}
      >
        <div className="flex justify-between mb-3">
          <RoundButton ariaLabel="Back" onClick={() => navigate("/v2/home")}>
            <ChevronLeft size={16} />
          </RoundButton>
          <div className="flex gap-2">
            {me?.roles.includes("coach") && (
              <button
                onClick={() => {
                  switchRole("coach");
                  navigate("/v2/coach-me");
                }}
                className="px-3 py-1.5 rounded-full bg-orange text-white text-[12px] font-bold inline-flex items-center gap-1.5 self-center"
                style={{ boxShadow: "0 4px 12px rgba(255,107,44,0.25)" }}
              >
                <Repeat size={12} strokeWidth={2.5} /> Coach
              </button>
            )}
            <RoundButton ariaLabel="Settings" onClick={() => navigate("/v2/profile/settings")}>
              <SettingsIcon size={16} />
            </RoundButton>
          </div>
        </div>

        <div className="flex gap-3.5 items-center">
          <div className="relative shrink-0">
            <Avatar
              size={72}
              gradient="teal-mint"
              src={me?.avatarUrl}
              alt={me?.fullName ?? "You"}
            />
            <button
              aria-label="Edit photo"
              onClick={handlePickPhoto}
              disabled={uploading}
              className="absolute bottom-[-2px] right-[-2px] w-6 h-6 rounded-full bg-navy-card border-[3px] border-navy-deep flex items-center justify-center disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={10} className="text-offwhite animate-spin" strokeWidth={2.5} />
              ) : (
                <Edit3 size={10} className="text-offwhite" strokeWidth={2.5} />
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
            <h2 className="text-[20px] font-extrabold tracking-tight leading-tight">{me?.fullName ?? "Member"}</h2>
            <div className="text-v2-muted text-[12px] mt-0.5 truncate">
              📍 {me?.city} · Since {me ? new Date(me.joinedAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" }) : "—"}
            </div>
            <div className="flex gap-1 mt-1.5">
              <Chip variant="teal" className="!text-[10px] !px-2 !py-0.5">🎾 {me?.sport ?? "Sport"} · {me?.level}</Chip>
              <Chip className="!text-[10px] !px-2 !py-0.5">💪 {me?.sportsCount ?? 0}</Chip>
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 mb-4">
        <div className="bg-navy-card rounded-[16px] grid grid-cols-3 overflow-hidden">
          <div className="text-center py-3 border-r border-navy-line">
            <div className="text-[18px] font-extrabold tnum">{me?.sessionCount ?? 0}</div>
            <div className="text-[10px] text-v2-muted mt-0.5 uppercase tracking-wider font-semibold">sessions</div>
          </div>
          <div className="text-center py-3 border-r border-navy-line">
            <div className="text-[18px] font-extrabold tnum text-teal">{me?.circleCount ?? 0}</div>
            <div className="text-[10px] text-v2-muted mt-0.5 uppercase tracking-wider font-semibold">circles</div>
          </div>
          <div className="text-center py-3">
            <div className="text-[18px] font-extrabold tnum text-orange">{me?.rating ?? 0}★</div>
            <div className="text-[10px] text-v2-muted mt-0.5 uppercase tracking-wider font-semibold">rating</div>
          </div>
        </div>
      </div>

      {me?.nextSession && (
        <div className="px-5 mb-3.5">
          <button
            onClick={() => navigate("/v2/profile/bookings")}
            className="w-full p-4 rounded-[16px] flex items-center gap-3.5 text-left border border-teal-dim"
            data-grad="teal-soft"
          >
            <Avatar size={44} gradient="teal-gold" />
            <div className="flex-1">
              <div className="text-[13px] font-bold">Next: {me.nextSession.coachName.split(" ")[0]} · {me.nextSession.when.split(" · ")[1] ?? me.nextSession.when}</div>
              <div className="text-[11px] text-v2-muted mt-0.5">{me.nextSession.location} · in 2 days</div>
            </div>
            <RoundButton ariaLabel="Open">
              <ChevronRight size={14} strokeWidth={2.5} />
            </RoundButton>
          </button>
        </div>
      )}

      <SectionHeader title="My coaches" action="See all" onAction={() => navigate("/v2/discover")} />
      <HScroll>
        {coaches.slice(0, 3).map((c) => (
          <CoachCard key={c.id} coach={c} ctaLabel="Book again" onClick={() => navigate(`/v2/coach/${c.id}`)} />
        ))}
      </HScroll>

      <SectionHeader title="My circles" />
      <div className="px-5 flex flex-col gap-2">
        {coaches.slice(0, 2).map((c, i) => (
          <button
            key={c.id}
            onClick={() => navigate(`/v2/coach/${c.id}/community`)}
            className="p-3.5 rounded-[14px] bg-navy-card flex gap-3 items-center text-left"
          >
            <Avatar size={40} src={c.avatarUrl} alt={c.name} gradient={c.avatarGradient} />
            <div className="flex-1">
              <div className="text-[14px] font-bold">{c.firstName}'s {c.sports[0]} Circle</div>
              <div className="text-[11px] text-v2-muted mt-0.5">
                {i === 0 ? "★ CIRCLE MEMBER · ₪59/mo" : `Follower · ${c.followerCount?.toLocaleString() ?? 0} members`}
              </div>
            </div>
            <ChevronRight size={14} className="text-v2-muted" />
          </button>
        ))}
      </div>

      <SectionHeader title="Activity" />
      <div className="px-5 flex flex-col gap-2 pb-8">
        {(() => {
          // Pull a small recent timeline from real sessions. Falls back to a
          // helpful prompt when the user has no history yet.
          const items = [
            ...upcomingSessions.slice(0, 1).map((s) => ({
              key: `upcoming-${s.id}`,
              icon: Calendar,
              iconClass: "bg-teal-dim text-teal",
              title: `Booked ${s.format === "group" ? "group session" : "1-on-1"} with ${s.coachName}`,
              sub: `${new Date(s.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${s.durationMin} min · ${s.status}`,
            })),
            ...pastSessions.slice(0, 2).map((s) => ({
              key: `past-${s.id}`,
              icon: Star,
              iconClass: "bg-orange-dim text-orange",
              title: `Completed session with ${s.coachName}`,
              sub: `${new Date(s.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${s.durationMin} min`,
            })),
          ];
          if (items.length === 0) {
            return (
              <ActivityRow
                icon={Calendar}
                iconClass="bg-navy-card-2 text-v2-muted"
                title="No activity yet"
                sub="Bookings and milestones will show up here."
              />
            );
          }
          return items.map((it) => (
            <ActivityRow key={it.key} icon={it.icon} iconClass={it.iconClass} title={it.title} sub={it.sub} />
          ));
        })()}
      </div>

      <TabBar mode="player" active="profile" />
    </PhoneFrame>
  );
}

function ActivityRow({ icon: Icon, iconClass, title, sub }: { icon: typeof Calendar; iconClass: string; title: string; sub: string }) {
  return (
    <div className="p-3.5 rounded-[14px] bg-navy-card flex gap-3">
      <div className={`w-9 h-9 rounded-[10px] ${iconClass} flex items-center justify-center shrink-0`}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[11px] text-v2-muted mt-0.5">{sub}</div>
      </div>
    </div>
  );
}
