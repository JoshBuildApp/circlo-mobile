import { Check } from "lucide-react";

interface SportCardProps {
  emoji: string;
  name: string;
  selected: boolean;
  onToggle: () => void;
}

/**
 * 1:1 selectable tile on the Sports screen. Per-spec this is the one place
 * where emoji is acceptable in UI chrome — it's content, not iconography.
 */
export function SportCard({ emoji, name, selected, onToggle }: SportCardProps) {
  return (
    <button
      type="button"
      className="circlo-sport-card"
      aria-pressed={selected}
      onClick={onToggle}
    >
      <span className="circlo-sport-emoji" aria-hidden="true">
        {emoji}
      </span>
      <span className="circlo-sport-name">{name}</span>
      <span className="circlo-sport-check" aria-hidden="true">
        <Check size={11} strokeWidth={3.5} />
      </span>
    </button>
  );
}
