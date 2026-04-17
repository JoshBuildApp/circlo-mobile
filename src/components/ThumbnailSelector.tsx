import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThumbnailSelectorProps {
  videoFile: File;
  onSelect: (dataUrl: string) => void;
}

interface Thumb {
  dataUrl: string;
  label: string;
  pct: number;
}

const captureFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement, time: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas context")); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
};

const ThumbnailSelector = ({ videoFile, onSelect }: ThumbnailSelectorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    video.muted = true;
    video.preload = "metadata";

    const onLoaded = async () => {
      const dur = video.duration;
      if (!dur || !isFinite(dur)) {
        setLoading(false);
        return;
      }

      const points = [
        { pct: 0.1, label: "Start" },
        { pct: 0.5, label: "Middle" },
        { pct: 0.9, label: "End" },
      ];

      const results: Thumb[] = [];
      for (const pt of points) {
        try {
          const dataUrl = await captureFrame(video, canvas, dur * pt.pct);
          results.push({ dataUrl, label: pt.label, pct: pt.pct });
        } catch {
          // skip failed frames
        }
      }

      setThumbs(results);
      if (results.length > 0) {
        onSelect(results[0].dataUrl);
      }
      setLoading(false);
      URL.revokeObjectURL(objectUrl);
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.load();

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      URL.revokeObjectURL(objectUrl);
    };
  }, [videoFile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    onSelect(thumbs[idx].dataUrl);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground block">Thumbnail</label>

      {/* Hidden elements for frame capture */}
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Extracting frames...</span>
        </div>
      ) : thumbs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Could not extract thumbnails from this video.</p>
      ) : (
        <div className="flex gap-2">
          {thumbs.map((thumb, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              className={cn(
                "relative flex-1 aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200 active:scale-95",
                selectedIdx === idx
                  ? "border-[#FF6B2B] shadow-[0_0_0_1px_#FF6B2B]"
                  : "border-border/30 hover:border-[#FF6B2B]/50"
              )}
            >
              <img
                src={thumb.dataUrl}
                alt={thumb.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                <span className="text-[9px] text-white/80 font-medium">{thumb.label}</span>
              </div>
              {selectedIdx === idx && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="h-6 w-6 rounded-full bg-[#FF6B2B] flex items-center justify-center shadow-lg">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThumbnailSelector;
