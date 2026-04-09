import { Play } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import type { Coach, Video } from "@/data/coaches";

interface DiscoverGridProps {
  items: { video: Video; coach: Coach }[];
  onPlay: (item: { video: Video; coach: Coach }) => void;
}

const formatViews = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
};

const DiscoverGrid = ({ items, onPlay }: DiscoverGridProps) => {
  // Create a masonry-like grid with varying sizes
  const sizePattern = ["large", "small", "small", "small", "large", "small"] as const;

  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-6 w-1 rounded-full bg-accent" />
          <h2 className="font-heading text-2xl font-bold text-foreground">Discover</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {items.map((item, i) => {
            const size = sizePattern[i % sizePattern.length];
            const isLarge = size === "large";

            return (
              <button
                key={`${item.coach.id}-${i}`}
                onClick={() => onPlay(item)}
                className={`group relative overflow-hidden rounded-xl ${
                  isLarge ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                }`}
              >
                <SafeImage
                  src={item.coach.image}
                  alt={item.video.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Play icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                  </div>
                </div>

                {/* Info overlay on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{item.video.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.coach.name} · {item.video.views ? formatViews(item.video.views) : ""}
                  </p>
                </div>

                {/* Duration badge */}
                {item.video.duration && (
                  <span className="absolute top-2 right-2 text-[10px] bg-background/70 text-foreground px-2 py-0.5 rounded-md font-medium backdrop-blur-sm">
                    {item.video.duration}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DiscoverGrid;
