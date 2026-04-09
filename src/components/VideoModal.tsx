import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Video } from "@/data/coaches";

interface VideoModalProps {
  video: Video | null;
  open: boolean;
  onClose: () => void;
}

const VideoModal = ({ video, open, onClose }: VideoModalProps) => {
  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-foreground border-none rounded-2xl">
        <div className="aspect-video">
          <iframe
            src={video.url}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="p-4">
          <h3 className="font-heading font-bold text-primary-foreground">{video.title}</h3>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;
