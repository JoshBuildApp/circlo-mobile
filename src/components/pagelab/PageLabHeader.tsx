import { Save, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PageLabHeaderProps {
  onClose: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

const PageLabHeader = ({ onClose, onSave, saving }: PageLabHeaderProps) => {
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-shrink-0 border-b border-border/5 bg-card/80 backdrop-blur-xl safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          className="h-9 w-9 rounded-full bg-secondary/60 flex items-center justify-center text-muted-foreground active:scale-90 transition-all duration-200 hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <h1 className="font-heading text-base font-bold text-foreground tracking-tight">
            Page Lab
          </h1>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full font-heading font-bold text-xs px-5 h-9 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
        >
          {saving ? (
            <div className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <span className="animate-scale-in">Saved</span>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </>
          )}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground/60 px-4 pb-2.5 text-center tracking-wide">
        Build your profile · Drag to reorder · Make it yours
      </p>
    </div>
  );
};

export default PageLabHeader;
