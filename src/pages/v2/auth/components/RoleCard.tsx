import { ReactNode } from "react";
import { Check } from "lucide-react";

interface RoleCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Single stacked role option (Player / Coach). Behaves as a toggle button:
 * `aria-pressed` drives the selected-state CSS.
 */
export function RoleCard({
  icon,
  title,
  description,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      className="circlo-role-card"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <div className="circlo-role-icon">{icon}</div>
      <div className="circlo-role-text">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="circlo-role-check" aria-hidden="true">
        <Check size={14} strokeWidth={3.5} />
      </div>
    </button>
  );
}
