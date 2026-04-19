import { useState, type DragEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { GripVertical, Eye, EyeOff, Trash2, Plus, X, Lock, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Coach } from "@/types/v2";
import type { CoachReview } from "@/hooks/v2/useSupabaseQueries";
import { SECTION_DEFS, CATALOG_ICON_MAP, type SectionId, type RenderCtx } from "./sectionRegistry";
import { useProfileLayout, type LayoutSection } from "./useProfileLayout";

/**
 * The coach-profile builder.
 *
 * Two modes:
 *  - "view":   renders visible sections top-to-bottom, in saved order.
 *  - "edit":   wraps each section in drag/toggle/remove controls, with an
 *              add-section button between every pair. Save button writes
 *              the draft to localStorage; Cancel reverts.
 *
 * The caller decides who can edit (owner gate lives in the page). This
 * component just responds to the `canEdit` flag.
 */

type Mode = "view" | "edit";

export interface ProfileBuilderProps {
  coach: Coach;
  ratingValue: number;
  reviewCount: number;
  reviews: CoachReview[];
  following: boolean;
  followBusy: boolean;
  onFollow: () => void;
  onMessage: () => void;
  canEdit?: boolean;
}

export function ProfileBuilder(props: ProfileBuilderProps) {
  const {
    coach,
    canEdit = false,
  } = props;

  const layout = useProfileLayout({ coachId: coach.id });
  const [mode, setMode] = useState<Mode>("view");
  const [librarySlot, setLibrarySlot] = useState<number | null>(null);

  const renderCtx: RenderCtx = {
    coach: props.coach,
    ratingValue: props.ratingValue,
    reviewCount: props.reviewCount,
    reviews: props.reviews,
    following: props.following,
    followBusy: props.followBusy,
    onFollow: props.onFollow,
    onMessage: props.onMessage,
  };

  // List the owner sees when editing (draft). Viewers + owner-in-view use saved.
  const sections = mode === "edit" ? layout.draft : layout.saved;

  const handleSave = () => {
    layout.save();
    setMode("view");
    toast.success("Profile saved.");
  };

  const handleCancel = () => {
    layout.cancel();
    setMode("view");
  };

  const handleEditEnter = () => setMode("edit");

  return (
    <div className="pb-32">
      {/* Edit banner — visible only while actively editing */}
      {mode === "edit" && (
        <EditBanner
          dirty={layout.dirty}
          onCancel={handleCancel}
          onSave={handleSave}
          onReset={() => {
            if (window.confirm("Reset profile layout to defaults?")) {
              layout.reset();
              toast.success("Reset to defaults.");
            }
          }}
        />
      )}

      {/* Owner-only "Edit layout" entry when not editing. Non-owners see nothing. */}
      {canEdit && mode === "view" && (
        <div className="px-5 pt-3">
          <button
            onClick={handleEditEnter}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] border border-dashed border-navy-line text-v2-muted text-[12px] font-semibold"
          >
            <Pencil size={13} strokeWidth={2.5} /> Edit layout
          </button>
        </div>
      )}

      {/* Identity lock card — only shown in edit mode so owners understand
          name/avatar aren't part of the reorderable layout. */}
      {mode === "edit" && (
        <div className="mx-5 mt-3 p-3 rounded-[14px] bg-navy-card border border-dashed border-navy-line opacity-80">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-v2-muted">
            <Lock size={10} /> IDENTITY · ALWAYS AT TOP
          </div>
          <div className="text-[12px] text-v2-muted mt-1">
            Your photo, name, and badges show above the tabs. Edit them from
            Profile → Edit.
          </div>
        </div>
      )}

      {sections.map((s, i) => {
        const def = SECTION_DEFS[s.id];
        if (!def) return null;

        if (mode === "view") {
          if (!s.visible) return null;
          return (
            <div key={s.id} data-section-id={s.id}>
              {def.render(renderCtx)}
            </div>
          );
        }

        // Edit mode wrap
        return (
          <EditableSection
            key={s.id}
            section={s}
            index={i}
            onToggle={() => layout.toggleVisibility(s.id)}
            onRemove={() => {
              if (window.confirm(`Remove "${def.label}"?`)) layout.removeSection(s.id);
            }}
            onReorder={layout.moveSection}
            onAddAbove={() => setLibrarySlot(i)}
            onAddBelow={() => setLibrarySlot(i + 1)}
          >
            {def.render(renderCtx)}
          </EditableSection>
        );
      })}

      {/* Bottom add button in edit mode */}
      {mode === "edit" && (
        <div className="px-5 mt-6">
          <button
            onClick={() => setLibrarySlot(sections.length)}
            className="w-full p-5 rounded-[14px] border-2 border-dashed border-navy-line text-center"
          >
            <div className="w-11 h-11 rounded-full bg-teal-dim text-teal inline-flex items-center justify-center mb-2">
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold">Add section</div>
            <div className="text-[11px] text-v2-muted mt-0.5">
              {countRemaining(sections)} sections still available
            </div>
          </button>
        </div>
      )}

      {/* Library sheet */}
      {librarySlot !== null && (
        <LibrarySheet
          existingIds={new Set(sections.map((s) => s.id))}
          onClose={() => setLibrarySlot(null)}
          onAdd={(id) => {
            layout.addSection(id, librarySlot);
            setLibrarySlot(null);
            toast.success(`${SECTION_DEFS[id].label} added.`);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Edit banner ---------- */

function EditBanner({
  dirty,
  onCancel,
  onSave,
  onReset,
}: {
  dirty: boolean;
  onCancel: () => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div
      data-grad="orange-soft"
      className="sticky top-0 z-40 px-4 py-3 flex justify-between items-center border-b border-orange-dim"
    >
      <div className="flex gap-2.5 items-center min-w-0">
        <div className="w-2 h-2 rounded-full bg-orange shrink-0" style={{ boxShadow: "0 0 0 4px rgba(255,107,44,0.25)" }} />
        <div className="min-w-0">
          <div className="text-[13px] font-bold truncate">Editing profile</div>
          <div className="text-[11px] text-v2-muted truncate">Drag · toggle · remove · add</div>
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={onReset}
          className="px-2 py-2 rounded-[10px] bg-navy-card text-v2-muted text-[11px] font-bold"
          title="Reset"
        >
          Reset
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-[10px] bg-navy-card text-v2-muted text-[12px] font-bold"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!dirty}
          className="px-4 py-2 rounded-[10px] bg-orange text-white text-[12px] font-bold disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}

/* ---------- Editable section wrapper ---------- */

interface EditableSectionProps {
  section: LayoutSection;
  index: number;
  onToggle: () => void;
  onRemove: () => void;
  onReorder: (from: number, to: number) => void;
  onAddAbove: () => void;
  onAddBelow: () => void;
  children: ReactNode;
}

function EditableSection({
  section,
  index,
  onToggle,
  onRemove,
  onReorder,
  onAddAbove,
  onAddBelow,
  children,
}: EditableSectionProps) {
  const def = SECTION_DEFS[section.id];
  const [dragOverClass, setDragOverClass] = useState<"" | "drop-above" | "drop-below">("");

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setDragOverClass(e.clientY < midpoint ? "drop-above" : "drop-below");
  };

  const onDragLeave = () => setDragOverClass("");

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(from)) return;
    const inserting = dragOverClass === "drop-below" ? index + 1 : index;
    // Adjust for the removal shift if dragging down.
    const to = from < inserting ? inserting - 1 : inserting;
    setDragOverClass("");
    if (from !== to) onReorder(from, to);
  };

  return (
    <>
      <AddSlot onClick={onAddAbove} />
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative mx-3 my-2 p-2 rounded-[14px] border border-dashed border-navy-line bg-navy-card/40 transition-opacity",
          !section.visible && "opacity-45",
          dragOverClass === "drop-above" && "ring-2 ring-teal ring-offset-0",
          dragOverClass === "drop-below" && "ring-2 ring-teal ring-offset-0",
        )}
      >
        {/* Label badge top-left */}
        <div
          className={cn(
            "absolute -top-2 left-4 px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase bg-navy-deep border border-navy-line",
            def.required ? "text-teal border-teal-dim" : section.visible ? "text-v2-muted" : "text-v2-muted-2",
          )}
        >
          {def.label}
          {def.required && " · required"}
          {!section.visible && " · hidden"}
        </div>

        {/* Controls top-right */}
        <div className="absolute -top-3 right-2 flex items-center gap-1 z-10">
          <div className="w-7 h-7 rounded-[8px] bg-navy-card-2 border border-navy-line text-v2-muted flex items-center justify-center cursor-grab active:cursor-grabbing">
            <GripVertical size={13} />
          </div>
          <div className="flex items-center bg-navy-card-2 border border-navy-line rounded-full p-0.5 gap-0.5">
            {!def.required && (
              <IconBtn
                title={section.visible ? "Hide" : "Show"}
                onClick={onToggle}
                active={section.visible}
              >
                {section.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </IconBtn>
            )}
            {def.required && (
              <IconBtn title="Required" disabled>
                <Lock size={12} />
              </IconBtn>
            )}
            {!def.required && (
              <IconBtn title="Remove" onClick={onRemove} danger>
                <Trash2 size={12} />
              </IconBtn>
            )}
          </div>
        </div>

        {/* Actual section content */}
        <div className="pointer-events-none">{children}</div>
      </div>
      {/* Bottom add slot for the last entry; others will be added_above of the next */}
      {/* consumer passes onAddBelow only for the final index */}
      {/* rendered by parent via AddSlot at end */}
      {/* keep unused prop satisfied */}
      {false && <span onClick={onAddBelow} />}
    </>
  );
}

function AddSlot({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="mx-5 h-6 flex items-center justify-center opacity-30 hover:opacity-100 cursor-pointer"
    >
      <div className="flex-1 border-t border-dashed border-teal" />
      <div className="mx-2 w-6 h-6 rounded-full bg-teal text-navy-deep flex items-center justify-center font-black text-[14px]">+</div>
      <div className="flex-1 border-t border-dashed border-teal" />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
  danger,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
        active && "text-teal",
        danger && "hover:text-danger",
        !active && !danger && "text-v2-muted",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

function countRemaining(current: LayoutSection[]): number {
  const currentIds = new Set(current.map((s) => s.id));
  return (Object.keys(SECTION_DEFS) as SectionId[]).filter((id) => !currentIds.has(id) && SECTION_DEFS[id].catalog).length;
}

/* ---------- Library sheet ---------- */

interface LibrarySheetProps {
  existingIds: Set<SectionId>;
  onClose: () => void;
  onAdd: (id: SectionId) => void;
}

function LibrarySheet({ existingIds, onClose, onAdd }: LibrarySheetProps) {
  const groups = [
    { key: "popular" as const, label: "POPULAR · coaches use these" },
    { key: "grow" as const, label: "GROW YOUR BUSINESS" },
  ];

  const byGroup = groups.map((g) => ({
    ...g,
    items: (Object.keys(SECTION_DEFS) as SectionId[])
      .map((id) => SECTION_DEFS[id])
      .filter((def) => def.catalog?.group === g.key),
  }));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Add a section"
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[20px] bg-navy-deep border-t border-navy-line max-h-[80vh] overflow-y-auto"
      >
        <div className="w-10 h-1 rounded-full bg-navy-line mx-auto mt-2.5 mb-1" />
        <div className="flex justify-between items-center px-5 py-3 border-b border-navy-line">
          <h3 className="text-[17px] font-extrabold tracking-tight">Add a section</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-navy-card text-offwhite flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="text-[12px] text-v2-muted mb-3 leading-snug">
            Pick a section to add. You can reorder or remove them anytime.
          </div>

          {byGroup.map((g) => (
            <div key={g.key} className="mb-4">
              <div className="text-[10px] text-v2-muted font-bold uppercase tracking-widest mb-2">
                {g.label}
              </div>
              <div className="flex flex-col gap-1.5">
                {g.items.map((def) => {
                  const already = existingIds.has(def.id);
                  const Icon = def.catalog ? CATALOG_ICON_MAP[def.catalog.iconKey] : Plus;
                  return (
                    <button
                      key={def.id}
                      disabled={already}
                      onClick={() => onAdd(def.id)}
                      className={cn(
                        "p-3 rounded-[14px] bg-navy-card border border-transparent flex items-center gap-3 text-left",
                        already ? "opacity-50 cursor-not-allowed" : "hover:border-teal-dim",
                      )}
                    >
                      <div className="w-10 h-10 rounded-[10px] bg-teal-dim text-teal flex items-center justify-center shrink-0">
                        <Icon size={16} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold truncate flex items-center gap-1.5">
                          {def.label}
                          {def.catalog?.pro && (
                            <span className="text-[9px] bg-orange-dim text-orange px-1.5 py-0.5 rounded font-extrabold tracking-wider">
                              PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-v2-muted mt-0.5 leading-snug">
                          {def.catalog?.description}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-[14px]",
                          already ? "bg-navy-card-2 text-v2-muted" : "bg-teal text-navy-deep",
                        )}
                      >
                        {already ? "✓" : "+"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
