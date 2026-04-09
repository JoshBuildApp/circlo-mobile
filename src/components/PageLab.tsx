import { useState, useCallback } from "react";
import { Plus, LayoutGrid } from "lucide-react";
import { PageSection, SECTION_OPTIONS, usePageSections } from "@/hooks/use-page-sections";
import { Button } from "@/components/ui/button";
import PageLabHeader from "./pagelab/PageLabHeader";
import PageLabSectionCard from "./pagelab/PageLabSectionCard";
import PageLabAddDialog from "./pagelab/PageLabAddDialog";
import PageLabTemplates from "./pagelab/PageLabTemplates";
import PageLabPreview from "./pagelab/PageLabPreview";

interface PageLabProps {
  coachId: string;
  onClose: () => void;
}

const PageLab = ({ coachId, onClose }: PageLabProps) => {
  const { sections, saveSections, loading } = usePageSections(coachId);
  const [localSections, setLocalSections] = useState<PageSection[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!initialized && !loading && sections.length > 0) {
    setLocalSections([...sections]);
    setInitialized(true);
  }

  const moveSection = useCallback((index: number, direction: -1 | 1) => {
    const target = index + direction;
    setLocalSections((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated.map((s, i) => ({ ...s, position: i }));
    });
  }, []);

  const toggleVisibility = useCallback((index: number) => {
    setLocalSections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], is_visible: !updated[index].is_visible };
      return updated;
    });
  }, []);

  const removeSection = useCallback((index: number) => {
    setLocalSections((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateLayout = useCallback((index: number, layout: string) => {
    setLocalSections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], layout_size: layout };
      return updated;
    });
  }, []);

  const updateConfig = useCallback((index: number, config: Record<string, unknown>) => {
    setLocalSections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], config };
      return updated;
    });
  }, []);

  const addSection = useCallback((type: string) => {
    const option = SECTION_OPTIONS.find((o) => o.type === type);
    if (!option) return;
    setLocalSections((prev) => {
      if (prev.some((s) => s.section_type === type)) return prev;
      return [
        ...prev,
        {
          id: `new-${Date.now()}`,
          coach_id: coachId,
          section_type: type,
          position: prev.length,
          layout_size: "full",
          is_visible: true,
          config: {},
        },
      ];
    });
    setAddDialogOpen(false);
  }, [coachId]);

  const applyTemplate = useCallback((sections: PageSection[]) => {
    setLocalSections(sections);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveSections(localSections);
    setSaving(false);
    onClose();
  };

  // Drag handlers
  const handleDragStart = useCallback((index: number) => setDragIndex(index), []);
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setLocalSections((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, removed);
      return updated.map((s, i) => ({ ...s, position: i }));
    });
    setDragIndex(index);
  }, [dragIndex]);
  const handleDragEnd = useCallback(() => setDragIndex(null), []);

  const usedTypes = localSections.map((s) => s.section_type);

  if (loading || !initialized) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground/50 font-heading">Loading your studio…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden animate-fade-in">
      <PageLabHeader onClose={onClose} onSave={handleSave} saving={saving} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {/* Templates — always available */}
        <PageLabTemplates coachId={coachId} onApply={applyTemplate} />

        {/* Preview toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full text-[10px] uppercase tracking-wider text-muted-foreground/40 font-semibold text-center py-1 hover:text-muted-foreground/60 transition-colors"
        >
          {showPreview ? "Hide Preview" : "Show Live Preview"}
        </button>

        {showPreview && <PageLabPreview sections={localSections} />}

        {/* Empty state */}
        {localSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
            <div className="h-16 w-16 rounded-3xl bg-primary/8 flex items-center justify-center">
              <LayoutGrid className="h-8 w-8 text-primary/60" />
            </div>
            <h2 className="font-heading text-lg font-bold text-foreground">Start building your page</h2>
            <p className="text-sm text-muted-foreground/50 text-center max-w-[250px]">
              Pick a template or add sections one by one
            </p>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="rounded-full font-heading font-bold shadow-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add your first section
            </Button>
          </div>
        ) : (
          <>
            {/* Section list */}
            <div className="space-y-2">
              {localSections.map((section, index) => (
                <PageLabSectionCard
                  key={section.id}
                  section={section}
                  index={index}
                  total={localSections.length}
                  onMove={moveSection}
                  onToggleVisibility={toggleVisibility}
                  onRemove={removeSection}
                  onUpdateLayout={updateLayout}
                  onUpdateConfig={updateConfig}
                  isDragging={dragIndex === index}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>

            {/* Add section button */}
            {SECTION_OPTIONS.length > usedTypes.length && (
              <button
                onClick={() => setAddDialogOpen(true)}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/15 text-primary/60 font-heading font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-primary/3 hover:border-primary/25 hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </button>
            )}
          </>
        )}
      </div>

      <PageLabAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        usedTypes={usedTypes}
        onAdd={addSection}
      />
    </div>
  );
};

export default PageLab;
