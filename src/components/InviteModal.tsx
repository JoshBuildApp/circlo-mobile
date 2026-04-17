import { useState } from "react";
import { X, UserPlus, Users, Copy, Check, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { openExternal, shareUrl as buildShareUrl } from "@/lib/platform";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

const InviteModal = ({ open, onClose }: InviteModalProps) => {
  const { user, role } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const inviteUrl = buildShareUrl("/signup");
  const isCoach = role === "coach";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = (message: string) => {
    openExternal(`https://wa.me/?text=${encodeURIComponent(`${message}\n${inviteUrl}`)}`);
  };

  const inviteOptions = [
    {
      id: "friends",
      icon: Users,
      title: "Invite Friends",
      desc: "Train together, grow together",
      message: "Hey! Join me on CIRCLO — discover amazing coaches and training content",
      color: "bg-primary/10 text-primary",
    },
    {
      id: "coach",
      icon: UserPlus,
      title: "Invite Your Coach",
      desc: "Bring your coach to the platform",
      message: "Hey Coach! Join CIRCLO to share your training content and get booked by athletes",
      color: "bg-accent/20 text-accent-foreground",
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-t-3xl px-6 pb-8 pt-5 animate-slide-up safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading text-base font-bold text-foreground">Invite & Grow</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-5">
          Invite people and help the community grow
        </p>

        {/* Reward banner */}
        <div className="bg-brand-gradient rounded-xl p-4 mb-5 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary-foreground flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-primary-foreground">Earn Rewards</p>
            <p className="text-[11px] text-primary-foreground/80">
              {isCoach
                ? "Get boosted visibility when friends you invite join"
                : "Invite coaches & friends to unlock profile highlights"
              }
            </p>
          </div>
        </div>

        {/* Invite options */}
        <div className="space-y-3 mb-5">
          {inviteOptions.map((opt) => (
            <div key={opt.id} className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", opt.color)}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{opt.title}</p>
                  <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleWhatsApp(opt.message)}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-10 bg-green-500/10 text-green-600 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </button>
                <button
                  onClick={handleCopy}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-10 bg-primary/10 text-primary rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
