import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Sparkles } from "lucide-react";

export interface ServiceData {
  name: string;
  description: string;
  price: number | null;
  session_count: number;
  validity_days: number;
}

interface FirstServiceSetupProps {
  data: ServiceData;
  onChange: (data: ServiceData) => void;
  sessionPrice: number | null;
}

const TEMPLATES = [
  { name: "Single Session", sessions: 1, days: 30 },
  { name: "Starter Pack", sessions: 5, days: 60 },
  { name: "Monthly Plan", sessions: 10, days: 30 },
];

export function FirstServiceSetup({ data, onChange, sessionPrice }: FirstServiceSetupProps) {
  const update = (partial: Partial<ServiceData>) => {
    onChange({ ...data, ...partial });
  };

  const applyTemplate = (template: typeof TEMPLATES[number]) => {
    const suggestedPrice = sessionPrice
      ? Math.round(sessionPrice * template.sessions * (template.sessions > 1 ? 0.9 : 1))
      : null;

    update({
      name: template.name,
      session_count: template.sessions,
      validity_days: template.days,
      price: suggestedPrice ?? data.price,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Create your first service</h2>
        <p className="text-sm text-muted-foreground">
          Set up a package that trainees can purchase. You can add more later.
        </p>
      </div>

      {/* Quick templates */}
      <div>
        <Label className="text-sm text-foreground mb-2 block flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Quick start
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => applyTemplate(t)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 active:scale-95 ${
                data.name === t.name
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card hover:border-primary/40"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.sessions} session{t.sessions > 1 ? "s" : ""} / {t.days}d
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Package name */}
      <div className="space-y-2">
        <Label htmlFor="pkg-name" className="text-sm text-foreground flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" /> Package name
        </Label>
        <Input
          id="pkg-name"
          placeholder="e.g. Starter Pack"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="pkg-desc" className="text-sm text-foreground">Description (optional)</Label>
        <Textarea
          id="pkg-desc"
          placeholder="What's included in this package?"
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={2}
          className="rounded-xl bg-secondary border-border/50 focus:border-primary/50 resize-none"
        />
      </div>

      {/* Price & sessions row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="pkg-price" className="text-sm text-foreground">Total price (ILS)</Label>
          <Input
            id="pkg-price"
            type="number"
            min={0}
            placeholder="e.g. 450"
            value={data.price ?? ""}
            onChange={(e) => update({ price: e.target.value ? Number(e.target.value) : null })}
            className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-sessions" className="text-sm text-foreground">Sessions included</Label>
          <Input
            id="pkg-sessions"
            type="number"
            min={1}
            max={100}
            value={data.session_count}
            onChange={(e) => update({ session_count: Math.max(1, Number(e.target.value) || 1) })}
            className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
          />
        </div>
      </div>

      {/* Validity */}
      <div className="space-y-2">
        <Label className="text-sm text-foreground">Valid for</Label>
        <div className="flex gap-2">
          {[7, 14, 30, 60, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => update({ validity_days: days })}
              className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                data.validity_days === days
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Price per session calculation */}
      {data.price && data.session_count > 0 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-center">
          <p className="text-sm text-muted-foreground">Price per session</p>
          <p className="text-lg font-bold text-primary">
            {Math.round(data.price / data.session_count)} ILS
          </p>
        </div>
      )}
    </div>
  );
}
