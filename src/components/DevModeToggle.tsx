import { useAuth } from "@/contexts/AuthContext";
import { Code2 } from "lucide-react";

/** Shows a small "Dev Mode" button that toggles the floating dev tools panel */
const DevModeToggle = () => {
  const { isDeveloper } = useAuth();

  if (!isDeveloper) return null;

  return (
    <button
      onClick={() => window.dispatchEvent(new Event("toggle-dev-tools"))}
      className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
    >
      <Code2 className="h-3 w-3 text-accent" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-accent select-none">
        Dev
      </span>
    </button>
  );
};

export default DevModeToggle;
