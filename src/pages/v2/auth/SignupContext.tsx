import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type SignupRole = "player" | "coach";

export interface SignupState {
  role: SignupRole | null;
  /** Selected sport names (Set so add/remove stays O(1)). */
  sports: Set<string>;
  fullName: string;
  email: string;
  password: string;
  otp: string;
}

export interface SignupActions {
  setRole: (role: SignupRole) => void;
  toggleSport: (name: string) => void;
  setFullName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setOtp: (value: string) => void;
  /** Wipe all signup state (used by Success's "Back to start"). */
  reset: () => void;
}

type SignupContextValue = SignupState & SignupActions;

const INITIAL_STATE: SignupState = {
  role: null,
  sports: new Set<string>(),
  fullName: "",
  email: "",
  password: "",
  otp: "",
};

const SignupContext = createContext<SignupContextValue | null>(null);

/**
 * In-memory signup state shared by every /v2/auth/signup/* screen.
 *
 * Intentionally NOT persisted to localStorage: real signup wiring (Phase 14+)
 * will flush this state to Supabase on completion; partial state is disposable
 * on route exit.
 */
export function SignupProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SignupState>(INITIAL_STATE);

  const setRole = useCallback(
    (role: SignupRole) => setState((s) => ({ ...s, role })),
    [],
  );

  const toggleSport = useCallback(
    (name: string) =>
      setState((s) => {
        const next = new Set(s.sports);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return { ...s, sports: next };
      }),
    [],
  );

  const setFullName = useCallback(
    (fullName: string) => setState((s) => ({ ...s, fullName })),
    [],
  );
  const setEmail = useCallback(
    (email: string) => setState((s) => ({ ...s, email })),
    [],
  );
  const setPassword = useCallback(
    (password: string) => setState((s) => ({ ...s, password })),
    [],
  );
  const setOtp = useCallback(
    (otp: string) => setState((s) => ({ ...s, otp })),
    [],
  );
  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const value = useMemo<SignupContextValue>(
    () => ({
      ...state,
      setRole,
      toggleSport,
      setFullName,
      setEmail,
      setPassword,
      setOtp,
      reset,
    }),
    [
      state,
      setRole,
      toggleSport,
      setFullName,
      setEmail,
      setPassword,
      setOtp,
      reset,
    ],
  );

  return (
    <SignupContext.Provider value={value}>{children}</SignupContext.Provider>
  );
}

export function useSignup(): SignupContextValue {
  const ctx = useContext(SignupContext);
  if (!ctx) {
    throw new Error("useSignup must be used inside <SignupProvider>");
  }
  return ctx;
}
