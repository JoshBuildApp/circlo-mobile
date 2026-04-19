import { Navigate, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Settings as SettingsIcon, ChevronRight, Calendar, Star, Edit3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StatusBar, TabBar, RoundButton, Avatar, SectionHeader, Chip } from "@/components/v2/shared";
import { useMyPlayerProfile, useMySessions } from "@/hooks/v2/useMocks";
import { useRole } from "@/contexts/v2/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { uploadAvatar } from "@/lib/v2/storage";

export default function UserProfileV2() {
  const navigate = useNavigate();
  const { isCoach } = useRole();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: me } = useMyPlayerProfile();
  const { data: pastSessions = [] } = useMySessions("past");
  const { data: upcomingSessions = [] } = useMySessions("upcoming");
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

  // Stable activity list (derived once per render).
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

      {/* Identity card — one compact block, not 3 stacked rows. */}
      <header className="px-5 pt-4 pb-5">
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
              size={72}
              gradient="teal-mint"
              src={me?.avatarUrl}
              alt={me?.fullName ?? "You"}
            />
            <button
              aria-label="Change photo"
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
            <h2 className="text-[20px] font-extrabold tracking-tight leading-tight truncate">{me?.fullName ?? "Member"}</h2>
            <div className="text-v2-muted text-[12px] mt-0.5 truncate">
              {me?.city ?? "—"}
            </div>
            {me?.sport && (
              <Chip variant="teal" className="!text-[10px] !px-2 !py-0.5 mt-2">
                {me.sport} · {me.level}
              </Chip>
            )}
          </div>
        </div>
      </header>

      {/* Three headline stats. Everything else is one tap away. */}
      <div className="px-5 mb-5">
        <div className="bg-navy-card rounded-[16px] grid grid-cols-3 overflow-hidden">
          <div className="text-center py-3 border-r border-navy-line">
            <div className="text-[18px] font-extrabold tnum">{me?.sessionCount ?? 0}</div>
            <div className="text-[10px] text-v2-muted mt-0.5 uppercase tracking-wider font-semibold">Sessions</div>
          </div>
          <div className="text-center py-3 border-r border-navy-line">
            <div className="text-[18px] font-extrabold tnum text-teal">{me?.circleCount ?? 0}</div>
            <div className="text-[10px] text-v2-muted mt-0.5 uppercase tracking-wider font-semibold">Circles</div>
          </div>
          <div className="text-center py-3">
            <div className="text-[18px] font-extrabold tnum text-orange">{me?.rating ?? 0}★</div>
            <div className="text-[10px] text-v2-muted mt-0.5 uppercase tracking-wider font-semibold">Rating</div>
          </div>
        </div>
      </div>

      {/* Next session callout — only if there's one to show. */}
      {me?.nextSession && (
        <div className="px-5 mb-5">
          <button
            onClick={() => navigate("/v2/profile/bookings")}
            className="w-full p-4 rounded-[16px] flex items-center gap-3.5 text-left border border-teal-dim"
            data-grad="teal-soft"
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

      {/* Recent activity. Simple list, empty-state designed. */}
      <SectionHeader title="Activity" action="My bookings" onAction={() => navigate("/v2/profile/bookings")} />
      <div className="px-5 flex flex-col gap-2 pb-8">
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
