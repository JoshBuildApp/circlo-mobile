import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

const fmtTime = (s: number) => {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

const VideoPlayer = ({ src, poster, autoPlay = false, className }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seeking, setSeeking] = useState(false);

  /* ── Auto-hide controls ── */
  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    if (!playing) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setShowControls(true);
    } else {
      resetHideTimer();
    }
  }, [playing, resetHideTimer]);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  /* ── Fullscreen change ── */
  useEffect(() => {
    const onFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  /* ── Play/Pause sync ── */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) {
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [playing]);

  /* ── Mute sync ── */
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  /* ── Speed sync ── */
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  /* ── Handlers ── */
  const handleVideoClick = () => {
    setPlaying((p) => !p);
    resetHideTimer();
  };

  const handleMouseMove = () => resetHideTimer();

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || seeking) return;
    setCurrentTime(el.currentTime);
  };

  const handleLoaded = () => {
    const el = videoRef.current;
    if (el) setDuration(el.duration);
  };

  const handleEnded = () => setPlaying(false);

  /* ── Scrub ── */
  const scrubTo = useCallback((clientX: number) => {
    const bar = progressRef.current;
    const el = videoRef.current;
    if (!bar || !el) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    el.currentTime = ratio * (el.duration || 0);
    setCurrentTime(el.currentTime);
  }, []);

  const handleProgressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrubTo(e.clientX);
  };

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSeeking(true);
    scrubTo(e.clientX);
    const onMove = (ev: MouseEvent) => scrubTo(ev.clientX);
    const onUp = () => {
      setSeeking(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const handleProgressTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setSeeking(true);
    scrubTo(e.touches[0].clientX);
    const onMove = (ev: TouchEvent) => scrubTo(ev.touches[0].clientX);
    const onEnd = () => {
      setSeeking(false);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black overflow-hidden group select-none", className)}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        muted={muted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoaded}
        onEnded={handleEnded}
        onClick={handleVideoClick}
      />

      {/* Play/Pause tap overlay */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleVideoClick}
        style={{ background: "transparent" }}
      />

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        <div className="relative px-3 pb-3 pt-8 space-y-2">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative h-1 rounded-full bg-white/20 cursor-pointer"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
          >
            {/* Filled track */}
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #FF6B2B, #FF8C5B)",
              }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-[#FF6B2B] shadow-md border-2 border-white"
              style={{ left: `${progress}%` }}
            />
          </div>

          {/* Bottom row */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); resetHideTimer(); }}
              className="h-8 w-8 flex items-center justify-center rounded-full text-white active:scale-90 transition-transform"
            >
              {playing ? (
                <Pause className="h-5 w-5 fill-[#FF6B2B] text-[#FF6B2B]" />
              ) : (
                <Play className="h-5 w-5 fill-[#FF6B2B] text-[#FF6B2B] ml-0.5" />
              )}
            </button>

            {/* Volume */}
            <button
              onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
              className="h-8 w-8 flex items-center justify-center rounded-full text-white/80 hover:text-white active:scale-90 transition-all"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Time display */}
            <span className="text-white/70 text-[11px] font-mono tabular-nums flex-1">
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>

            {/* Speed selector */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSpeedMenu((s) => !s); }}
                className="h-7 px-2 rounded-lg bg-white/10 text-white/80 text-[11px] font-bold hover:bg-white/20 active:scale-90 transition-all"
              >
                {speed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-[#1C1C1E] border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[72px]">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSpeed(s);
                        setShowSpeedMenu(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-xs font-semibold text-left transition-colors",
                        s === speed
                          ? "text-[#FF6B2B] bg-[#FF6B2B]/10"
                          : "text-white/70 hover:bg-white/10"
                      )}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="h-8 w-8 flex items-center justify-center rounded-full text-white/80 hover:text-white active:scale-90 transition-all"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Center play/pause indicator (flash on tap) */}
    </div>
  );
};

export default VideoPlayer;
