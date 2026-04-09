import { useState } from "react";
import { X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TextPostSheetProps {
  open: boolean;
  onClose: () => void;
  coachId: string;
  userId: string;
}

const MAX_LENGTH = 500;

const TextPostSheet = ({ open, onClose, coachId, userId }: TextPostSheetProps) => {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setPosting(true);
    try {
      const { error } = await supabase.from("coach_posts").insert({
        coach_id: coachId,
        user_id: userId,
        text: trimmed,
      });
      if (error) throw error;
      toast.success("Posted!");
      window.dispatchEvent(new CustomEvent("content-uploaded"));
      setText("");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
        <button
          onClick={onClose}
          disabled={posting}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold text-foreground">New Post</span>
        <button
          onClick={handlePost}
          disabled={posting || !text.trim()}
          className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 active:scale-95 transition-transform"
        >
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </button>
      </div>

      {/* Text area */}
      <div className="flex-1 px-5 pt-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="Share something with your community…"
          autoFocus
          className="w-full h-48 bg-transparent text-base text-foreground placeholder:text-muted-foreground/50 outline-none resize-none leading-relaxed"
        />
        <p className="text-[11px] text-muted-foreground text-right mt-1">
          {text.length}/{MAX_LENGTH}
        </p>
      </div>

      {/* Bottom hint */}
      <div className="px-5 py-5 safe-area-bottom">
        <div className="rounded-2xl bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground">
            Your post will appear in your community feed and profile
          </p>
        </div>
      </div>
    </div>
  );
};

export default TextPostSheet;
