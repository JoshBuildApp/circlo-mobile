import { Avatar, Chip } from "@/components/v2/shared";
import type { Coach, CirclePost } from "@/types/v2";
import { Heart, MessageCircle } from "lucide-react";

interface CommunityTabProps {
  coach: Coach;
  posts: CirclePost[];
  onJoin: () => void;
}

export function CommunityTab({ coach, posts, onJoin }: CommunityTabProps) {
  return (
    <div className="pb-32">
      <div className="mx-5 mb-4 rounded-[18px] overflow-hidden p-5 relative bg-gradient-to-br from-[#0f3b33] to-[#0a2722]">
        <Chip variant="teal" leadingDot>{(coach.followerCount ?? 18)} ONLINE</Chip>
        <div className="w-[70px] h-[70px] rounded-full ml-auto mt-4" style={{ background: "linear-gradient(135deg, #00D4AA, #ffd97a)" }} />
        <button
          onClick={onJoin}
          className="absolute top-4 right-4 bg-teal text-navy-deep px-3.5 py-2 rounded-full font-bold text-[13px]"
        >
          + Join
        </button>
        <div className="-mt-7">
          <h3 className="text-[18px] font-bold">{coach.firstName}'s {coach.sports[0]} Circle</h3>
          <p className="text-[12px] text-v2-muted mt-0.5">{coach.followerCount ?? 340} members · free to join</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mx-5 mb-5">
        <div className="p-3.5 rounded-[14px] bg-navy-card text-left">
          <div className="text-[22px] font-extrabold tnum">{coach.followerCount ?? 340}</div>
          <div className="text-[11px] text-v2-muted mt-0.5">members</div>
        </div>
        <div className="p-3.5 rounded-[14px] bg-navy-card text-left">
          <div className="text-[22px] font-extrabold tnum text-teal">+12</div>
          <div className="text-[11px] text-v2-muted mt-0.5">this week</div>
        </div>
        <div className="p-3.5 rounded-[14px] bg-navy-card text-left">
          <div className="text-[22px] font-extrabold tnum">42</div>
          <div className="text-[11px] text-v2-muted mt-0.5">posts</div>
        </div>
      </div>

      <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-wider uppercase">RECENT POSTS</div>
      <div className="px-5 flex flex-col gap-2.5">
        {posts.map((p) => (
          <div key={p.id} className="p-3.5 rounded-[16px] bg-navy-card flex gap-2.5">
            <Avatar size={36} gradient={p.authorGradient === "orange-peach" ? "orange-peach" : "teal-gold"} />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[13px] font-bold">
                {p.author}
                {p.isCoach && <Chip variant="teal" className="text-[9px] !px-1.5 !py-0.5">★ Coach</Chip>}
                <span className="text-v2-muted font-medium text-[11px]">· 2h</span>
              </div>
              <div className="text-[13px] mt-1">{p.body}</div>
              <div className="flex gap-3.5 mt-2 text-v2-muted text-[12px]">
                <span className="flex items-center gap-1"><Heart size={12} /> <span className="tnum">{p.likes}</span></span>
                <span className="flex items-center gap-1"><MessageCircle size={12} /> <span className="tnum">{p.comments}</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
