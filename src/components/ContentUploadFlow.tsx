import { useState, useRef, useCallback, useEffect } from "react";
import { X, ChevronLeft, Camera, ImageIcon, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Step = "capture" | "preview" | "details" | "posting";

interface ContentUploadFlowProps {
  open: boolean;
  onClose: () => void;
}

const MAX_SIZE_MB = 100;
const ACCEPTED_VIDEO = "video/mp4,video/quicktime,video/webm,video/x-msvideo";
const ACCEPTED_IMAGE = "image/jpeg,image/png,image/webp,image/gif";

const ContentUploadFlow = ({ open, onClose }: ContentUploadFlowProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("capture");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [coachTag, setCoachTag] = useState("");
  const [posting, setPosting] = useState(false);
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null);

  // Fetch coach profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("coach_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCoachProfileId(data.id);
      });
  }, [user]);

  // Auto-open gallery on mount
  useEffect(() => {
    if (open && step === "capture") {
      // Small delay to ensure DOM is ready
      const t = setTimeout(() => fileInputRef.current?.click(), 150);
      return () => clearTimeout(t);
    }
  }, [open, step]);

  const reset = useCallback(() => {
    setStep("capture");
    setFile(null);
    setPreviewUrl(null);
    setIsVideo(false);
    setCaption("");
    setCoachTag("");
    setPosting(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB`);
      return;
    }

    const video = f.type.startsWith("video/");
    setFile(f);
    setIsVideo(video);
    setPreviewUrl(URL.createObjectURL(f));
    setStep("preview");
  };

  const handlePost = async () => {
    if (!file || !user) return;

    // Need a coach profile to upload
    if (!coachProfileId) {
      toast.error("Create a coach profile first to upload content");
      handleClose();
      navigate("/profile");
      return;
    }

    setPosting(true);
    setStep("posting");

    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("coach-videos")
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("coach-videos")
        .getPublicUrl(path);

      const title = caption.trim() || (isVideo ? "New video" : "New photo");
      const mediaType = isVideo ? "video" : "image";

      await supabase.from("coach_videos").insert({
        coach_id: coachProfileId,
        user_id: user.id,
        title,
        description: coachTag ? `@${coachTag}` : "",
        media_url: urlData.publicUrl,
        media_type: mediaType,
        category: isVideo ? "training" : "photos",
      });

      toast.success("Posted!");
      window.dispatchEvent(new CustomEvent("content-uploaded"));
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
      setStep("details");
      setPosting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={`${ACCEPTED_VIDEO},${ACCEPTED_IMAGE}`}
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={`${ACCEPTED_VIDEO},${ACCEPTED_IMAGE}`}
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ─── CAPTURE STEP ─── */}
      {step === "capture" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">Create</h2>
            <p className="text-sm text-muted-foreground">Choose how to add content</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-card border border-border/20 active:scale-95 transition-transform"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Camera className="h-7 w-7 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground">Camera</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-card border border-border/20 active:scale-95 transition-transform"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-7 w-7 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground">Gallery</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── PREVIEW STEP ─── */}
      {step === "preview" && previewUrl && (
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 safe-area-top">
            <button
              onClick={() => { setStep("capture"); setFile(null); setPreviewUrl(null); }}
              className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-foreground">Preview</span>
            <button
              onClick={handleClose}
              className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Media preview */}
          <div className="flex-1 flex items-center justify-center bg-secondary/30 mx-4 rounded-3xl overflow-hidden">
            {isVideo ? (
              <video
                src={previewUrl}
                className="max-h-full max-w-full object-contain"
                controls
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
            )}
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-between px-6 py-5 safe-area-bottom">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-muted-foreground font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              Re-select
            </button>
            <button
              onClick={() => setStep("details")}
              className="bg-primary text-primary-foreground font-bold text-sm px-8 py-3 rounded-full active:scale-95 transition-transform"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ─── DETAILS STEP ─── */}
      {step === "details" && (
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 safe-area-top">
            <button
              onClick={() => setStep("preview")}
              className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-foreground">Details</span>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
            {/* Thumbnail */}
            <div className="flex gap-4 items-start">
              <div className="h-20 w-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                {isVideo && previewUrl ? (
                  <video src={previewUrl} className="h-full w-full object-cover" muted playsInline />
                ) : previewUrl ? (
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  rows={3}
                  maxLength={300}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
                />
                <p className="text-[11px] text-muted-foreground text-right">{caption.length}/300</p>
              </div>
            </div>

            {/* Tag coach */}
            <div className="rounded-2xl border border-border/20 bg-card p-4 space-y-2">
              <label className="text-xs font-bold text-foreground">Tag a coach (optional)</label>
              <input
                value={coachTag}
                onChange={(e) => setCoachTag(e.target.value)}
                placeholder="Coach name..."
                className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>

            {/* Info */}
            <div className="rounded-2xl bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground">
                {isVideo
                  ? "📹 Your video will appear in Plays and your profile"
                  : "📸 Your photo will appear on your profile and Discover"}
              </p>
            </div>
          </div>

          {/* Post button */}
          <div className="px-5 py-5 safe-area-bottom">
            <button
              onClick={handlePost}
              disabled={posting}
              className="w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-full active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* ─── POSTING STEP ─── */}
      {step === "posting" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm font-bold text-foreground">Posting...</p>
        </div>
      )}
    </div>
  );
};

export default ContentUploadFlow;
