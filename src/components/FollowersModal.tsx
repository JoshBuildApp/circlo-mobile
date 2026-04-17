import { useEffect, useState, memo } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { resolveCoachImage } from "@/lib/coach-placeholders";
import { useFollowersList, useFollowingList } from "@/hooks/use-follower-counts";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface CoachInfo {
  id: string;
  coach_name: string;
  image_url: string | null;
  sport: string;
  user_id: string;
}

interface FollowersModalProps {
  open: boolean;
  onClose: () => void;
  coachId?: string;
  userId?: string;
  initialTab?: "followers" | "following";
}

/** Inline follow button for the list items */
const FollowButton = ({ coachId, currentUserId }: { coachId: string; currentUserId: string }) => {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    supabase
      .from("user_follows")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("coach_id", coachId)
      .maybeSingle()
      .then(({ data }) => {
        setFollowing(!!data);
        setLoading(false);
      });
  }, [coachId, currentUserId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const was = following;
    setFollowing(!was);

    try {
      if (was) {
        await supabase.from("user_follows").delete().eq("user_id", currentUserId).eq("coach_id", coachId);
      } else {
        await supabase.from("user_follows").insert({ user_id: currentUserId, coach_id: coachId });
      }
    } catch {
      setFollowing(was);
    } finally {
      setPending(false);
    }
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`ml-auto shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        following
          ? "bg-secondary text-foreground hover:bg-secondary/70"
          : "bg-primary text-primary-foreground hover:brightness-110"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
};

const FollowersModal = ({ open, onClose, coachId, userId, initialTab = "followers" }: FollowersModalProps) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"followers" | "following">(initialTab);
  const [followerProfiles, setFollowerProfiles] = useState<Profile[]>([]);
  const [followingCoaches, setFollowingCoaches] = useState<CoachInfo[]>([]);

  const { followers, loadFollowers, loading: loadingFollowers } = useFollowersList(coachId);
  const { following, loadFollowing, loading: loadingFollowing } = useFollowingList(userId);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    if (tab === "followers" && coachId) loadFollowers();
    if (tab === "following" && userId) loadFollowing();
  }, [open, tab, coachId, userId]);

  // Resolve follower user_ids to profiles
  useEffect(() => {
    if (followers.length === 0) { setFollowerProfiles([]); return; }
    const ids = followers.map((f) => f.user_id);
    supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .in("user_id", ids)
      .then(({ data }) => {
        if (data) setFollowerProfiles(data);
      });
  }, [followers]);

  // Resolve following coach_ids to coach profiles (include user_id to hide self)
  useEffect(() => {
    if (following.length === 0) { setFollowingCoaches([]); return; }
    const ids = following.map((f) => f.coach_id);
    supabase
      .from("coach_profiles")
      .select("id, coach_name, image_url, sport, user_id")
      .in("id", ids)
      .then(({ data }) => {
        if (data) setFollowingCoaches(data as any);
      });
  }, [following]);

  const loading = tab === "followers" ? loadingFollowers : loadingFollowing;
  const showFollowers = tab === "followers" && coachId;
  const showFollowing = tab === "following" && userId;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="font-heading text-lg text-foreground">Connections</DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b border-border/20 px-4 mt-2">
          {coachId && (
            <button
              onClick={() => setTab("followers")}
              className={`flex-1 pb-3 text-sm font-heading font-semibold transition-colors border-b-2 ${
                tab === "followers"
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent"
              }`}
            >
              Followers{followerProfiles.length > 0 ? ` (${followerProfiles.length})` : ""}
            </button>
          )}
          {userId && (
            <button
              onClick={() => setTab("following")}
              className={`flex-1 pb-3 text-sm font-heading font-semibold transition-colors border-b-2 ${
                tab === "following"
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent"
              }`}
            >
              Following{followingCoaches.length > 0 ? ` (${followingCoaches.length})` : ""}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-1">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && showFollowers && followerProfiles.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No followers yet</p>
            </div>
          )}

          {!loading && showFollowers && followerProfiles.map((p) => {
            // Check if this follower is also a coach so we can show follow button
            const isCurrentUser = p.user_id === user?.id;
            return (
              <Link
                key={p.user_id}
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-heading font-bold text-sm">
                    {p.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">
                  {p.username}
                  {isCurrentUser && <span className="text-muted-foreground font-normal ml-1">(you)</span>}
                </span>
              </Link>
            );
          })}

          {!loading && showFollowing && followingCoaches.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Not following anyone</p>
            </div>
          )}

          {!loading && showFollowing && followingCoaches.map((c) => {
            const isOwnCoachProfile = c.user_id === user?.id;
            return (
              <Link
                key={c.id}
                to={`/coach/${c.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={resolveCoachImage(c.image_url, c.id)} />
                  <AvatarFallback className="bg-primary/10 text-primary font-heading font-bold text-sm">
                    {c.coach_name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate block">{c.coach_name}</span>
                  <p className="text-xs text-muted-foreground">{c.sport}</p>
                </div>
                {user && !isOwnCoachProfile && (
                  <FollowButton coachId={c.id} currentUserId={user.id} />
                )}
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(FollowersModal);
