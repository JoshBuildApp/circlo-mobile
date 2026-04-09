import { PageSection, SECTION_OPTIONS } from "@/hooks/use-page-sections";
import { Zap, Camera, ShoppingBag, CalendarDays, LayoutGrid } from "lucide-react";
import SectionIcon from "./SectionIcon";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Template {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
  sections: { type: string; layout: string; highlighted?: boolean }[];
}

const TEMPLATES: Template[] = [
  {
    id: "balanced",
    name: "Balanced",
    icon: <LayoutGrid className="h-4 w-4" />,
    description: "Equal exposure — highlights, store, posts, and more",
    gradient: "from-primary/20 to-primary/5",
    sections: [
      { type: "clips", layout: "featured", highlighted: true },
      { type: "store", layout: "full" },
      { type: "posts", layout: "grid" },
      { type: "about", layout: "full" },
      { type: "reviews", layout: "full" },
      { type: "community", layout: "half" },
    ],
  },
  {
    id: "creator",
    name: "Creator",
    icon: <Camera className="h-4 w-4" />,
    description: "Content-first — showcase posts, clips, and articles",
    gradient: "from-accent/20 to-accent/5",
    sections: [
      { type: "clips", layout: "grid", highlighted: true },
      { type: "posts", layout: "grid" },
      { type: "articles", layout: "full" },
      { type: "store", layout: "full" },
      { type: "community", layout: "full" },
      { type: "about", layout: "full" },
    ],
  },
  {
    id: "store-first",
    name: "Store First",
    icon: <ShoppingBag className="h-4 w-4" />,
    description: "Products front-and-center — sell more instantly",
    gradient: "from-orange-500/20 to-orange-500/5",
    sections: [
      { type: "store", layout: "featured", highlighted: true },
      { type: "clips", layout: "full" },
      { type: "posts", layout: "grid" },
      { type: "reviews", layout: "full" },
      { type: "about", layout: "full" },
    ],
  },
  {
    id: "booking-focus",
    name: "Booking Focus",
    icon: <CalendarDays className="h-4 w-4" />,
    description: "Get sessions booked — schedule and programs first",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    sections: [
      { type: "schedule", layout: "full", highlighted: true },
      { type: "programs", layout: "full" },
      { type: "clips", layout: "full" },
      { type: "store", layout: "full" },
      { type: "reviews", layout: "full" },
      { type: "about", layout: "full" },
    ],
  },
  {
    id: "pro-coach",
    name: "Pro Coach",
    icon: <Zap className="h-4 w-4" />,
    description: "Sessions, reviews, and programs — full professional setup",
    gradient: "from-violet-500/20 to-violet-500/5",
    sections: [
      { type: "clips", layout: "featured", highlighted: true },
      { type: "programs", layout: "full" },
      { type: "schedule", layout: "full" },
      { type: "store", layout: "full" },
      { type: "reviews", layout: "full" },
      { type: "about", layout: "full" },
      { type: "community", layout: "half" },
    ],
  },
];

interface PageLabTemplatesProps {
  coachId: string;
  onApply: (sections: PageSection[]) => void;
}

const PageLabTemplates = ({ coachId, onApply }: PageLabTemplatesProps) => {
  const [previewId, setPreviewId] = useState<string | null>(null);

  const buildSections = (template: Template): PageSection[] =>
    template.sections.map((s, i) => ({
      id: `tpl-${Date.now()}-${i}`,
      coach_id: coachId,
      section_type: s.type,
      position: i,
      layout_size: s.layout,
      is_visible: true,
      config: s.highlighted ? { highlighted: true } : {},
    }));

  const handleTap = (tpl: Template) => {
    if (previewId === tpl.id) {
      // Second tap = confirm
      onApply(buildSections(tpl));
      setPreviewId(null);
    } else {
      setPreviewId(tpl.id);
    }
  };

  const previewTemplate = previewId ? TEMPLATES.find((t) => t.id === previewId) : null;

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-1">
        Profile Presets
      </p>

      {/* Template cards - horizontal scroll */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
        {TEMPLATES.map((tpl) => {
          const isSelected = previewId === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => handleTap(tpl)}
              className={`flex-shrink-0 w-[140px] p-3 rounded-2xl bg-gradient-to-br ${tpl.gradient} border transition-all duration-200 text-left active:scale-[0.97] ${
                isSelected
                  ? "border-primary/40 ring-2 ring-primary/20 scale-[1.02]"
                  : "border-border/10 hover:border-primary/20"
              }`}
            >
              <div className="h-7 w-7 rounded-lg bg-background/60 flex items-center justify-center text-foreground mb-2">
                {tpl.icon}
              </div>
              <p className="text-xs font-heading font-bold text-foreground">{tpl.name}</p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5 leading-tight line-clamp-2">
                {tpl.description}
              </p>
              <div className="flex gap-0.5 mt-2">
                {tpl.sections.slice(0, 4).map((s, i) => {
                  const opt = SECTION_OPTIONS.find((o) => o.type === s.type);
                  return (
                    <SectionIcon key={i} iconName={opt?.icon} size="sm" className="text-muted-foreground/60" />
                  );
                })}
                {tpl.sections.length > 4 && (
                  <span className="text-[9px] text-muted-foreground/40 ml-0.5">+{tpl.sections.length - 4}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Preview panel */}
      {previewTemplate && (
        <div className="rounded-2xl border border-primary/20 bg-card/80 p-3 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs font-heading font-bold text-foreground">
              Preview: {previewTemplate.name}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px] rounded-full"
                onClick={() => setPreviewId(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-[10px] rounded-full font-bold"
                onClick={() => {
                  onApply(buildSections(previewTemplate));
                  setPreviewId(null);
                }}
              >
                Apply Layout
              </Button>
            </div>
          </div>

          {/* Mini section preview */}
          <div className="space-y-1">
            {previewTemplate.sections.map((s, i) => {
              const opt = SECTION_OPTIONS.find((o) => o.type === s.type);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] ${
                    s.highlighted
                      ? "bg-primary/10 text-primary font-bold"
                      : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <SectionIcon iconName={opt?.icon} size="sm" />
                  <span>{opt?.label || s.type}</span>
                  <span className="ml-auto text-[9px] text-muted-foreground/40">{s.layout}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PageLabTemplates;
