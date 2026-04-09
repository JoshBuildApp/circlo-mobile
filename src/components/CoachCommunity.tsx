import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { useCoachPosts, type CoachPost } from "@/hooks/use-coach-posts";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Props {
  coachId: string;
  coachName: string;
}

const CoachCommunity = ({ coachId, coachName }: Props) => {
  const { posts, loading, createPost } = useCoachPosts(coachId);
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (!user) {
      toast.error("Log in to post");
      return;
    }
    setSubmitting(true);
    const result = await createPost({ content: text.trim() });
    setSubmitting(false);
    if (result.success) {
      setText("");
      toast.success("Posted!");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-heading text-sm font-bold text-foreground">Community</h3>
        <span className="text-[11px] text-muted-foreground">({posts.length})</span>
      </div>

      {/* Post input */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={`Ask ${coachName} something...`}
          className="flex-1 h-10 rounded-xl bg-secondary border border-border/10 px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          No posts yet. Be the first to start a conversation!
        </p>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto hide-scrollbar">
          {posts.map((post: any) => (
            <div key={post.id} className="bg-card rounded-xl border border-border/10 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground overflow-hidden">
                  {(post.user?.full_name || "U")[0].toUpperCase()}
                </div>
                <span className="text-[11px] font-medium text-foreground">{post.user?.full_name || "User"}</span>
                <span className="text-[9px] text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-8">{post.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachCommunity;