import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, Search, ArrowRight, Bell } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton, Avatar, VideoThumb, HScroll, Chip } from "@/components/v2/shared";
import { useCoach, useVideos } from "@/hooks/v2/useMocks";
import { isLiveEnabled } from "@/lib/v2/featureFlag";
import { formatPrice, formatCompactNumber } from "@/lib/v2/currency";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "free", "circle", "vip", "recent"] as const;
type Filter = typeof FILTERS[number];

export default function ContentLibraryPage() {
  const navigate = useNavigate();
  const { coachId, id } = useParams();
  const targetCoach = coachId ?? id ?? "maya";
  const [filter, setFilter] = useState<Filter>("all");
  const { data: coach } = useCoach(targetCoach);
  const { data: videos = [] } = useVideos(targetCoach);

  const filtered = videos.filter((v) => {
    if (filter === "all" || filter === "recent") return true;
    return v.tier === filter;
  });
  const continueWatching = videos.find((v) => v.progressPct);
  const newThis = videos.filter((v) => v.isNew);
  const grid = filtered.filter((v) => v.id !== continueWatching?.id);

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <header className="px-5 pt-2.5 flex justify-between items-center">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={14} />
        </RoundButton>
        <div className="flex items-center gap-2 font-bold text-[15px]">
          <Avatar size={24} gradient={coach?.avatarGradient ?? "teal-gold"} />
          {coach?.firstName ?? "Coach"}'s Content
        </div>
        <RoundButton ariaLabel="Search" variant="solid-navy" size="sm">
          <Search size={14} />
        </RoundButton>
      </header>

      <div className="px-5 pt-4">
        <div className="text-[13px] text-v2-muted">
          <span className="text-offwhite font-bold tnum">{videos.length} videos</span> · 8h 24m total · 12 for members
        </div>
      </div>

      <div className="flex gap-2 px-5 py-3.5 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3.5 py-2 rounded-full font-semibold text-[13px] capitalize whitespace-nowrap",
              filter === f ? "bg-teal text-navy-deep" : "bg-navy-card text-offwhite"
            )}
          >
            {f === "free" ? `Free · ${videos.filter((v) => v.tier === "free").length}` :
             f === "circle" ? `Circle · ${videos.filter((v) => v.tier === "circle").length}` :
             f === "vip" ? `VIP · ${videos.filter((v) => v.tier === "vip").length}` :
             f}
          </button>
        ))}
      </div>

      {continueWatching && (
        <>
          <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">CONTINUE WATCHING</div>
          <div className="px-5 mb-4">
            <VideoThumb
              durationSec={continueWatching.durationSec}
              progressPct={continueWatching.progressPct}
              watchedPct={continueWatching.progressPct}
              onClick={() => navigate(`/v2/video/${continueWatching.id}`)}
            />
            <div className="mt-2.5">
              <div className="text-[14px] font-bold">{continueWatching.title}</div>
              <div className="text-[11px] text-v2-muted mt-0.5 tnum">
                {coach?.firstName} · 4 days ago · {formatCompactNumber(continueWatching.viewCount)} views
              </div>
            </div>
          </div>
        </>
      )}

      <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">FEATURED PROGRAM</div>
      <div className="px-5 mb-4">
        <div
          className="p-5 rounded-[18px] relative overflow-hidden"
          data-grad="orange-soft"
        >
          <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange tracking-widest uppercase">
            ★ BEST SELLER
          </div>
          <h3 className="mt-2.5 text-[19px] font-extrabold tracking-tight">30-Day Padel Rebuild</h3>
          <p className="mt-1 text-[12px] text-v2-muted leading-snug">12 video lessons · weekly drills · downloadable PDF</p>
          <div className="flex justify-between items-center mt-3.5">
            <div className="flex gap-3 text-[11px] text-v2-muted">
              <span><strong className="text-offwhite tnum">12</strong> lessons</span>
              <span><strong className="text-offwhite tnum">3h 40m</strong></span>
            </div>
            <button
              onClick={() => navigate("/v2/plans/plan-padel-rebuild")}
              className="bg-offwhite text-navy-deep px-3.5 py-2 rounded-full font-bold text-[12px] flex items-center gap-1.5"
            >
              {formatPrice(480)} · Get it <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {newThis.length > 0 && (
        <>
          <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">NEW THIS WEEK</div>
          <div className="px-5 mb-4">
            <VideoThumb
              durationSec={newThis[0].durationSec}
              newBadge
              onClick={() => navigate(`/v2/video/${newThis[0].id}`)}
            />
            <div className="mt-2 flex justify-between items-start">
              <div>
                <div className="text-[14px] font-bold">{newThis[0].title}</div>
                <div className="text-[11px] text-v2-muted mt-0.5 tnum">2 days ago · {formatCompactNumber(newThis[0].viewCount)} views</div>
              </div>
              <Chip variant="teal" className="text-[10px]">{newThis[0].tier.toUpperCase()}</Chip>
            </div>
          </div>
        </>
      )}

      <div className="px-5 mb-4">
        <div className="grid grid-cols-2 gap-2.5">
          {grid.slice(0, 4).map((v) => (
            <div key={v.id} onClick={() => navigate(`/v2/video/${v.id}`)} className="cursor-pointer">
              <VideoThumb
                aspect="4/5"
                durationSec={v.durationSec}
                tierBadge={v.tier !== "free" ? (v.tier === "vip" ? "VIP" : "CIRCLE") : null}
              />
              <div className="mt-1.5 text-[12px] font-bold">{v.title}</div>
              <div className="text-[10px] text-v2-muted mt-0.5 tnum">
                {v.tier === "free" ? "Free" : v.tier === "vip" ? "VIP" : "Circle"} · {formatCompactNumber(v.viewCount)} views
              </div>
            </div>
          ))}
        </div>
      </div>

      {isLiveEnabled() && (
        <>
          <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">LIVE & UPCOMING</div>
          <div className="px-5 mb-4">
            <div onClick={() => navigate("/v2/live/live-1")} className="cursor-pointer">
              <VideoThumb isLive viewerCount={247} />
              <div className="mt-2 flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-[14px] font-bold">Serve drills · live session</div>
                  <div className="text-[11px] text-v2-muted mt-0.5">Started 8 min ago · {coach?.firstName ?? "Maya"}</div>
                </div>
                <button className="px-3 py-1.5 rounded-full bg-danger text-white font-bold text-[11px]">Join →</button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="px-5 pb-12">
        <div className="p-3.5 rounded-[14px] bg-navy-card flex gap-3 items-center">
          <div className="w-12 text-center shrink-0">
            <div className="text-[10px] text-orange font-bold tracking-wider">SUN</div>
            <div className="text-[22px] font-extrabold tracking-tight tnum">14</div>
          </div>
          <div className="w-px h-9 bg-navy-line" />
          <div className="flex-1">
            <div className="text-[13px] font-bold">Weekly Q&amp;A · Circle members</div>
            <div className="text-[11px] text-v2-muted mt-0.5 tnum">19:00 · 24 reminders set</div>
          </div>
          <button className="px-3 py-1.5 rounded-full bg-navy-card-2 text-offwhite font-semibold text-[11px] flex items-center gap-1">
            <Bell size={11} /> Remind
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
