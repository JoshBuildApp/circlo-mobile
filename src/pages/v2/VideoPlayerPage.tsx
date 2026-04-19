import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MoreHorizontal, Pause, SkipBack, SkipForward, Volume2, Maximize2, Captions, Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { PhoneFrame, StatusBar, VideoThumb, Chip } from "@/components/v2/shared";
import { useVideo } from "@/hooks/v2/useMocks";
import { formatCompactNumber } from "@/lib/v2/currency";
import { cn } from "@/lib/utils";

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayerPage() {
  const navigate = useNavigate();
  const { videoId } = useParams<{ videoId: string }>();
  const { data: video } = useVideo(videoId);

  const progressSec = Math.round((video?.durationSec ?? 0) * 0.42);
  const activeChapter = video?.chapters?.find((c, i, arr) => {
    const next = arr[i + 1];
    return progressSec >= c.startSec && (!next || progressSec < next.startSec);
  });

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <div
        className="w-full aspect-video bg-black relative overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 30%, rgba(0,212,170,0.25), transparent 50%),
                         radial-gradient(circle at 70% 60%, rgba(255,107,44,0.18), transparent 55%),
                         linear-gradient(180deg, #0a1a22 0%, #000 100%)`,
          }}
        />
        <div className="absolute top-0 left-0 right-0 px-4 py-3.5 flex justify-between items-center z-10" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6), transparent)" }}>
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-white text-[13px] font-semibold opacity-85">{video?.title?.split("·")[0]?.trim()}</div>
          <button aria-label="More" className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center">
            <MoreHorizontal size={16} />
          </button>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-7 items-center z-10">
          <button className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center"><SkipBack size={20} fill="currentColor" /></button>
          <button className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md text-white flex items-center justify-center"><Pause size={26} fill="currentColor" /></button>
          <button className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center"><SkipForward size={20} fill="currentColor" /></button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 z-10" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.7), transparent)" }}>
          <div className="flex items-center gap-2 text-white/90 text-[11px] tnum mb-2.5">
            <span>{fmtSec(progressSec)}</span>
            <div className="flex-1 h-[3px] bg-white/25 rounded-sm relative">
              <div className="absolute top-0 left-0 h-full bg-teal rounded-sm" style={{ width: "42%" }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-teal" style={{ left: "42%", transform: "translate(-50%, -50%)" }} />
            </div>
            <span>{fmtSec(video?.durationSec ?? 0)}</span>
          </div>
          <div className="flex justify-between items-center text-white text-[12px]">
            <div className="flex gap-3 items-center">
              <button><Volume2 size={18} /></button>
              <span className="font-semibold">1×</span>
              <span className="font-semibold">HD</span>
            </div>
            <div className="flex gap-3 items-center">
              <button><Captions size={18} /></button>
              <button><Maximize2 size={18} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-2.5">
        <h2 className="text-[18px] font-extrabold tracking-tight">{video?.title ?? "Video"}</h2>
        <div className="flex gap-2 items-center mt-1.5 text-[12px] text-v2-muted">
          <span className="tnum">{video ? formatCompactNumber(video.viewCount) : 0} views</span>
          <span>·</span>
          <span>4 days ago</span>
          <span>·</span>
          <Chip variant="teal" className="text-[10px]">{video?.tier?.toUpperCase()}</Chip>
        </div>
      </div>

      <div className="px-5 pb-3.5">
        <div className="flex gap-3.5 py-2.5 border-b border-navy-line items-center">
          <button className="flex flex-col items-center gap-1">
            <Heart size={20} />
            <span className="text-[10px] font-semibold tnum">142</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <MessageCircle size={20} />
            <span className="text-[10px] font-semibold tnum">28</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Bookmark size={20} />
            <span className="text-[10px] font-semibold">Save</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Share2 size={20} />
            <span className="text-[10px] font-semibold">Share</span>
          </button>
          <div className="flex-1" />
          <button className="px-4 py-2 rounded-full bg-teal-dim text-teal font-bold text-[12px]">+ Follow</button>
        </div>
      </div>

      <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">CHAPTERS · {video?.chapters?.length ?? 0} sections</div>
      <div className="px-5 pb-4 flex flex-col gap-1.5">
        {video?.chapters?.map((c) => {
          const active = c.num === activeChapter?.num;
          return (
            <div
              key={c.num}
              className={cn(
                "flex gap-3 px-3 py-2.5 rounded-md items-center cursor-pointer",
                active && "bg-navy-card-2 border-l-[3px] border-l-teal pl-2.5",
                !active && "bg-navy-card"
              )}
            >
              <div className="text-[11px] text-v2-muted font-bold w-5 tnum">{c.num}</div>
              <div className={cn("flex-1 text-[13px] font-semibold", active && "text-teal")}>{c.title}</div>
              <div className="text-[11px] text-v2-muted tnum">{fmtSec(c.startSec)}</div>
            </div>
          );
        })}
      </div>

      <div className="px-5 pb-12">
        <div className="text-[10px] text-v2-muted font-bold tracking-widest uppercase mb-2.5">UP NEXT</div>
        <div className="flex flex-col gap-2.5">
          {[
            { id: "v2", title: "3-pattern footwork drill", views: 1120, ago: "2 days ago", dur: 728 },
            { id: "v6", title: "Positioning deep-dive", views: 890, ago: "1 week ago", dur: 1324 },
          ].map((next) => (
            <div key={next.id} onClick={() => navigate(`/v2/video/${next.id}`)} className="flex gap-3 cursor-pointer">
              <div className="w-[120px] shrink-0">
                <VideoThumb durationSec={next.dur} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-bold leading-snug">{next.title}</div>
                <div className="text-[11px] text-v2-muted mt-1 tnum">{formatCompactNumber(next.views)} views · {next.ago}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
