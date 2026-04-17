import { useState, useRef, useCallback, useEffect } from "react";
import {
  X, ChevronLeft, Camera, ImageIcon, RotateCcw, Loader2,
  Film, Type, FileText, Dumbbell, MessageCircle, Plus, ArrowRight,
  MapPin, Users, Eye, Lock, Globe, Upload, Check, Search,
  Calendar, Clock
} from "lucide-react";
import ThumbnailSelector from "@/components/ThumbnailSelector";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─── */
type ContentTypeKey = "video" | "photo" | "text" | "story" | "article" | "program" | "community";
type WizardStep = "type" | "upload" | "details" | "preview" | "posting";

interface ContentTypeOption {
  key: ContentTypeKey;
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  bg: string;
  gradient: string;
  coachOnly: boolean;
  needsMedia: boolean;
}

const CONTENT_TYPES: ContentTypeOption[] = [
  { key: "video", icon: Film, title: "Video", desc: "Upload a video for Plays", color: "text-red-500", bg: "bg-red-500/10", gradient: "from-red-500 to-rose-600", coachOnly: false, needsMedia: true },
  { key: "photo", icon: Camera, title: "Photo", desc: "Share a photo to your profile", color: "text-blue-500", bg: "bg-blue-500/10", gradient: "from-blue-500 to-indigo-600", coachOnly: false, needsMedia: true },
  { key: "article", icon: FileText, title: "Article", desc: "Long-form coaching content", color: "text-amber-500", bg: "bg-amber-500/10", gradient: "from-amber-500 to-orange-600", coachOnly: true, needsMedia: false },
  { key: "program", icon: Dumbbell, title: "Workout", desc: "Steps and exercises", color: "text-purple-500", bg: "bg-purple-500/10", gradient: "from-purple-500 to-violet-600", coachOnly: true, needsMedia: false },
  { key: "text", icon: Type, title: "Post", desc: "Quick text update", color: "text-primary", bg: "bg-primary/10", gradient: "from-primary to-accent", coachOnly: false, needsMedia: false },
  { key: "story", icon: Plus, title: "Story", desc: "24h disappearing content", color: "text-pink-500", bg: "bg-pink-500/10", gradient: "from-pink-500 to-fuchsia-600", coachOnly: false, needsMedia: true },
  { key: "community", icon: MessageCircle, title: "Discussion", desc: "Start a community discussion", color: "text-cyan-500", bg: "bg-cyan-500/10", gradient: "from-cyan-500 to-sky-600", coachOnly: false, needsMedia: false },
];

const SPORT_OPTIONS = [
  "Padel", "Tennis", "Fitness", "Boxing", "Soccer",
  "Basketball", "Yoga", "Swimming", "Running", "MMA", "CrossFit", "Martial Arts",
];

const VISIBILITY_OPTIONS = [
  { key: "public", label: "Public", desc: "Visible to everyone", icon: Globe },
  { key: "followers", label: "Followers", desc: "Only your followers", icon: Users },
  { key: "private", label: "Private", desc: "Only you can see", icon: Lock },
] as const;

const MAX_SIZE_MB = 100;

const SPORT_HASHTAGS = [
  'circlo', 'coaching', 'fitness', 'padel', 'tennis', 'boxing', 'crossfit', 'yoga',
  'swimming', 'football', 'basketball', 'running', 'cycling', 'pilates', 'hiit',
  'strength', 'cardio', 'athlete', 'training', 'workout', 'sportlife', 'sportscoach',
  'bookacoach', 'findacoach', 'getfit', 'personaltrainer', 'sportsnutrition',
  'recovery', 'performance', 'motivation',
];
const MAX_HASHTAGS = 5;
const ACCEPTED_MEDIA = "video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp,image/gif";
const MAX_TITLE = 120;
const MAX_DESC = 500;

/* ─── Progress bar ─── */
const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-2 px-5">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-muted/30">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#FF6B2B] to-[#FF6B2B]/70"
          initial={{ width: "0%" }}
          animate={{ width: i < current ? "100%" : i === current ? "50%" : "0%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>
    ))}
  </div>
);

