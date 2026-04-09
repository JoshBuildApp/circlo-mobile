import { useState } from "react";
import {
  Plus, Trash2, Edit2, User, Users, Check, X,
  Dumbbell, MapPin, Clock, DollarSign, StickyNote, ToggleLeft, ToggleRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTrainingTemplates, type TrainingTemplate } from "@/hooks/use-training-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TrainingLibraryProps {
  coachProfileId: string;
}

const TYPE_OPTIONS = [
  { value: "personal", label: "Personal", icon: User, desc: "1-on-1" },
  { value: "small_group", label: "Small Group", icon: Users, desc: "2–4" },
  { value: "group", label: "Group", icon: Users, desc: "5+" },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  personal: User, small_group: Users, group: Users,
};

interface FormState {
  title: string;
  description: string;
  duration_minutes: number;
  price: number;
  location: string;
  max_participants: number;
  training_type: string;
  notes: string;
}

const emptyForm: FormState = {
  title: "", description: "", duration_minutes: 60, price: 50,
  location: "", max_participants: 1, training_type: "personal", notes: "",
};

const TrainingLibrary = ({ coachProfileId }: TrainingLibraryProps) => {
  const { templates, loading, refresh } = useTrainingTemplates(coachProfileId);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const startEdit = (t: TrainingTemplate) => {
    setEditingId(t.id);
    setCreating(false);
    setForm({
      title: t.title, description: t.description || "",
      duration_minutes: t.duration_minutes, price: t.price,
      location: t.location || "", max_participants: t.max_participants,
      training_type: t.training_type, notes: t.notes || "",
    });
  };

  const cancel = () => { setCreating(false); setEditingId(null); setForm(emptyForm); };

  const handleTypeChange = (type: string) => {
    set("training_type", type);
    if (type === "personal") set("max_participants", 1);
    else if (type === "small_group") set("max_participants", 4);
    else set("max_participants", 10);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const payload = {
      coach_id: coachProfileId,
      title: form.title.trim(),
      description: form.description.trim(),
      duration_minutes: form.duration_minutes,
      price: form.price,
      location: form.location.trim(),
      max_participants: form.max_participants,
      training_type: form.training_type,
      notes: form.notes.trim(),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("training_templates").update(payload as any).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("training_templates").insert(payload as any));
    }
    setSaving(false);
    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success(editingId ? "Training updated" : "Training created!");
      cancel();
      refresh();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("training_templates").delete().eq("id", id);
    toast.success("Training deleted");
    refresh();
  };

  const handleToggle = async (t: TrainingTemplate) => {
    await supabase.from("training_templates").update({ is_active: !t.is_active } as any).eq("id", t.id);
    toast.success(t.is_active ? "Training deactivated" : "Training activated");
    refresh();
  };

  const isFormOpen = creating || editingId !== null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">My Trainings</h2>
            <p className="text-[11px] text-muted-foreground">Define your training types & pricing</p>
          </div>
        </div>
        {!isFormOpen && (
          <Button size="sm" onClick={() => { setCreating(true); setForm(emptyForm); }} className="gap-1.5 rounded-xl h-9">
            <Plus className="h-3.5 w-3.5" /> New Training
          </Button>
        )}
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-secondary/50 rounded-2xl border border-border/50 p-5 space-y-4 animate-fade-in">
          <p className="text-sm font-heading font-semibold text-foreground">
            {editingId ? "Edit Training" : "New Training"}
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title *</label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. 1 on 1 Training" className="rounded-xl h-11" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="What's included in this training..." rows={2} className="rounded-xl resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
                <Select value={form.training_type} onValueChange={handleTypeChange}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label} ({t.desc})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Participants</label>
                <Input type="number" min={1} max={50} value={form.max_participants}
                  onChange={(e) => set("max_participants", parseInt(e.target.value) || 1)} className="rounded-xl h-11" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price (₪)</label>
                <Input type="number" min={0} value={form.price}
                  onChange={(e) => set("price", parseInt(e.target.value) || 0)} className="rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Duration (min)</label>
                <Input type="number" min={15} step={15} value={form.duration_minutes}
                  onChange={(e) => set("duration_minutes", parseInt(e.target.value) || 60)} className="rounded-xl h-11" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</label>
              <Input value={form.location} onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Park HaYarkon, Tel Aviv" className="rounded-xl h-11" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                placeholder="Bring water, comfortable shoes…" rows={2} className="rounded-xl resize-none" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={cancel} className="rounded-xl h-9">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-xl h-9 px-5">
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      {/* Template List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No trainings yet. Create your first one!
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            const Icon = TYPE_ICONS[t.training_type] || User;
            return (
              <div key={t.id} className={cn(
                "rounded-xl border p-4 transition-all group",
                t.is_active ? "bg-card border-border/50" : "bg-secondary/30 border-border/20 opacity-60"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      t.is_active ? "bg-primary/10" : "bg-secondary"
                    )}>
                      <Icon className={cn("h-5 w-5", t.is_active ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <h3 className={cn("font-heading font-semibold text-sm", !t.is_active && "line-through text-muted-foreground")}>
                        {t.title}
                      </h3>
                      {t.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />₪{t.price}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.duration_minutes}min</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t.max_participants} max</span>
                        {t.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.location}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(t)} className="p-1.5 transition-colors" title={t.is_active ? "Deactivate" : "Activate"}>
                      {t.is_active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <button onClick={() => startEdit(t)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrainingLibrary;
