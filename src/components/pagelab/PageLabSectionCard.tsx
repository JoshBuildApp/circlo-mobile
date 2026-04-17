import {
  GripVertical, Eye, EyeOff, Trash2, ChevronUp, ChevronDown,
  Settings2, Maximize2, Columns, LayoutGrid, Star,
} from "lucide-react";
import { PageSection, SECTION_OPTIONS } from "@/hooks/use-page-sections";
import { useState } from "react";
import SectionIcon from "./SectionIcon";

const LAYOUT_OPTIONS = [
  { value: "full", label: "Full", icon: Maximize2 },
  { value: "half", label: "Half", icon: Columns },
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "featured", label: "Featured", icon: Star },
];

interface PageLabSectionCardProps {
  section: PageSection;
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onToggleVisibility: (index: number) => void;
  onRemove: (index: number) => void;
  onUpdateLayout: (index: number, layout: string) => void;
  onUpdateConfig: (index: number, config: Record<string, unknown>) => void;
  isDragging: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

const PageLabSectionCard = ({
  section, index, total,
  onMove, onToggleVisibility, onRemove, onUpdateLayout, onUpdateConfig,
  isDragging, onDragStart, onDragOver, onDragEnd,
}: PageLabSectionCardProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const option = SECTION_OPTIONS.find((o) => o.type === section.section_type);
  const customTitle = section.config?.title as string | undefined;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={`rounded-2xl border transition-all duration-300 ${
        isDragging
          ? "scale-[1.02] shadow-lg border-primary/40 bg-primary/5 opacity-80"
          : section.is_visible
            ? "border-border/20 bg-card shadow-sm hover:shadow-md hover:border-primary/20"
            : "border-border/10 bg-secondary/20 opacity-50"
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-2.5 p-3">
        {/* Drag handle */}
        <div
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-secondary/60 transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
        </div>

        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="h-6 w-6 rounded-md bg-secondary/40 flex items-center justify-center text-muted-foreground disabled:opacity-20 active:scale-90 transition-all hover:bg-secondary"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="h-6 w-6 rounded-md bg-secondary/40 flex items-center justify-center text-muted-foreground disabled:opacity-20 active:scale-90 transition-all hover:bg-secondary"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* Section info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center">
              <SectionIcon iconName={option?.icon} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                {customTitle || option?.label || section.section_type}
              </p>
              <p className="text-[10px] text-muted-foreground/70 leading-tight mt-0.5">
                {option?.description || "Custom section"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`h-8 w-8 rounded-xl flex items-center justify-center active:scale-90 transition-all ${
              settingsOpen ? "bg-primary/15 text-primary" : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onToggleVisibility(index)}
            className={`h-8 w-8 rounded-xl flex items-center justify-center active:scale-90 transition-all ${
              section.is_visible
                ? "bg-primary/10 text-primary"
                : "bg-secondary/40 text-muted-foreground"
            }`}
          >
            {section.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onRemove(index)}
            className="h-8 w-8 rounded-xl bg-destructive/8 text-destructive/70 flex items-center justify-center active:scale-90 transition-all hover:bg-destructive/15 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div className="px-3 pb-3 animate-fade-in">
          <div className="rounded-xl bg-secondary/20 p-3 space-y-3">
            {/* Section title */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1 block">
                Section Title
              </label>
              <input
                type="text"
                value={customTitle || ""}
                onChange={(e) => onUpdateConfig(index, { ...section.config, title: e.target.value || undefined })}
                placeholder={option?.label}
                className="w-full h-8 rounded-lg bg-background/60 border border-border/20 px-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Layout style */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1.5 block">
                Layout Style
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {LAYOUT_OPTIONS.map((lo) => {
                  const Icon = lo.icon;
                  const active = section.layout_size === lo.value;
                  return (
                    <button
                      key={lo.value}
                      onClick={() => onUpdateLayout(index, lo.value)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[9px] font-semibold transition-all active:scale-95 ${
                        active
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "bg-background/40 text-muted-foreground hover:bg-background/60 border border-transparent"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {lo.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Highlight toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                Highlight Section
              </span>
              <button
                onClick={() => onUpdateConfig(index, { ...section.config, highlighted: !section.config?.highlighted })}
                className={`h-6 w-10 rounded-full transition-all duration-300 ${
                  section.config?.highlighted ? "bg-primary" : "bg-secondary"
                }`}
              >
                <div className={`h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-300 ${
                  section.config?.highlighted ? "translate-x-[18px]" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider font-medium">
            #{index + 1}
          </span>
          <span className="text-[9px] text-muted-foreground/30">·</span>
          <span className="text-[9px] text-muted-foreground/40 capitalize">
            {section.layout_size}
          </span>
          {section.config?.highlighted && (
            <>
              <span className="text-[9px] text-muted-foreground/30">·</span>
              <span className="text-[9px] text-primary/60">★ Highlighted</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageLabSectionCard;
