import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  /** Signup step number (1-4). Omit on non-signup screens (Login, Welcome). */
  step?: 1 | 2 | 3 | 4;
  /** Total steps — defaults to 4 (Role/Sports/Credentials/Verify). */
  totalSteps?: number;
  /** Custom back handler. Defaults to navigate(-1). */
  onBack?: () => void;
  /** When true, hides the back button (e.g. Welcome has no back). */
  hideBack?: boolean;
}

/**
 * Universal auth-flow header: circular back button on the left, optional
 * progress bar + "N/4" counter on the right. Mirrors .page-header from
 * prototype/auth-flow.html.
 */
export function PageHeader({
  step,
  totalSteps = 4,
  onBack,
  hideBack = false,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <div className="circlo-page-header">
      {hideBack ? (
        <div style={{ width: 40, height: 40, flexShrink: 0 }} />
      ) : (
        <button
          type="button"
          className="circlo-back-btn"
          onClick={handleBack}
          aria-label="Back"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
      )}

      {step ? (
        <>
          <div className="circlo-progress-track">
            <div
              className="circlo-progress-fill"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <div className="circlo-step-count">
            {step}/{totalSteps}
          </div>
        </>
      ) : (
        <div className="circlo-page-header-spacer" />
      )}
    </div>
  );
}
