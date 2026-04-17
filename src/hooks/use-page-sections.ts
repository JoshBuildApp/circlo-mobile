import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PageSection {
  id: string;
  coach_id: string;
  section_type: string;
  position: number;
  layout_size: string;
  is_visible: boolean;
  config: Record<string, unknown>;
}

const DEFAULT_SECTIONS: Omit<PageSection, "id" | "coach_id">[] = [
  { section_type: "media",     position: 0, layout_size: "full", is_visible: true, config: {} },
  { section_type: "about",     position: 1, layout_size: "full", is_visible: true, config: {} },
  { section_type: "reviews",   position: 2, layout_size: "full", is_visible: true, config: {} },
  { section_type: "schedule",  position: 3, layout_size: "full", is_visible: true, config: {} },
  { section_type: "packages",  position: 4, layout_size: "full", is_visible: true, config: {} },
  { section_type: "store",     position: 5, layout_size: "full", is_visible: true, config: {} },
  { section_type: "community", position: 6, layout_size: "full", is_visible: true, config: {} },
];

export const SECTION_OPTIONS = [
  { type: "media",     label: "Media",     icon: "Video",        description: "Featured clip, videos & photos" },
  { type: "about",     label: "About",     icon: "Info",         description: "Bio, specialties, credentials" },
  { type: "reviews",   label: "Reviews",   icon: "Star",         description: "Ratings & athlete feedback" },
  { type: "schedule",  label: "Schedule",  icon: "CalendarDays", description: "Availability & booking" },
  { type: "packages",  label: "Packages",  icon: "Package",      description: "Session bundles & pricing" },
  { type: "store",     label: "Store",     icon: "ShoppingBag",  description: "Products & merchandise" },
  { type: "community", label: "Community", icon: "Users",        description: "Fan discussion feed" },
];

export function usePageSections(coachId: string | undefined) {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCustomLayout, setHasCustomLayout] = useState(false);

  const loadSections = useCallback(async () => {
    if (!coachId) {
      setSections([]);
      setHasCustomLayout(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("page_sections")
      .select("*")
      .eq("coach_id", coachId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error loading sections:", error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      setSections(data.map((d: any) => ({
        id: d.id,
        coach_id: d.coach_id,
        section_type: d.section_type,
        position: d.position,
        layout_size: d.layout_size,
        is_visible: d.is_visible,
        config: (d.config as Record<string, unknown>) || {},
      })));
      setHasCustomLayout(true);
    } else {
      setSections(DEFAULT_SECTIONS.map((s, i) => ({
        ...s,
        id: `default-${i}`,
        coach_id: coachId,
      })));
      setHasCustomLayout(false);
    }

    setLoading(false);
  }, [coachId]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const saveSections = useCallback(async (newSections: PageSection[]) => {
    if (!coachId) return;

    await supabase.from("page_sections").delete().eq("coach_id", coachId);

    const inserts = newSections.map((section, index) => ({
      coach_id: coachId,
      section_type: section.section_type,
      position: index,
      layout_size: section.layout_size,
      is_visible: section.is_visible,
      config: section.config as any,
    }));

    const { error } = await supabase.from("page_sections").insert(inserts);
    if (error) {
      toast.error("Failed to save layout");
      console.error(error);
      return;
    }

    toast.success("Layout saved!");
    setHasCustomLayout(true);
    await loadSections();
  }, [coachId, loadSections]);

  return { sections, setSections, loading, hasCustomLayout, saveSections, loadSections };
}
