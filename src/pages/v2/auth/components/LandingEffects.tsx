import "./landing-effects.css";

/**
 * Imperative orchestrator for the landing effects that fire when the shared-
 * element Circlo ring arrives at a new auth screen. Mirrors the prototype's
 * fireLandingEffects() — see prototype/auth-flow.html for the reference.
 *
 * Why imperative? The effects run once, mount a burst of short-lived DOM nodes,
 * and self-clean. Framer-motion gives us an `onLayoutAnimationComplete` hook
 * that fires outside React's render cycle; calling this directly from there is
 * far simpler than toggling state and rendering 12 sparks declaratively.
 *
 * Usage (Phase 3+):
 *   const cleanup = fireLandingEffects(phoneEl, ringEl);
 *   // optional: cleanup() on unmount to strip pending timers + orphan nodes
 *
 * Timings match the prototype exactly:
 *   680ms  ring squash-and-stretch
 *   820ms  phone shake + ripple (500ms shake, 800ms ripple)
 *   1000ms teal shockwave
 *   1200ms orange shockwave (100ms delay + 1050ms animation)
 *   750ms  flash bloom
 *   600ms  light pillar
 *   900ms  each of 12 sparks
 */

const SPARK_COLORS = [
  "#00D4AA",
  "#00D4AA",
  "#FF6B2C",
  "#FF6B2C",
  "#FFD700",
  "#FFFFFF",
];

const SPARK_COUNT = 12;

export interface LandingEffectHandle {
  /** Cancel pending timeouts and remove any spawned effect nodes still in the DOM. */
  cancel: () => void;
}

/**
 * Fire the full landing sequence. Returns a cancel handle the caller can invoke
 * on unmount to avoid stranding timers or effect nodes.
 *
 * @param container  Phone/screen element to receive particles. Must be
 *                   position: relative (or otherwise establish a containing
 *                   block for its absolutely-positioned children).
 * @param ring       Outer wrapper of the CirloRing (the div with class
 *                   `circlo-ring`). Receives the squash-and-stretch class.
 */
export function fireLandingEffects(
  container: HTMLElement,
  ring: HTMLElement,
): LandingEffectHandle {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const frames: number[] = [];
  const spawned: HTMLElement[] = [];

  const schedule = (fn: () => void, delay: number) => {
    timers.push(setTimeout(fn, delay));
  };
  const raf = (fn: () => void) => {
    frames.push(requestAnimationFrame(fn));
  };
  const spawn = (el: HTMLElement) => {
    spawned.push(el);
    container.appendChild(el);
  };

  // Landing point in container-local coordinates.
  const containerRect = container.getBoundingClientRect();
  const ringRect = ring.getBoundingClientRect();
  const cx = ringRect.left + ringRect.width / 2 - containerRect.left;
  const cy = ringRect.top + ringRect.height / 2 - containerRect.top;

  // 1. Ring squash-and-stretch.
  ring.classList.add("circlo-ring--landing-impact");
  schedule(() => ring.classList.remove("circlo-ring--landing-impact"), 680);

  // 2. Phone ripple + body shake.
  container.classList.add("circlo-landing", "circlo-landing-shake");
  schedule(
    () =>
      container.classList.remove("circlo-landing", "circlo-landing-shake"),
    820,
  );

  // 3a. Teal shockwave.
  const wave1 = document.createElement("div");
  wave1.className = "circlo-shockwave";
  wave1.style.left = `${cx}px`;
  wave1.style.top = `${cy}px`;
  spawn(wave1);
  raf(() => wave1.classList.add("circlo-fire"));
  schedule(() => wave1.remove(), 1000);

  // 3b. Orange shockwave (delayed + larger).
  const wave2 = document.createElement("div");
  wave2.className = "circlo-shockwave-2";
  wave2.style.left = `${cx}px`;
  wave2.style.top = `${cy}px`;
  spawn(wave2);
  raf(() => wave2.classList.add("circlo-fire"));
  schedule(() => wave2.remove(), 1200);

  // 4. Flash bloom.
  const flash = document.createElement("div");
  flash.className = "circlo-flash";
  flash.style.left = `${cx}px`;
  flash.style.top = `${cy}px`;
  spawn(flash);
  raf(() => flash.classList.add("circlo-fire"));
  schedule(() => flash.remove(), 750);

  // 5. Light pillar from the top of the container down to the landing point.
  const pillar = document.createElement("div");
  pillar.className = "circlo-pillar";
  pillar.style.left = `${cx}px`;
  pillar.style.top = "0";
  pillar.style.height = `${cy}px`;
  spawn(pillar);
  raf(() => pillar.classList.add("circlo-fire"));
  schedule(() => pillar.remove(), 600);

  // 6. Spark particles — 12 colored circles radiating outward.
  for (let i = 0; i < SPARK_COUNT; i++) {
    const spark = document.createElement("div");
    spark.className = "circlo-spark";
    const color = SPARK_COLORS[i % SPARK_COLORS.length];
    spark.style.left = `${cx}px`;
    spark.style.top = `${cy}px`;
    spark.style.background = color;
    spark.style.color = color;

    const angle =
      (i / SPARK_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 50 + Math.random() * 80;
    const sx = Math.cos(angle) * distance;
    const sy = Math.sin(angle) * distance;
    const size = 3 + Math.random() * 5;

    spark.style.setProperty("--circlo-spark-x", `${sx}px`);
    spark.style.setProperty("--circlo-spark-y", `${sy}px`);
    spark.style.width = `${size}px`;
    spark.style.height = `${size}px`;

    spawn(spark);
    raf(() => spark.classList.add("circlo-fire"));
    schedule(() => spark.remove(), 900);
  }

  return {
    cancel: () => {
      timers.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
      ring.classList.remove("circlo-ring--landing-impact");
      container.classList.remove("circlo-landing", "circlo-landing-shake");
      spawned.forEach((el) => el.remove());
    },
  };
}
