import {
  ChangeEvent,
  InputHTMLAttributes,
  useId,
  useMemo,
  useState,
} from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export interface PasswordStrength {
  /** 0 (weakest) to 4 (strongest). */
  score: 0 | 1 | 2 | 3 | 4;
}

/**
 * Score a password 0-4 using the heuristic from the prototype:
 *   +1 length >= 8
 *   +1 mix of upper + lower
 *   +1 contains a digit
 *   +1 contains a non-alphanumeric
 */
export function scorePassword(value: string): PasswordStrength["score"] {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score as PasswordStrength["score"];
}

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  label: string;
  /** When true, renders the 4-bar strength meter + "Use 8+ chars..." hint. */
  showStrength?: boolean;
  /** Override the default hint message. */
  hint?: string;
}

/**
 * Password input with a show/hide toggle. Optionally renders a 4-bar strength
 * meter below the input (Credentials screen uses this; Login doesn't).
 */
export function PasswordField({
  label,
  showStrength = false,
  hint,
  id: idProp,
  value,
  onChange,
  ...inputProps
}: PasswordFieldProps) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const [visible, setVisible] = useState(false);

  const score = useMemo(() => {
    if (!showStrength || typeof value !== "string") return 0;
    return scorePassword(value);
  }, [showStrength, value]);

  const barColor =
    score <= 1
      ? "circlo-strength-bar--weak"
      : score <= 2
        ? "circlo-strength-bar--mid"
        : "circlo-strength-bar--strong";

  const resolvedHint =
    hint ?? (showStrength ? "Use 8+ characters with a number and symbol." : undefined);

  return (
    <div className="circlo-field">
      <label htmlFor={id} className="circlo-field-label">
        {label}
      </label>
      <div className="circlo-input-wrap">
        <span className="circlo-input-icon">
          <Lock size={18} strokeWidth={2} />
        </span>
        <input
          id={id}
          type={visible ? "text" : "password"}
          className="circlo-input"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e)}
          {...inputProps}
        />
        <button
          type="button"
          className="circlo-input-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff size={18} strokeWidth={2} />
          ) : (
            <Eye size={18} strokeWidth={2} />
          )}
        </button>
      </div>

      {showStrength ? (
        <div className="circlo-strength-row" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`circlo-strength-bar ${
                i < score ? barColor : ""
              }`.trim()}
            />
          ))}
        </div>
      ) : null}

      {resolvedHint ? <div className="circlo-field-hint">{resolvedHint}</div> : null}
    </div>
  );
}
