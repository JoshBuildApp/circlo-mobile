import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import TraineeProgressCard from "@/components/TraineeProgressCard";
import {
  Camera,
  ChevronRight,
  Edit3,
  LogOut,
  Play,
  Save,
  Plus,
  Sparkles,
  Trophy,
  User,
  Video,
  X,
  Share2,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ShareSheet from "@/components/ShareSheet";

const PlayerProfile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Load bio on mount
  const [bioLoaded, setBioLoaded] = useState(false);
  if (!bioLoaded && user) {
    supabase
      .from("profiles")
      .select("bio")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setBio((data as any)?.bio ?? "");
        setBioLoaded(true);
      });
  }

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim() || profile?.username, bio } as any)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated");
      await refreshProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    // Path must start with the user's UUID folder — coach-videos bucket has
    // RLS requiring `(storage.foldername(name))[1] = auth.uid()::text`.
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("coach-videos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed");
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("coach-videos")
      .getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("user_id", user.id);

    if (updateError) {
      toast.error("Failed to update avatar");
    } else {
      toast.success("Avatar updated");
      await refreshProfile();
    }
    setAvatarUploading(false);
  };

  if (!user || !profile) return null;

  const initial = profile.username?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="h-full overflow-y-auto bg-background pb-24">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* Header */}
      <div className="px-5 pt-8 pb-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar */}
            <button
              onClick={() => fileRef.current?.click()}
              className="relative h-16 w-16 rounded-[22px] overflow-hidden bg-secondary border border-border/10 flex-shrink-0 group"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary font-heading text-2xl font-bold bg-primary/10">
                  {initial}
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>

            {/* Name + bio */}
            <div className="min-w-0 flex-1">
              {editing ? (
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="font-heading text-xl font-bold text-foreground bg-transparent border-b border-primary outline-none w-full"
                  placeholder="Your name"
                />
              ) : (
                <h1 className="font-heading text-xl font-bold text-foreground truncate">
                  {profile.username}
                </h1>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">Player</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setUsername(profile.username);
                  }}
                  className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                >
                  {saving ? (
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={signOut}
                  className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="rounded-[20px] border border-border/10 bg-card p-4">
          {editing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself..."
              rows={3}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
            />
          ) : bio ? (
            <p className="text-sm text-foreground/80">{bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Tap edit to add a bio
            </p>
          )}
        </div>

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content sections */}
      <div className="px-5 space-y-4">
        {/* Upload Content CTA */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-upload-flow"));
          }}
          className="w-full rounded-[28px] border-2 border-dashed border-border/30 bg-card p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
        >
          <div className="h-12 w-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand-sm flex-shrink-0">
            <Plus className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Upload Content</p>
            <p className="text-xs text-muted-foreground">Share videos, photos & updates</p>
          </div>
        </button>

        {/* Share & Invite CTAs */}
        <div className="flex gap-3">
          <button
            onClick={() => setShareOpen(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-secondary text-foreground text-sm font-bold active:scale-95 transition-transform"
          >
            <Share2 className="h-4 w-4" />
            Share Profile
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-invite-modal"))}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-primary/10 text-primary text-sm font-bold active:scale-95 transition-transform"
          >
            <UserPlus className="h-4 w-4" />
            Invite Friends
          </button>
        </div>

        {/* Trainee Progression */}
        <TraineeProgressCard userId={user.id} />

        {/* Activity section */}
        <div className="rounded-[28px] border border-border/10 bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-foreground">
              Activity
            </h2>
          </div>
          <div className="rounded-2xl bg-secondary/40 p-4 text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Start sharing your training journey
            </p>
            <p className="text-xs text-muted-foreground">
              Upload clips, tag coaches, and track your progress
            </p>
          </div>
        </div>

        {/* Posts placeholder */}
        <div className="rounded-[28px] border border-border/10 bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-foreground">
              Posts
            </h2>
          </div>
          <div className="rounded-2xl bg-secondary/40 p-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Your training clips and match highlights will appear here
            </p>
          </div>
        </div>

        {/* Coaches section */}
        <div className="rounded-[28px] border border-border/10 bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-foreground">
              Coaches
            </h2>
          </div>
          <div className="rounded-2xl bg-secondary/40 p-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Coaches you've trained with will show here
            </p>
            <Link
              to="/discover"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-heading font-bold text-primary-foreground"
            >
              Discover coaches
            </Link>
          </div>
        </div>

        {/* Become a Coach CTA */}
        <div className="rounded-[28px] border border-dashed border-primary/25 bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-foreground">
              Become a Coach
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Share your expertise, build a community, and earn from coaching sessions.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-heading font-bold text-primary-foreground"
          >
            Get started
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`${profile?.username || "Player"} on CIRCLO`}
        text="Check out my profile on CIRCLO! 🏆"
        url="/profile"
      />
    </div>
  );
};

export default PlayerProfile;
