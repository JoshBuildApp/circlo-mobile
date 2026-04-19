import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings as SettingsIcon, ChevronRight, Calendar, MessageSquare, Star, Users, Edit3, Repeat } from "lucide-react";
import { PhoneFrame, StatusBar, TabBar, RoundButton, Avatar, SectionHeader, HScroll, Chip } from "@/components/v2/shared";
import { CoachCard } from "@/components/v2/home/CoachCard";
import { useMyPlayerProfile, useCoaches } from "@/hooks/v2/useMocks";
import { useRole } from "@/contexts/v2/RoleContext";

export default function UserProfileV2() {
  const navigate = useNavigate();
  const { switchRole } = useRole();
  const { data: me } = useMyPlayerProfile();
  const { data: coaches = [] } = useCoaches();

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />
      <div
        className="px-5 pt-5"
        style={{ background: "linear-gradient(180deg, #1c1c30 0%, #0A0A0F 70%)" }}
      >
        <div className="flex justify-between mb-5">
          <RoundButton ariaLabel="Back" onClick={() => navigate("/v2/home")}>
            <ChevronLeft size={16} />
          </RoundButton>
          <RoundButton ariaLabel="Settings" onClick={() => navigate("/v2/profile/settings")}>
            <SettingsIcon size={16} />
          </RoundButton>
        </div>

        <div className="flex justify-center mb-3.5 relative">
          <div className="relative">
            <Avatar size={96} gradient="teal-mint" />
            <button
              aria-label="Edit photo"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-navy-card border-[3px] border-navy-deep flex items-center justify-center"
            >
              <Edit3 size={12} className="text-offwhite" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <h2 className="text-center text-[24px] font-extrabold tracking-tight mb-1">{me?.fullName ?? "Member"}</h2>
        <div className="text-center text-v2-muted text-[13px] mb-3">
          📍 {me?.city} · Member since {me ? new Date(me.joinedAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" }) : "—"}
        </div>

        <div className="flex gap-1.5 justify-center mb-3">
          <Chip variant="teal">🎾 {me?.sport ?? "Sport"} · {me?.level}</Chip>
          <Chip>💪 {me?.sportsCount ?? 0} sports</Chip>
        </div>

        {me?.roles.includes("coach") && (
          <div className="flex justify-center mb-5">
            <button
              onClick={() => {
                switchRole("coach");
                navigate("/v2/coach-me");
              }}
              className="px-4 py-2.5 rounded-full text-white text-[12px] font-bold inline-flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #FF6B2C, #ff9d6c)",
                boxShadow: "0 4px 14px rgba(255,107,44,0.25)",
              }}
            >
              <Repeat size={14} strokeWidth={2.5} />
              Switch to coach view
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 px-5 mb-5">
        <div className="p-3.5 rounded-[14px] bg-navy-card text-center">
          <div className="text-[20px] font-extrabold tnum">{me?.sessionCount ?? 0}</div>
          <div className="text-[11px] text-v2-muted mt-0.5">sessions</div>
        </div>
        <div className="p-3.5 rounded-[14px] bg-navy-card text-center">
          <div className="text-[20px] font-extrabold tnum text-teal">{me?.circleCount ?? 0}</div>
          <div className="text-[11px] text-v2-muted mt-0.5">circles joined</div>
        </div>
        <div className="p-3.5 rounded-[14px] bg-navy-card text-center">
          <div className="text-[20px] font-extrabold tnum text-orange">{me?.rating ?? 0}★</div>
          <div className="text-[11px] text-v2-muted mt-0.5">player rating</div>
        </div>
      </div>

      {me?.nextSession && (
        <div className="px-5 mb-3.5">
          <button
            onClick={() => navigate("/v2/profile/bookings")}
            className="w-full p-4 rounded-[16px] flex items-center gap-3.5 text-left border border-teal-dim"
            style={{ background: "linear-gradient(135deg, #0f3b33, #0a2722)" }}
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
            <Avatar size={40} gradient={c.avatarGradient} />
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
        <ActivityRow icon={Calendar} iconClass="bg-teal-dim text-teal" title="Completed session with Maya" sub="3 days ago · 60 min · ₪280" />
        <ActivityRow icon={Star} iconClass="bg-orange-dim text-orange" title="Maya left you a review" sub='"Great footwork improvement this month" · 5★' />
        <ActivityRow icon={Users} iconClass="bg-teal-dim text-teal" title="Joined Maya's Padel Circle" sub="1 week ago · Circle Member tier" />
        <ActivityRow icon={MessageSquare} iconClass="bg-teal-dim text-teal" title="Messaged Daniel" sub="2 weeks ago" />
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
