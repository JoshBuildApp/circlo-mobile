import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches runtime errors under /v2/* so a single broken child component doesn't
 * white-screen the whole app. Renders a minimal themed fallback with a reload
 * button. We log only the error name/message (not the payload) to avoid leaking
 * user data into Sentry / console.
 */
export class V2ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[v2] error boundary caught:", error.name, error.message);
    // componentStack can include prop values — only log the top frame.
    const topFrame = info.componentStack?.split("\n")[1]?.trim();
    if (topFrame) console.error("[v2] near:", topFrame);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="v2-root min-h-screen flex items-center justify-center px-8 text-center">
        <div className="max-w-xs">
          <div className="text-[44px] mb-2">⚠︎</div>
          <h1 className="text-[20px] font-extrabold tracking-tight mb-2">Something went wrong</h1>
          <p className="text-[13px] text-v2-muted mb-5">
            The screen hit an unexpected error. Reload and it should come back.
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-full bg-teal text-navy-deep font-bold text-[13px]"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
