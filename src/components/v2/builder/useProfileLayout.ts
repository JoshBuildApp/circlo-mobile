import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_LAYOUT,
  SECTION_DEFS,
  type SectionId,
} from "./sectionRegistry";

/**
 * Layout state + persistence for the coach-profile builder.
 *
 * For v1 we persist to localStorage keyed by coach id. This keeps the builder
 * usable end-to-end without needing a backend migration. When we're ready,
 * swap the read/write functions below for a Supabase table (a JSONB column
 * on coach_profiles, most likely) — the rest of the builder stays identical.
 */

export interface LayoutSection {
  id: SectionId;
  visible: boolean;
}

export interface LayoutState {
  /** The saved (published) layout — what non-owner viewers see. */
  saved: LayoutSection[];
  /** The draft the owner is currently editing. Equals `saved` when not editing. */
  draft: LayoutSection[];
  /** True when there are unsaved draft edits. */
  dirty: boolean;
}

function storageKey(coachId: string) {
  return `circlo:v2_coach_profile_layout:${coachId}`;
}

function readSaved(coachId: string): LayoutSection[] {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = window.localStorage.getItem(storageKey(coachId));
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT;
    // Filter to known sections so a stale flag can't break the UI after we
    // rename/retire a section id.
    const filtered = parsed.filter(
      (s): s is LayoutSection =>
        s &&
        typeof s === "object" &&
        typeof (s as LayoutSection).id === "string" &&
        typeof (s as LayoutSection).visible === "boolean" &&
        (s as LayoutSection).id in SECTION_DEFS,
    );
    return filtered.length > 0 ? filtered : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function writeSaved(coachId: string, layout: LayoutSection[]) {
  try {
    window.localStorage.setItem(storageKey(coachId), JSON.stringify(layout));
  } catch {
    /* storage unavailable — ignore */
  }
}

export interface UseProfileLayoutOpts {
  coachId: string;
}

export interface UseProfileLayoutReturn extends LayoutState {
  /** Toggle a section's visibility in the draft. No-op on required sections. */
  toggleVisibility: (id: SectionId) => void;
  /** Remove a section from the draft. No-op on required sections. */
  removeSection: (id: SectionId) => void;
  /** Add a section to the draft at `insertIndex`, or at the end if null. */
  addSection: (id: SectionId, insertIndex?: number | null) => void;
  /** Reorder: move the section at `from` to index `to`. */
  moveSection: (from: number, to: number) => void;
  /** Persist the draft and stop editing. */
  save: () => void;
  /** Revert the draft to saved. */
  cancel: () => void;
  /** Reset to the default layout and persist. */
  reset: () => void;
}

export function useProfileLayout({ coachId }: UseProfileLayoutOpts): UseProfileLayoutReturn {
  const [saved, setSaved] = useState<LayoutSection[]>(() => readSaved(coachId));
  const [draft, setDraft] = useState<LayoutSection[]>(saved);
  const coachIdRef = useRef(coachId);

  // If the surrounding page navigates between coaches, reload from storage.
  useEffect(() => {
    if (coachIdRef.current === coachId) return;
    coachIdRef.current = coachId;
    const next = readSaved(coachId);
    setSaved(next);
    setDraft(next);
  }, [coachId]);

  const dirty = !layoutsEqual(saved, draft);

  const toggleVisibility = useCallback((id: SectionId) => {
    setDraft((prev) => {
      const def = SECTION_DEFS[id];
      if (def.required) return prev;
      return prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s));
    });
  }, []);

  const removeSection = useCallback((id: SectionId) => {
    setDraft((prev) => {
      const def = SECTION_DEFS[id];
      if (def.required) return prev;
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const addSection = useCallback((id: SectionId, insertIndex: number | null = null) => {
    setDraft((prev) => {
      if (prev.some((s) => s.id === id)) return prev;
      const next = prev.slice();
      const entry: LayoutSection = { id, visible: true };
      if (insertIndex == null || insertIndex >= next.length) next.push(entry);
      else next.splice(Math.max(0, insertIndex), 0, entry);
      return next;
    });
  }, []);

  const moveSection = useCallback((from: number, to: number) => {
    if (from === to) return;
    setDraft((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const save = useCallback(() => {
    writeSaved(coachId, draft);
    setSaved(draft);
  }, [coachId, draft]);

  const cancel = useCallback(() => setDraft(saved), [saved]);

  const reset = useCallback(() => {
    writeSaved(coachId, DEFAULT_LAYOUT);
    setSaved(DEFAULT_LAYOUT);
    setDraft(DEFAULT_LAYOUT);
  }, [coachId]);

  return { saved, draft, dirty, toggleVisibility, removeSection, addSection, moveSection, save, cancel, reset };
}

function layoutsEqual(a: LayoutSection[], b: LayoutSection[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].visible !== b[i].visible) return false;
  }
  return true;
}