/* ─── Main Component ─── */
interface NewContentCreatorProps {
  open: boolean;
  onClose: () => void;
  initialType?: string;
}

const NewContentCreator = ({ open, onClose, initialType }: NewContentCreatorProps) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // State
  const [step, setStep] = useState<WizardStep>("type");
  const [selectedType, setSelectedType] = useState<ContentTypeKey | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [sportTag, setSportTag] = useState("");
  const [peopleTags, setPeopleTags] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
  const [posting, setPosting] = useState(false);
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);

  // Hashtag autocomplete state
  const [hashtagQuery, setHashtagQuery] = useState("");
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Schedule post state
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [scheduleError, setScheduleError] = useState<string>("");

  const isCoach = role === "coach" || role === "admin" || role === "developer";

  // Fetch coach profile ID
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

  // Auto-select type when opened with initialType
  useEffect(() => {
    if (open && initialType && CONTENT_TYPES.some(t => t.key === initialType)) {
      handleTypeSelect(initialType as ContentTypeKey);
    }
  }, [open, initialType]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const totalSteps = selectedType && CONTENT_TYPES.find(t => t.key === selectedType)?.needsMedia ? 4 : 3;
  const currentStepIndex = (() => {
    switch (step) {
      case "type": return 0;
      case "upload": return 1;
      case "details": return selectedType && CONTENT_TYPES.find(t => t.key === selectedType)?.needsMedia ? 2 : 1;
      case "preview": return totalSteps - 1;
      case "posting": return totalSteps;
      default: return 0;
    }
  })();

  const resetAll = useCallback(() => {
    setStep("type");
    setSelectedType(null);
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIsVideo(false);
    setTitle("");
    setDescription("");
    setLocation("");
    setSportTag("");
    setPeopleTags("");
    setVisibility("public");
    setPosting(false);
    setUploadProgress(0);
    setDragOver(false);
    setHashtagQuery("");
    setHashtagSuggestions([]);
    setScheduleMode("now");
    setScheduledAt("");
    setScheduleError("");
    setCustomThumbnail(null);
  }, [previewUrl]);

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const goBack = () => {
    const needsMedia = selectedType && CONTENT_TYPES.find(t => t.key === selectedType)?.needsMedia;
    switch (step) {
      case "upload":
        setStep("type");
        setSelectedType(null);
        break;
      case "details":
        if (needsMedia) {
          setStep("upload");
        } else {
          setStep("type");
          setSelectedType(null);
        }
        break;
      case "preview":
        setStep("details");
        break;
      default:
        handleClose();
    }
  };

  /* ─── Content Type Selection ─── */
  const handleTypeSelect = (type: ContentTypeKey) => {
    setSelectedType(type);

    if (type === "community") {
      handleClose();
      navigate("/community");
      return;
    }

    const typeConfig = CONTENT_TYPES.find(t => t.key === type);
    if (typeConfig?.needsMedia) {
      setStep("upload");
    } else {
      setStep("details");
    }
  };

  /* ─── File Handling ─── */
  const processFile = (f: File) => {
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB`);
      return;
    }

    const video = f.type.startsWith("video/");
    if (selectedType === "photo" && video) setSelectedType("video");
    else if (selectedType === "video" && !video) setSelectedType("photo");

    setFile(f);
    setIsVideo(video);
    setPreviewUrl(URL.createObjectURL(f));
    setStep("details");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) processFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  /* ─── Hashtag Autocomplete ─── */
  const countHashtags = (text: string) => (text.match(/#\w+/g) || []).length;

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_DESC);
    setDescription(val);

    // Detect if user just typed # followed by letters
    const cursor = e.target.selectionStart ?? val.length;
    const textUpToCursor = val.slice(0, cursor);
    const hashMatch = textUpToCursor.match(/#(\w*)$/);

    if (hashMatch) {
      const query = hashMatch[1].toLowerCase();
      setHashtagQuery(query);
      const filtered = SPORT_HASHTAGS.filter(tag =>
        tag.startsWith(query) && !val.includes(`#${tag}`)
      );
      setHashtagSuggestions(filtered.slice(0, 8));
    } else {
      setHashtagQuery("");
      setHashtagSuggestions([]);
    }
  };

  const insertHashtag = (tag: string) => {
    const current = description;
    if (countHashtags(current) >= MAX_HASHTAGS) return;

    const textarea = descriptionRef.current;
    const cursor = textarea?.selectionStart ?? current.length;
    const textUpToCursor = current.slice(0, cursor);
    const hashIndex = textUpToCursor.lastIndexOf("#");

    const before = current.slice(0, hashIndex);
    const after = current.slice(cursor);
    const newVal = `${before}#${tag} ${after}`.slice(0, MAX_DESC);

    setDescription(newVal);
    setHashtagSuggestions([]);
    setHashtagQuery("");

    // Re-focus after insert
    setTimeout(() => {
      if (textarea) {
        const newCursor = (before + `#${tag} `).length;
        textarea.focus();
        textarea.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  };

  /* ─── Schedule validation ─── */
  const validateSchedule = (): boolean => {
    if (scheduleMode === "now") return true;
    if (!scheduledAt) {
      setScheduleError("Please pick a date and time");
      return false;
    }
    const picked = new Date(scheduledAt);
    if (picked <= new Date()) {
      setScheduleError("Please pick a future time");
      return false;
    }
    setScheduleError("");
    return true;
  };

  /* ─── Upload & Post ─── */
  const handlePublish = async () => {
    if (!user) return;

    if (!validateSchedule()) return;

    if (!coachProfileId && selectedType !== "story" && selectedType !== "text") {
      toast.error("Create a coach profile first to upload content");
      handleClose();
      navigate("/profile");
      return;
    }

    setPosting(true);
    setStep("posting");

    const scheduledAtDate = scheduleMode === "schedule" && scheduledAt
      ? new Date(scheduledAt).toISOString()
      : null;

    try {
      // Text-only post
      if (!file && (selectedType === "text" || selectedType === "article" || selectedType === "program")) {
        if (!description.trim() && !title.trim()) {
          toast.error("Please add some content");
          setStep("details");
          setPosting(false);
          return;
        }

        const { error } = await supabase.from("coach_posts").insert({
          coach_id: coachProfileId || "",
          user_id: user.id,
          text: title.trim() ? `${title.trim()}\n\n${description.trim()}` : description.trim(),
          ...(scheduledAtDate ? { scheduled_at: scheduledAtDate } : {}),
        });
        if (error) throw error;

        toast.success("Posted successfully!");
        window.dispatchEvent(new CustomEvent("content-uploaded"));
        handleClose();
        return;
      }

      // Media upload
      if (!file) return;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 8, 85));
      }, 200);

      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("coach-videos")
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      clearInterval(progressInterval);
      setUploadProgress(90);

      const { data: urlData } = supabase.storage
        .from("coach-videos")
        .getPublicUrl(path);

      // Story upload
      if (selectedType === "story") {
        const storyData: { user_id: string; media_url: string; coach_id?: string } = { user_id: user.id, media_url: urlData.publicUrl };
        if (coachProfileId) storyData.coach_id = coachProfileId;
        const { error: insertError } = await supabase.from("stories").insert([storyData]);
        if (insertError) throw insertError;
        setUploadProgress(100);
        toast.success("Story published! It will disappear in 24h.");
        window.dispatchEvent(new CustomEvent("content-uploaded"));
        handleClose();
        return;
      }

      const postTitle = title.trim() || (isVideo ? "New video" : "New photo");

      // Upload custom thumbnail if selected
      let thumbnailUrl: string | null = null;
      if (isVideo && customThumbnail) {
        try {
          // Convert dataUrl to blob
          const res = await fetch(customThumbnail);
          const blob = await res.blob();
          const thumbPath = `${user.id}/${Date.now()}.jpg`;
          const { error: thumbErr } = await supabase.storage
            .from("thumbnails")
            .upload(thumbPath, blob, { contentType: "image/jpeg" });
          if (!thumbErr) {
            const { data: thumbUrlData } = supabase.storage
              .from("thumbnails")
              .getPublicUrl(thumbPath);
            thumbnailUrl = thumbUrlData.publicUrl;
          }
        } catch {
          // Thumbnail upload failed silently — proceed without it
        }
      }

      const { error: insertError } = await supabase.from("coach_videos").insert({
        coach_id: coachProfileId,
        user_id: user.id,
        title: postTitle,
        description: description.trim(),
        media_url: urlData.publicUrl,
        media_type: isVideo ? "video" : "image",
        category: isVideo ? "training" : "highlights",
        ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
        ...(scheduledAtDate ? { scheduled_at: scheduledAtDate } : {}),
      });

      if (insertError) throw insertError;

      setUploadProgress(100);
      toast.success("Published successfully!");
      window.dispatchEvent(new CustomEvent("content-uploaded"));
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed. Try again.";
      console.error("Upload error:", err);
      toast.error(message);
      setStep("preview");
      setPosting(false);
      setUploadProgress(0);
    }
  };

  if (!open) return null;

  const availableTypes = CONTENT_TYPES.filter(ct => !ct.coachOnly || isCoach);
  const selectedConfig = CONTENT_TYPES.find(t => t.key === selectedType);

  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col animate-in fade-in duration-200">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={selectedType === "video" ? "video/mp4,video/quicktime,video/webm" : selectedType === "photo" ? "image/jpeg,image/png,image/webp,image/gif" : ACCEPTED_MEDIA}
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPTED_MEDIA}
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ═══════════ STEP 1: CHOOSE TYPE ═══════════ */}
      <AnimatePresence mode="wait">
        {step === "type" && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
              <button onClick={handleClose} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold text-foreground">Create</h2>
              <div className="w-10" />
            </div>

            <div className="px-5 pt-4 pb-2">
              <StepIndicator current={0} total={totalSteps} />
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8">
              <p className="text-lg font-bold text-foreground mb-1">What are you creating?</p>
              <p className="text-sm text-muted-foreground mb-5">Choose your content type to get started</p>

              <div className="grid grid-cols-2 gap-3">
                {availableTypes.map((ct, i) => (
                  <motion.button
                    key={ct.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleTypeSelect(ct.key)}
                    className="flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-border/30 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-200 active:scale-[0.97] group"
                  >
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 bg-gradient-to-br", ct.gradient)}>
                      <ct.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-foreground text-[14px]">{ct.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{ct.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {!isCoach && (
                <div className="mt-5 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground text-center">
                    <span className="font-semibold text-primary">Become a Coach</span> to unlock Articles, Workouts, and more.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════ STEP 2: UPLOAD ═══════════ */}
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
              <button onClick={goBack} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold text-foreground">Upload {selectedConfig?.title}</h2>
              <button onClick={handleClose} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-2">
              <StepIndicator current={1} total={totalSteps} />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
              {/* Drag & drop zone */}
              <div
                ref={dropZoneRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "w-full max-w-sm aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-200 cursor-pointer",
                  dragOver
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border/40 bg-secondary/20 hover:border-primary/30"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center bg-gradient-to-br", selectedConfig?.gradient || "from-gray-400 to-gray-500")}>
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-foreground">
                    {dragOver ? "Drop it here!" : "Tap to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-2">
                    {selectedType === "video" ? "MP4, MOV, WebM" : selectedType === "photo" ? "JPG, PNG, WebP, GIF" : "Any media"} &bull; Max {MAX_SIZE_MB}MB
                  </p>
                </div>
              </div>

              {/* Camera button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-card border border-border/30 text-sm font-medium text-foreground hover:border-primary/20 active:scale-95 transition-all"
              >
                <Camera className="h-4 w-4 text-primary" />
                Use Camera
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════ STEP 3: DETAILS ═══════════ */}
        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 flex-shrink-0">
              <button onClick={goBack} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold text-foreground">Details</h2>
              <button onClick={handleClose} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-2 flex-shrink-0">
              <StepIndicator current={currentStepIndex} total={totalSteps} />
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 md:px-8 pt-5 pb-10 space-y-7 min-h-0">
              {/* Media thumbnail preview */}
              {previewUrl && (
                <div className="flex gap-4 items-start">
                  <div className="h-24 w-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0 ring-2 ring-border/20">
                    {isVideo ? (
                      <video src={previewUrl} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <button
                    onClick={() => { setFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setCustomThumbnail(null); setStep("upload"); }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Change file
                  </button>
                </div>
              )}

              {/* Thumbnail selector (video only) */}
              {isVideo && file && (
                <ThumbnailSelector
                  videoFile={file}
                  onSelect={(dataUrl) => setCustomThumbnail(dataUrl)}
                />
              )}

              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                  placeholder="Give your content a title..."
                  className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground text-right mt-1">{title.length}/{MAX_TITLE}</p>
              </div>

              {/* Description with hashtag autocomplete */}
              <div className="relative">
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Description</label>
                <div className="relative">
                  <textarea
                    ref={descriptionRef}
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Add a description... use # for hashtags"
                    rows={4}
                    className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors resize-none"
                  />

                  {/* Hashtag suggestions dropdown */}
                  <AnimatePresence>
                    {hashtagSuggestions.length > 0 && (
                      <motion.div
                        key="hashtag-dropdown"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-[#1C1C1E] border border-border/40 rounded-xl overflow-hidden shadow-xl"
                      >
                        <div className="px-3 py-1.5 border-b border-border/20 flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Hashtags</span>
                          <span className="text-[10px] text-muted-foreground">{countHashtags(description)}/{MAX_HASHTAGS} used</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 p-2">
                          {hashtagSuggestions.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); insertHashtag(tag); }}
                              disabled={countHashtags(description) >= MAX_HASHTAGS}
                              className="px-2.5 py-1 rounded-lg bg-secondary/60 text-xs font-semibold text-[#FF6B2B] hover:bg-[#FF6B2B]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-[11px] text-muted-foreground text-right mt-1">{description.length}/{MAX_DESC}</p>
              </div>

              {/* Schedule post toggle */}
              <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
                <div className="flex items-center p-3 gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-[18px] w-[18px] text-primary" style={{ height: "1.125rem", width: "1.125rem" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Publish time</p>
                    <p className="text-[11px] text-muted-foreground">Post now or schedule for later</p>
                  </div>
                  {/* Toggle */}
                  <div className="flex items-center rounded-xl bg-secondary/40 border border-border/20 p-0.5 gap-0.5">
                    <button
                      type="button"
                      onClick={() => { setScheduleMode("now"); setScheduleError(""); }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        scheduleMode === "now"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode("schedule")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        scheduleMode === "schedule"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Schedule
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {scheduleMode === "schedule" && (
                    <motion.div
                      key="schedule-picker"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 border-t border-border/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <input
                            type="datetime-local"
                            value={scheduledAt}
                            min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                            onChange={(e) => {
                              setScheduledAt(e.target.value);
                              setScheduleError("");
                            }}
                            className="flex-1 bg-secondary/30 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 transition-colors"
                          />
                        </div>
                        {scheduleError && (
                          <p className="text-xs text-red-400 flex items-center gap-1 pl-5">
                            {scheduleError}
                          </p>
                        )}
                        {scheduledAt && !scheduleError && new Date(scheduledAt) > new Date() && (
                          <p className="text-[11px] text-muted-foreground pl-5">
                            Will publish on {new Date(scheduledAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location <span className="text-muted-foreground font-normal">(optional)</span></span>
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add a location..."
                  className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              {/* Tag people */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Tag people <span className="text-muted-foreground font-normal">(optional)</span>
                  </span>
                </label>
                <input
                  value={peopleTags}
                  onChange={(e) => setPeopleTags(e.target.value)}
                  placeholder="@alex, @dana, @coach_jo"
                  className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Comma-separated handles. Tagged users appear on the post.</p>
              </div>

              {/* Sport tag */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Sport Tag</label>
                <div className="flex flex-wrap gap-2">
                  {SPORT_OPTIONS.map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setSportTag(sportTag === sport ? "" : sport)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95",
                        sportTag === sport
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-muted-foreground border border-border/30 hover:border-primary/30"
                      )}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Visibility</label>
                <div className="grid grid-cols-3 gap-2">
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setVisibility(opt.key)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95",
                        visibility === opt.key
                          ? "border-primary bg-primary/5"
                          : "border-border/30 bg-card hover:border-primary/20"
                      )}
                    >
                      <opt.icon className={cn("h-4 w-4", visibility === opt.key ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-[11px] font-semibold", visibility === opt.key ? "text-primary" : "text-muted-foreground")}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer: direct Post + optional Preview */}
            <div className="px-5 py-4 border-t border-border/10 flex-shrink-0 flex items-center gap-2">
              {selectedType !== "story" && (
                <button
                  onClick={() => {
                    if (!validateSchedule()) return;
                    setStep("preview");
                  }}
                  className="h-[52px] px-5 rounded-2xl bg-secondary text-foreground font-bold text-sm active:scale-[0.98] transition-transform hover:bg-secondary/80"
                >
                  Preview
                </button>
              )}
              <button
                onClick={() => {
                  if (!validateSchedule()) return;
                  handlePublish();
                }}
                disabled={posting}
                className="flex-1 h-[52px] rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {posting ? "Posting…" : scheduleMode === "schedule" ? "Schedule post" : selectedType === "story" ? "Share story" : "Post now"}
                {!posting && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════ STEP 4: PREVIEW & PUBLISH ═══════════ */}
        {step === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
              <button onClick={goBack} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold text-foreground">Preview</h2>
              <button onClick={handleClose} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-2">
              <StepIndicator current={currentStepIndex} total={totalSteps} />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8">
              {/* Preview card */}
              <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6B2B] to-[#FF6B2B]/60 flex items-center justify-center text-white text-sm font-bold">
                    {user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-foreground">You</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Just now</span>
                      {sportTag && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-wider bg-[#FF6B2B]">
                          {sportTag}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title & desc */}
                {(title || description) && (
                  <div className="px-3 pb-2">
                    {title && <h3 className="text-[15px] font-bold text-foreground mb-1">{title}</h3>}
                    {description && (
                      <p className="text-[13px] text-foreground/80 leading-relaxed line-clamp-4">{description}</p>
                    )}
                  </div>
                )}

                {/* Media */}
                {previewUrl && (
                  <div className="mx-3 mb-3 rounded-xl overflow-hidden bg-muted">
                    {isVideo ? (
                      <video src={previewUrl} className="w-full max-h-72 object-contain bg-black" controls muted playsInline />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="w-full max-h-72 object-contain" />
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="px-3 pb-3 flex flex-wrap items-center gap-2">
                  {location && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                      <MapPin className="h-3 w-3" /> {location}
                    </span>
                  )}
                  {visibility !== "public" && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                      {visibility === "followers" ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {visibility === "followers" ? "Followers only" : "Private"}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                This is how your content will appear in the feed
              </p>
            </div>

            {/* Publish button */}
            <div className="px-5 py-4 border-t border-border/10">
              <button
                onClick={handlePublish}
                disabled={posting}
                className="w-full bg-gradient-to-r from-[#FF6B2B] to-[#FF6B2B]/80 text-white font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-[#FF6B2B]/20"
              >
                <Check className="h-4 w-4 inline mr-2" />
                Publish
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════ POSTING / UPLOADING ═══════════ */}
        {step === "posting" && (
          <motion.div
            key="posting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-8"
          >
            <div className="relative h-20 w-20">
              <Loader2 className="h-20 w-20 text-primary/20 absolute" />
              <Loader2 className="h-20 w-20 text-primary animate-spin absolute" style={{ clipPath: `inset(0 ${100 - uploadProgress}% 0 0)` }} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground mb-1">
                {uploadProgress < 85 ? "Uploading..." : uploadProgress < 100 ? "Almost there..." : "Done!"}
              </p>
              <p className="text-sm text-muted-foreground">
                {uploadProgress < 100 ? "This will only take a moment" : "Your content is live"}
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-xs h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B2B] to-[#FF6B2B]/70"
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-sm text-muted-foreground font-medium">{uploadProgress}%</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewContentCreator;
