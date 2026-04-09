import { Plus } from "lucide-react";
import { SECTION_OPTIONS } from "@/hooks/use-page-sections";
import SectionIcon from "./SectionIcon";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface PageLabAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usedTypes: string[];
  onAdd: (type: string) => void;
}

const PageLabAddDialog = ({ open, onOpenChange, usedTypes, onAdd }: PageLabAddDialogProps) => {
  const available = SECTION_OPTIONS.filter((o) => !usedTypes.includes(o.type));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-border/10 shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Add Section
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/70">
            Choose a content block for your profile
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {available.map((option) => (
            <button
              key={option.type}
              onClick={() => onAdd(option.type)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/20 hover:bg-primary/8 border border-transparent hover:border-primary/15 active:scale-[0.97] transition-all duration-200 text-center group"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">
                <SectionIcon iconName={option.icon} size="lg" className="text-primary" />
              </span>
              <div>
                <p className="text-xs font-heading font-bold text-foreground">{option.label}</p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5 leading-tight">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
          {available.length === 0 && (
            <div className="col-span-2 text-sm text-muted-foreground/50 text-center py-8">
              All sections added
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PageLabAddDialog;
