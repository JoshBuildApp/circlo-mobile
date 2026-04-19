import { useEffect, useMemo, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PhoneFrame } from "@/components/v2/shared";
import { CirloRing, CirloRingVariant } from "./components/CirloRing";
import {
  fireLandingEffects,
  type LandingEffectHandle,
} from "./components/LandingEffects";
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

  // Fires after the ring's framer-motion layout animation settles. On the
  // first mount we skip effects (nothing to "land" into). On every later
  // transition we cancel any in-flight sequence and start a fresh one.
  const handleLayoutAnimationComplete = () => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevVariantRef.current = variant;
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
  };

  // Guarantee we don't leave orphan DOM nodes or stray timers if the layout
  // unmounts mid-transition (e.g. user taps a deep link out of the flow).
  useEffect(
    () => () => {
      effectHandleRef.current?.cancel();
      effectHandleRef.current = null;
    },
    [],
  );

  return (
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
          opening={variant === "success"}
          onLayoutAnimationComplete={handleLayoutAnimationComplete}
        />
        <Outlet />
      </div>
    </PhoneFrame>
  );
}
