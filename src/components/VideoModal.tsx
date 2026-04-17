import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Video } from "@/data/coaches";
import VideoPlayer from "@/components/VideoPlayer";

interface VideoModalProps {
  video: Video | null;
  open: boolean;
  onClose: () => void;
}

/** Returns true for direct video file URLs (mp4, mov, webm, etc.) */
const isDirectVideo = (url: string) =>
  /\.(mp4|mov|webm|ogg|m4v)(\?.*)?$/i.test(url) ||
  url.includes("supabase") ||
  url.startsWith("blob:");

const VideoModal = ({ video, open, onClose }: VideoModalProps) => {
  if (!video) return null;

  const direct = isDirectVideo(video.url);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-foreground border-none rounded-2xl">
        <div className="aspect-video">
          {direct ? (
            <VideoPlayer
              src={video.url}
              autoPlay
              className="w-full h-full"
            />
          ) : (
            <iframe
              src={video.url}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        <div className="p-4">
          <h3 className="font-heading font-bold text-primary-foreground">{video.title}</h3>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;
