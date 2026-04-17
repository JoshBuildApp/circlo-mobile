import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Layout, Image, Megaphone, Pin, GripVertical,
  X, Check, ChevronDown, Plus, Link2, Trash2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useHubSettings,
  THEME_PRESETS,
  LAYOUT_STYLES,
  COVER_STYLES,
  type PinnedItem,
} from "@/hooks/use-hub-settings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface HubSettingsEditorProps {
  coachId: string;
}

type Section = "theme" | "layout" | "cover" | "pinned" | "announcement";

const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "theme", label: "Color Theme", icon: Palette },
  { key: "layout", label: "Layout Style", icon: Layout },
  { key: "cover", label: "Cover Style", icon: Image },
  { key: "pinned", label: "Pinned Content", icon: Pin },
  { key: "announcement", label: "Announcement", icon: Megaphone },
];

export default function HubSettingsEditor({ coachId }: HubSettingsEditorProps) {
  const { settings, saveSettings } = useHubSettings(coachId);
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const [newPinTitle, setNewPinTitle] = useState("");
  const [newPinUrl, setNewPinUrl] = useState("");

  const toggle = (key: Section) => setOpenSection(prev => prev === key ? null : key);

  const addPinnedItem = () => {
    if (!newPinTitle.trim() || !newPinUrl.trim()) return;
    const newItem: PinnedItem = {
      id: crypto.randomUUID(),
      type: "link",
      title: newPinTitle.trim(),
      url: newPinUrl.trim(),
    };
    saveSettings({ pinned_items: [...(settings.pinned_items || []), newItem] });
    setNewPinTitle("");
    setNewPinUrl("");
  };

  const removePinnedItem = (id: string) => {
    saveSettings({ pinned_items: (settings.pinned_items || []).filter(p => p.id !== id) });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="h-10 px-4 rounded-full bg-primary/90 backdrop-blur-xl flex items-center justify-center gap-1.5 text-primary-foreground active:scale-95 transition-all text-xs font-heading font-bold">
          <Sparkles className="h-3.5 w-3.5" />
          Hub Settings
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background border-border">
        <SheetHeader>
          <SheetTitle className="font-heading text-lg">Hub Customization</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="rounded-2xl border border-border/30 overflow-hidden">
              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", openSection === key && "rotate-180")} />
              </button>

              <AnimatePresence>
                {openSection === key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1">
                      {/* Theme presets */}
                      {key === "theme" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-2">
                            {THEME_PRESETS.map(preset => (
                              <button
                                key={preset.id}
                                onClick={() => saveSettings({ theme_preset: preset.id })}
                                className={cn(
                                  "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all active:scale-95",
                                  settings.theme_preset === preset.id
                                    ? "border-primary bg-primary/10"
                                    : "border-border/30 hover:border-primary/40"
                                )}
                              >
                                <div className="flex gap-0.5">
                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.colors.bg }} />
                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.colors.accent }} />
                                </div>
                                <span className="text-[10px] font-medium text-foreground">{preset.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Custom accent color</Label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={settings.accent_color || "#00D4AA"}
                                onChange={(e) => saveSettings({ accent_color: e.target.value })}
                                className="w-10 h-10 rounded-xl border border-border/30 cursor-pointer"
                              />
                              <Input
                                value={settings.accent_color || ""}
                                onChange={(e) => saveSettings({ accent_color: e.target.value })}
                                placeholder="#00D4AA"
                                className="flex-1 h-10 rounded-xl bg-secondary border-border/30 text-xs"
                              />
                              {settings.accent_color && (
                                <button
                                  onClick={() => saveSettings({ accent_color: null })}
                                  className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Layout styles */}
                      {key === "layout" && (
                        <div className="grid grid-cols-2 gap-2">
                          {LAYOUT_STYLES.map(style => (
                            <button
                              key={style.id}
                              onClick={() => saveSettings({ layout_style: style.id })}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-all active:scale-95",
                                settings.layout_style === style.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border/30 hover:border-primary/40"
                              )}
                            >
                              <p className="text-sm font-semibold text-foreground">{style.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{style.description}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Cover styles */}
                      {key === "cover" && (
                        <div className="grid grid-cols-2 gap-2">
                          {COVER_STYLES.map(style => (
                            <button
                              key={style.id}
                              onClick={() => saveSettings({ cover_style: style.id })}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-all active:scale-95",
                                settings.cover_style === style.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border/30 hover:border-primary/40"
                              )}
                            >
                              <p className="text-sm font-semibold text-foreground">{style.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{style.description}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Pinned content */}
                      {key === "pinned" && (
                        <div className="space-y-3">
                          {(settings.pinned_items || []).map(item => (
                            <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border/20">
                              <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                              <Link2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{item.url}</p>
                              </div>
                              <button onClick={() => removePinnedItem(item.id)} className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <div className="space-y-2 pt-1">
                            <Input
                              placeholder="Link title"
                              value={newPinTitle}
                              onChange={(e) => setNewPinTitle(e.target.value)}
                              className="h-9 rounded-xl bg-secondary border-border/30 text-xs"
                            />
                            <div className="flex gap-2">
                              <Input
                                placeholder="https://..."
                                value={newPinUrl}
                                onChange={(e) => setNewPinUrl(e.target.value)}
                                className="flex-1 h-9 rounded-xl bg-secondary border-border/30 text-xs"
                              />
                              <button
                                onClick={addPinnedItem}
                                disabled={!newPinTitle.trim() || !newPinUrl.trim()}
                                className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-30"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Announcement */}
                      {key === "announcement" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-foreground">Show announcement</Label>
                            <Switch
                              checked={settings.announcement_active}
                              onCheckedChange={(v) => saveSettings({ announcement_active: v })}
                            />
                          </div>
                          <Textarea
                            placeholder="e.g. New group class every Friday! 🎉"
                            value={settings.announcement || ""}
                            onChange={(e) => saveSettings({ announcement: e.target.value })}
                            rows={2}
                            className="rounded-xl bg-secondary border-border/30 text-xs resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
