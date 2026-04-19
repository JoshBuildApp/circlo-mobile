import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PhoneFrame } from "@/components/v2/shared";
import { CirloRing, CirloRingVariant } from "./components/CirloRing";
import {
  fireLandingEffects,
  type LandingEffectHandle,
} from "./components/LandingEffects";
import { SignupProvider } from "./SignupContext";
import "./auth-shared.css";

/**
 * Shared shell for every /v2/auth/* screen.
 *
 * Responsibilities:
 *   1. Provide the dark full-screen container (via PhoneFrame) that hosts
 *      the auth flow. position: relative so the ring and landing-effect
 *      nodes are contained.
 *   2. Render ONE persistent CirloRing whose `variant` tracks the URL.
 *      Framer-motion's `layout` prop handles the FLIP interpolation between
 *      variants with a spring transition.
 *   3. On every variant change, fire the landing effects (squash, shockwaves,
 *      sparks, flash, pillar) once the ring settles at its new position.
 *   4. Render the active screen via <Outlet />. Each screen reserves vertical
 *      space for the ring using the spacer classes defined in auth.css.
 *
 * Notes on architecture:
 *   - The ring is OWNED by this layout, not by individual screens. This keeps
 *     the shared-element transition free of AnimatePresence / unmount timing
 *     gymnastics: there's only ever one ring in the tree.
 *   - Landing effects are imperative (fireLandingEffects) rather than JSX so
 *     framer-motion can drive the main interpolation while we decorate the
 *     landing moment on the DOM directly — matches the prototype's approach.
 */

function variantFromPath(pathname: string): CirloRingVariant {
  const last = pathname.split("/").filter(Boolean).pop() ?? "welcome";
  const map: Record<string, CirloRingVariant> = {
    welcome: "welcome",
    login: "login",
    role: "role",
    sports: "sports",
    credentials: "credentials",
    verify: "verify",
    success: "success",
  };
  return map[last] ?? "welcome";
}

export default function AuthLayout() {
  const location = useLocation();
  const variant = useMemo(
    () => variantFromPath(location.pathname),
    [location.pathname],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const effectHandleRef = useRef<LandingEffectHandle | null>(null);
  const prevVariantRef = useRef<CirloRingVariant | null>(null);
  const isFirstMountRef = useRef(true);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The C-collapse animation on /success is gated on ringOpening. It flips
  // true 700ms after the ring finishes its layout animation — the same beat
  // the prototype uses, giving the landing effects time to bloom before the
  // stroke starts retracting.
  const [ringOpening, setRingOpening] = useState(false);

  // Fires after the ring's framer-motion layout animation settles. On the
  // first mount we skip effects (nothing to "land" into). On every later
  // transition we cancel any in-flight sequence and start a fresh one.
  const handleLayoutAnimationComplete = () => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevVariantRef.current = variant;
      if (variant === "success") {
        queueSuccessOpen();
      }
      return;
    }
    if (prevVariantRef.current === variant) return;
    if (!containerRef.current || !ringRef.current) return;

    effectHandleRef.current?.cancel();
    effectHandleRef.current = fireLandingEffects(
      containerRef.current,
      ringRef.current,
    );
    prevVariantRef.current = variant;

    if (variant === "success") {
      queueSuccessOpen();
    }
  };

  const queueSuccessOpen = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = setTimeout(() => setRingOpening(true), 700);
  };

  // Navigating away from /success should restore the ring to its closed form.
  useEffect(() => {
    if (variant !== "success") {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
      setRingOpening(false);
    }
  }, [variant]);

  // Guarantee we don't leave orphan DOM nodes or stray timers if the layout
  // unmounts mid-transition (e.g. user taps a deep link out of the flow).
  useEffect(
    () => () => {
      effectHandleRef.current?.cancel();
      effectHandleRef.current = null;
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    },
    [],
  );

  return (
    <SignupProvider>
      <PhoneFrame className="min-h-[100dvh]" noEntry>
        <div
          ref={containerRef}
          className="circlo-auth-surface relative flex flex-1 flex-col overflow-hidden"
          data-variant={variant}
          style={{
            minHeight: "100dvh",
            backgroundColor: "var(--v2-bg, #0A0A0F)",
          }}
        >
          <CirloRing
            ref={ringRef}
            variant={variant}
            layout
            opening={ringOpening}
            onLayoutAnimationComplete={handleLayoutAnimationComplete}
          />
          <Outlet />
        </div>
      </PhoneFrame>
    </SignupProvider>
  );
}
