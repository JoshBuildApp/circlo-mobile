import { Link } from "react-router-dom";
import SectionHeader from "./SectionHeader";
import { SafeImage } from "@/components/ui/safe-image";

interface DiscoverItem {
  id: string;
  coachId: string;
  image: string;
  videoSrc: string;
  caption: string;
}

interface DiscoverPreviewProps {
  items: DiscoverItem[];
}

const DiscoverPreview = ({ items }: DiscoverPreviewProps) => {
  if (items.length === 0) return null;

  return (
    <div>
      <SectionHeader title="Discover" linkTo="/discover" linkLabel="View all" />
      <div className="grid grid-cols-3 gap-1 px-4 pb-2">
        {items.slice(0, 6).map((item) => (
          <Link
            key={item.id}
            to={`/coach/${item.coachId}`}
            className="relative aspect-square rounded-lg overflow-hidden bg-secondary"
          >
            {item.image && !/\.(mp4|mov|webm|m4v|ogv)(\?|$)/i.test(item.image) ? (
              <SafeImage src={item.image} alt="" className="h-full w-full object-cover" />
            ) : item.videoSrc ? (
              <video src={item.videoSrc} muted preload="metadata" className="h-full w-full object-cover" />
            ) : item.image ? (
              <video src={item.image} muted preload="metadata" className="h-full w-full object-cover" />
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DiscoverPreview;
