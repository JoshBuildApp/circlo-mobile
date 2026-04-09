import { useState, useRef, useEffect } from "react";
import { Upload, X, Film, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/x-m4v", "video/webm"];
const MAX_SIZE_MB = 200;

interface VideoUploadModalProps {
  open: boolean;
  onClose: () => void;
  coachId: string;
  userId: string;
  onUploaded: () => void;
}

const VideoUploadModal = ({ open, onClose, coachId, userId, onUploaded }: VideoUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate preview URL when file changes
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const reset = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setProgress(0);
    setError(null);
  };

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return `Unsupported format. Please use MP4 or MOV.`;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large (${(f.size / 1024 / 1024).toFixed(0)}MB). Max ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFileSelect = (f: File | null) => {
    setError(null);
    if (!f) { setFile(null); return; }
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${userId}/${Date.now()}.${ext}`;

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) { clearInterval(progressInterval); return 85; }
          return prev + Math.random() * 15;
        });
      }, 300);

      const { error: uploadError } = await supabase.storage
        .from("coach-videos")
        .upload(path, file, { contentType: file.type });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;
      setProgress(90);

      const { data: urlData } = supabase.storage
        .from("coach-videos")
        .getPublicUrl(path);

      const media_url = urlData.publicUrl;

      const { error: insertError } = await supabase.from("coach_videos").insert({
        coach_id: coachId,
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        media_url,
      });

      if (insertError) throw insertError;

      setProgress(100);

      toast.success("Video uploaded!");
      window.dispatchEvent(new CustomEvent("content-uploaded"));

      // Brief delay to show 100%
      setTimeout(() => {
        reset();
        onUploaded();
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !uploading) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border/50 rounded-2xl p-0 overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-foreground">Upload Video</h2>
            {!uploading && (
              <button onClick={onClose} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* File picker */}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />

          {file && previewUrl ? (
            <div className="space-y-3">
              {/* Video Preview */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video
                  src={previewUrl}
                  className="w-full h-full object-contain"
                  controls
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>
              <div className="flex items-center gap-3 bg-secondary rounded-xl p-3">
                <Film className="h-5 w-5 text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                {!uploading && (
                  <button onClick={() => { setFile(null); setError(null); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors group active:scale-[0.98]"
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
              <p className="text-sm text-muted-foreground font-medium">Tap to select a video</p>
              <p className="text-xs text-muted-foreground/60 mt-1">MP4 or MOV · Max {MAX_SIZE_MB}MB</p>
            </button>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-destructive font-medium">{error}</p>
                <button onClick={() => { setError(null); inputRef.current?.click(); }} className="text-xs text-destructive/80 underline mt-1">Try another file</button>
              </div>
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {progress >= 100 ? (
                    <span className="flex items-center gap-1 text-primary font-medium"><CheckCircle2 className="h-3 w-3" />Complete!</span>
                  ) : progress >= 85 ? "Saving..." : "Uploading..."}
                </p>
                <span className="text-xs font-medium text-foreground">{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Input
              placeholder="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="bg-secondary border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground"
            />
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={uploading}
              className="bg-secondary border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!file || !title.trim() || uploading}
            className="w-full h-12 rounded-xl font-heading font-semibold text-base bg-primary text-primary-foreground hover:brightness-110 glow-primary disabled:opacity-40"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Uploading…
              </span>
            ) : (
              "Upload Video"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoUploadModal;
