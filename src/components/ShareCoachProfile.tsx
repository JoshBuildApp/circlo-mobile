import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share, Copy, Check, MessageCircle, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ShareCoachProfileProps {
  coachId: string;
  coachName: string;
  className?: string;
}

export const ShareCoachProfile = ({ coachId, coachName, className }: ShareCoachProfileProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/coach/${coachId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Coach profile link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Check out ${coachName}'s coaching profile on Circlo: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out ${coachName} on Circlo`);
    const body = encodeURIComponent(`I thought you might be interested in ${coachName}'s coaching profile on Circlo: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${coachName} on Circlo`,
          text: `Check out ${coachName}'s coaching profile`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled sharing or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboard();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyToClipboard}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Copy link
        </DropdownMenuItem>
        
        {navigator.share && (
          <DropdownMenuItem onClick={shareViaNative}>
            <Share className="h-4 w-4 mr-2" />
            Share...
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={shareViaWhatsApp}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareViaEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};