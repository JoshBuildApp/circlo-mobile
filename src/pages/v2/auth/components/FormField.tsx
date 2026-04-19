import { InputHTMLAttributes, ReactNode, useId } from "react";

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  /** Label shown above the input. */
  label: string;
  /** Leading lucide-react icon rendered inside the input. */
  icon: ReactNode;
  /** Trailing element (e.g. password show/hide toggle). */
  trailing?: ReactNode;
  /** Optional hint shown below the input. */
  hint?: string;
}

/**
 * Auth-flow form field: label + input wrapper with a leading icon and optional
 * trailing control. Mirrors .field / .input-wrap from prototype/auth-flow.html.
 */
export function FormField({
  label,
  icon,
  trailing,
  hint,
  id: idProp,
  ...inputProps
}: FormFieldProps) {
  const reactId = useId();
  const id = idProp ?? reactId;
  return (
    <div className="circlo-field">
      <label htmlFor={id} className="circlo-field-label">
        {label}
      </label>
      <div className="circlo-input-wrap">
        <span className="circlo-input-icon">{icon}</span>
        <input id={id} className="circlo-input" {...inputProps} />
        {trailing}
      </div>
      {hint ? <div className="circlo-field-hint">{hint}</div> : null}
    </div>
  );
}
