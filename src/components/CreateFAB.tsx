import { useEffect } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface CreateFABProps {
  hidden?: boolean;
}

const CreateFAB = ({ hidden }: CreateFABProps) => {
  const { user } = useAuth();

  if (!user || hidden) return null;

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-create-sheet"));
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "fixed z-50 right-4 bottom-[76px] h-14 w-14 rounded-full flex items-center justify-center",
        "bg-brand-gradient shadow-brand-md active:scale-90 transition-all duration-200",
        "safe-area-bottom"
      )}
      aria-label="Create content"
    >
      <Plus className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
    </button>
  );
};

export default CreateFAB;
