import { PageSection, SECTION_OPTIONS } from "@/hooks/use-page-sections";
import { Eye } from "lucide-react";
import SectionIcon from "./SectionIcon";

interface PageLabPreviewProps {
  sections: PageSection[];
}

const LAYOUT_HEIGHT: Record<string, string> = {
  full: "h-14",
  half: "h-10",
  grid: "h-12",
  featured: "h-20",
};

const PageLabPreview = ({ sections }: PageLabPreviewProps) => {
  const visible = sections.filter((s) => s.is_visible);

  return (
    <div className="rounded-2xl border border-border/10 bg-secondary/10 p-3 space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Eye className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-semibold">
          Live Preview
        </span>
      </div>

      {/* Mini phone frame */}
      <div className="mx-auto w-full max-w-[180px] rounded-xl bg-background border border-border/20 overflow-hidden shadow-sm">
        {/* Status bar */}
        <div className="h-4 bg-secondary/30 flex items-center justify-center">
          <div className="h-1.5 w-8 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Profile header mini */}
        <div className="p-2 flex items-center gap-1.5 border-b border-border/10">
          <div className="h-5 w-5 rounded-full bg-primary/20" />
          <div className="space-y-0.5">
            <div className="h-1.5 w-12 rounded-full bg-foreground/20" />
            <div className="h-1 w-8 rounded-full bg-muted-foreground/15" />
          </div>
        </div>

        {/* Sections */}
        <div className="p-1.5 space-y-1">
          {visible.length === 0 ? (
            <div className="h-16 flex items-center justify-center">
              <span className="text-[8px] text-muted-foreground/30">No sections</span>
            </div>
          ) : (
            visible.map((section, i) => {
              const opt = SECTION_OPTIONS.find((o) => o.type === section.section_type);
              const heightClass = LAYOUT_HEIGHT[section.layout_size] || "h-14";
              return (
                <div
                  key={section.id}
                  className={`${heightClass} rounded-md flex items-center justify-center gap-1 transition-all duration-300 ${
                    section.config?.highlighted
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-secondary/30"
                  }`}
                >
                  <SectionIcon iconName={opt?.icon} size="sm" className="text-muted-foreground/40" />
                  <span className="text-[7px] text-muted-foreground/50 font-medium truncate">
                    {(section.config?.title as string) || opt?.label}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom nav mini */}
        <div className="h-3 bg-secondary/20 border-t border-border/10" />
      </div>
    </div>
  );
};

export default PageLabPreview;
