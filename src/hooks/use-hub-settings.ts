import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PinnedItem {
  id: string;
  type: "video" | "post" | "link";
  title: string;
  url: string;
  thumbnail?: string;
}

export interface HubSettings {
  id: string;
  coach_id: string;
  theme_preset: string;
  layout_style: string;
  cover_style: string;
  accent_color: string | null;
  pinned_items: PinnedItem[];
  announcement: string;
  announcement_active: boolean;
  tab_order: string[];
  figure_url: string | null;
}

const DEFAULT_SETTINGS: Omit<HubSettings, "id" | "coach_id"> = {
  theme_preset: "default",
  layout_style: "default",
  cover_style: "gradient",
  accent_color: null,
  pinned_items: [],
  announcement: "",
  announcement_active: false,
  tab_order: ["videos", "schedule", "packages", "reviews", "community"],
  figure_url: null,
};

export const THEME_PRESETS = [
  { id: "default",  label: "Default",  colors: { bg: "#0D0D14", accent: "#00D4AA", card: "#16161F" } },
  { id: "ocean",    label: "Ocean",    colors: { bg: "#0A1628", accent: "#3B82F6", card: "#111D33" } },
  { id: "sunset",   label: "Sunset",   colors: { bg: "#1A0F0A", accent: "#FF6B2C", card: "#241710" } },
  { id: "neon",     label: "Neon",     colors: { bg: "#0A0A14", accent: "#A855F7", card: "#14141F" } },
  { id: "forest",   label: "Forest",   colors: { bg: "#0A140A", accent: "#22C55E", card: "#0F1F0F" } },
  { id: "midnight", label: "Midnight", colors: { bg: "#0F0F1A", accent: "#6366F1", card: "#161628" } },
  { id: "rose",     label: "Rosé",     colors: { bg: "#1A0F14", accent: "#F43F5E", card: "#24141A" } },
  { id: "minimal",  label: "Minimal",  colors: { bg: "#FAFAFA", accent: "#18181B", card: "#FFFFFF" } },
];

export const LAYOUT_STYLES = [
  { id: "default",      label: "Classic",       description: "Standard profile layout" },
  { id: "grid",          label: "Grid Hub",      description: "Content-first grid layout" },
  { id: "magazine",      label: "Magazine",      description: "Editorial style" },
  { id: "minimal-card",  label: "Minimal Card",  description: "Clean and minimal" },
];

export const COVER_STYLES = [
  { id: "gradient",      label: "Gradient",      description: "Color gradient overlay" },
  { id: "photo-overlay", label: "Photo Overlay", description: "Blurred photo background" },
  { id: "split",         label: "Split",         description: "Half photo, half info" },
  { id: "minimal",       label: "Minimal",       description: "Small header, more content" },
];

export function useHubSettings(coachId?: string) {
  const [settings, setSettings] = useState<HubSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSettings = useCallback(async () => {
    if (!coachId) { setLoading(false); return; }
    setLoading(true);
    
    const { data, error } = await (supabase as any)
      .from("coach_hub_settings")
      .select("*")
      .eq("coach_id", coachId)
      .maybeSingle();
    
    if (data) {
      const d = data as any;
      setSettings({
        id: d.id,
        coach_id: d.coach_id,
        theme_preset: d.theme_preset || "default",
        layout_style: d.layout_style || "default",
        cover_style: d.cover_style || "gradient",
        accent_color: d.accent_color || null,
        pinned_items: Array.isArray(d.pinned_items) ? d.pinned_items : [],
        announcement: d.announcement || "",
        announcement_active: d.announcement_active || false,
        tab_order: Array.isArray(d.tab_order) ? d.tab_order : DEFAULT_SETTINGS.tab_order,
        figure_url: d.figure_url || null,
      });
    } else {
      setSettings(null);
    }
    setLoading(false);
  }, [coachId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = useCallback(async (updates: Partial<Omit<HubSettings, "id" | "coach_id">>) => {
    if (!coachId || !user) return;
    
    if (settings) {
      const { error } = await (supabase as any)
        .from("coach_hub_settings" as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("coach_id", coachId);
      
      if (error) { toast.error("Failed to save settings"); return; }
      setSettings(prev => prev ? { ...prev, ...updates } : prev);
    } else {
      const { data: newData, error } = await (supabase as any)
        .from("coach_hub_settings")
        .insert({ coach_id: coachId, ...DEFAULT_SETTINGS, ...updates })
        .select()
        .single();
      
      if (error) { toast.error("Failed to save settings"); return; }
      if (newData) {
        const d = newData as any;
        setSettings({
          id: d.id,
          coach_id: d.coach_id,
          theme_preset: d.theme_preset || "default",
          layout_style: d.layout_style || "default",
          cover_style: d.cover_style || "gradient",
          accent_color: d.accent_color || null,
          pinned_items: Array.isArray(d.pinned_items) ? d.pinned_items : [],
          announcement: d.announcement || "",
          announcement_active: d.announcement_active || false,
          tab_order: Array.isArray(d.tab_order) ? d.tab_order : DEFAULT_SETTINGS.tab_order,
          figure_url: d.figure_url || null,
        });
      }
    }
    toast.success("Hub settings saved!");
  }, [coachId, user, settings]);

  const resolvedSettings = settings || {
    ...DEFAULT_SETTINGS,
    id: "",
    coach_id: coachId || "",
  };

  return { settings: resolvedSettings, loading, saveSettings, refresh: fetchSettings };
}

export function getThemeColors(presetId: string, accentOverride?: string | null) {
  const preset = THEME_PRESETS.find(t => t.id === presetId) || THEME_PRESETS[0];
  return {
    ...preset.colors,
    accent: accentOverride || preset.colors.accent,
  };
}
