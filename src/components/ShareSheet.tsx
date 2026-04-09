import { useState } from "react";
import { X, Copy, Check, MessageCircle, Instagram, Link2, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  text?: string;
  url: string;
}

const ShareSheet = ({ open, onClose, title, text, url }: ShareSheetProps) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
  const shareText = text || title;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${fullUrl}`)}`, "_blank");
    onClose();
  };

  const handleInstagram = () => {
    // Instagram doesn't support direct URL sharing via web — copy link and inform
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied — paste it in your Instagram story or DM!");
    onClose();
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: shareText, url: fullUrl });
      onClose();
    } catch {
      // user cancelled
    }
  };

  const channels = [
    { label: "WhatsApp", icon: MessageCircle, action: handleWhatsApp, color: "bg-green-500/10 text-green-600" },
    { label: "Instagram", icon: Instagram, action: handleInstagram, color: "bg-pink-500/10 text-pink-500" },
    { label: "Copy Link", icon: copied ? Check : Link2, action: handleCopy, color: "bg-primary/10 text-primary" },
  ];

  // Add native share if available
  if (navigator.share) {
    channels.push({ label: "More", icon: Share2, action: handleNativeShare, color: "bg-muted text-muted-foreground" });
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-t-3xl px-6 pb-8 pt-5 animate-slide-up safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-base font-bold text-foreground">Share</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-secondary/50 rounded-xl px-4 py-3 mb-5">
          <p className="text-sm font-semibold text-foreground line-clamp-1">{title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{fullUrl}</p>
        </div>

        {/* Share channels */}
        <div className="grid grid-cols-4 gap-3">
          {channels.map((ch) => (
            <button
              key={ch.label}
              onClick={ch.action}
              className="flex flex-col items-center gap-2 py-3 rounded-xl active:scale-95 transition-transform"
            >
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", ch.color)}>
                <ch.icon className="h-6 w-6" />
              </div>
              <span className="text-[11px] font-medium text-foreground">{ch.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareSheet;
