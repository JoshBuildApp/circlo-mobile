import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Avatar } from "@/components/v2/shared";
import { Chip } from "@/components/v2/shared";
import type { CirclePost } from "@/types/v2";

export function PostRow({ post, onClick }: { post: CirclePost; onClick?: () => void }) {
  const ago = formatRelative(new Date(post.createdAt));
  const gradient =
    post.authorGradient === "orange-peach"
      ? "orange-peach"
      : post.authorGradient === "teal-mint"
      ? "teal-mint"
      : "teal-gold";
  return (
    <button
      onClick={onClick}
      className="w-full mx-5 p-3.5 rounded-[16px] bg-navy-card flex gap-3 text-left"
      style={{ width: "calc(100% - 2.5rem)" }}
    >
      <Avatar size={40} gradient={gradient} />
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 items-center text-[13px] font-bold">
          <span>{post.author}</span>
          {post.isCoach && <Chip variant="teal" className="text-[9px] !px-1.5 !py-0.5">COACH</Chip>}
          <span className="text-v2-muted text-[11px] font-medium">· {ago}</span>
        </div>
        <div className="mt-1 text-[13px] leading-snug text-offwhite">{post.body}</div>
        <div className="mt-2 flex gap-3.5 text-v2-muted text-[12px]">
          <span className="flex items-center gap-1">
            <Heart size={14} /> <span className="tnum">{post.likes}</span>
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={14} /> <span className="tnum">{post.comments}</span>
          </span>
          <Share2 size={14} />
        </div>
      </div>
    </button>
  );
}

function formatRelative(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return days === 1 ? "yesterday" : `${days}d`;
  return date.toLocaleDateString();
}
