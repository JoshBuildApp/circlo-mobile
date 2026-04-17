import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEVELOPER_EMAIL } from "@/config/dev";

const DEV_CODES = ["C1rcl0DevX992!", "BackupDev884!"];
const DEV_PASSWORD = "10203040302010";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000; // 60 seconds
const SESSION_TIMEOUT_MS = 10 * 60_000; // 10 minutes inactivity

interface DevGateContextType {
  /** Whether dev mode is currently unlocked */
  isDevUnlocked: boolean;
  /** Show the code input modal */
  showGate: () => void;
  /** Lock dev mode manually */
  lockDev: () => void;
  /** Whether the gate modal is open */
  gateOpen: boolean;
  setGateOpen: (v: boolean) => void;
  /** Validate a code attempt — returns true on success */
  validateCode: (code: string) => boolean;
  /** Remaining attempts before lockout */
  attemptsLeft: number;
  /** Whether currently locked out */
  isLockedOut: boolean;
  /** Whether login is in progress after code validation */
  isLoggingIn: boolean;
}

const DevGateContext = createContext<DevGateContextType>({
  isDevUnlocked: false,
  showGate: () => {},
  lockDev: () => {},
  gateOpen: false,
  setGateOpen: () => {},
  validateCode: () => false,
  attemptsLeft: MAX_ATTEMPTS,
  isLockedOut: false,
  isLoggingIn: false,
});

export const useDevGate = () => useContext(DevGateContext);

export const DevGateProvider = ({ children }: { children: ReactNode }) => {
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isLockedOut = lockedUntil !== null && Date.now() < lockedUntil;

  // Auto-lock after inactivity
  useEffect(() => {
    if (!isDevUnlocked) return;

    const onActivity = () => setLastActivity(Date.now());
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity);

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
        setIsDevUnlocked(false);
        console.log("[DevGate] Dev access auto-locked due to inactivity");
      }
    }, 30_000);

    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      clearInterval(interval);
    };
  }, [isDevUnlocked, lastActivity]);

  // Clear lockout after duration
  useEffect(() => {
    if (!lockedUntil) return;
    const remaining = lockedUntil - Date.now();
    if (remaining <= 0) {
      setLockedUntil(null);
      setAttempts(0);
      return;
    }
    const timer = setTimeout(() => {
      setLockedUntil(null);
      setAttempts(0);
    }, remaining);
    return () => clearTimeout(timer);
  }, [lockedUntil]);

  const showGate = useCallback(() => {
    if (!isLockedOut) setGateOpen(true);
  }, [isLockedOut]);

  const lockDev = useCallback(() => {
    setIsDevUnlocked(false);
    console.log("[DevGate] Dev access manually locked");
  }, []);

  const performDevLogin = useCallback(async () => {
    setIsLoggingIn(true);
    console.log("[DevGate] Signing in as developer...");

    try {
      // Sign out any existing session first
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: DEVELOPER_EMAIL,
        password: DEV_PASSWORD,
      });

      if (error) {
        console.error("[DevGate] Dev login failed:", error.message);
        setIsLoggingIn(false);
        return;
      }

      console.log("[DevGate] Dev login success — user:", data.user?.email);
      console.log("[DevGate] Session created:", !!data.session);
    } catch (err) {
      console.error("[DevGate] Dev login error:", err);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const validateCode = useCallback((code: string): boolean => {
    if (isLockedOut) return false;

    console.log("[DevGate] Dev access attempt");

    if (DEV_CODES.some(c => c.toLowerCase() === code.toLowerCase())) {
      setIsDevUnlocked(true);
      setGateOpen(false);
      setAttempts(0);
      console.log("[DevGate] Dev access granted");

      // Auto-login as developer
      performDevLogin();

      return true;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCKOUT_MS);
      setGateOpen(false);
      console.log("[DevGate] Dev access locked out after max attempts");
    }

    return false;
  }, [attempts, isLockedOut, performDevLogin]);

  return (
    <DevGateContext.Provider value={{
      isDevUnlocked,
      showGate,
      lockDev,
      gateOpen,
      setGateOpen,
      validateCode,
      attemptsLeft: MAX_ATTEMPTS - attempts,
      isLockedOut,
      isLoggingIn,
    }}>
      {children}
    </DevGateContext.Provider>
  );
};
