import {
  ClipboardEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";

interface OTPInputProps {
  /** Current value (length === length). */
  value: string;
  /** Fires on every change; `value` is the full string after edit. */
  onChange: (value: string) => void;
  /** Number of digits. Defaults to 6. */
  length?: number;
  /** Fires once when the user enters the last digit. */
  onComplete?: (value: string) => void;
  /** Auto-focus the first input on mount. */
  autoFocus?: boolean;
}

/**
 * 6-digit OTP entry with auto-advance + backspace-rewind. Mirrors the
 * otpInput / otpKey helpers in prototype/auth-flow.html.
 *
 *   - Typing a digit fills the current box, then focus jumps to the next.
 *   - Backspace on an empty box jumps back one and clears the previous.
 *   - Paste of `N` digits auto-populates up to N boxes and focuses the last.
 *
 * State is owned by the parent so the Verify screen can gate its CTA on a
 * full 6-digit value.
 */
export function OTPInput({
  value,
  onChange,
  length = 6,
  onComplete,
  autoFocus = false,
}: OTPInputProps) {
  const reactId = useId();
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const commit = useCallback(
    (next: string) => {
      const trimmed = next.slice(0, length);
      onChange(trimmed);
      if (trimmed.length === length) onComplete?.(trimmed);
    },
    [length, onChange, onComplete],
  );

  const handleInput = (
    index: number,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (!raw) {
      // Cleared the box — update value and stay put.
      const next = digits.slice();
      next[index] = "";
      commit(next.join(""));
      return;
    }

    const next = digits.slice();
    next[index] = raw[raw.length - 1]!;
    commit(next.join(""));

    // Advance to the next box when a digit was entered.
    refs.current[Math.min(index + 1, length - 1)]?.focus();
  };

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Rewind and clear the previous box.
      e.preventDefault();
      const next = digits.slice();
      next[index - 1] = "";
      commit(next.join(""));
      refs.current[index - 1]?.focus();
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = digits.slice();
    for (let i = 0; i < pasted.length && index + i < length; i++) {
      next[index + i] = pasted[i]!;
    }
    commit(next.join(""));
    const focusIdx = Math.min(index + pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div className="circlo-otp-row" role="group" aria-label="One-time code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          id={`${reactId}-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          className={`circlo-otp-digit ${
            digit ? "circlo-otp-digit--filled" : ""
          }`.trim()}
          value={digit}
          onChange={handleInput(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste(i)}
        />
      ))}
    </div>
  );
}
