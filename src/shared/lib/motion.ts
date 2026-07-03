/**
 * Shared motion tokens (FR-006). Subtle, short transitions only — no
 * bouncy/expressive motion. `FadeIn` (PR7) and future motion-wrapped
 * components consume these instead of hand-rolled durations/eases so the
 * whole app stays consistent and easy to retune from one place.
 */
export const MOTION_DURATION = {
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
} as const;

export const MOTION_EASE = {
  standard: [0.4, 0, 0.2, 1],
  out: [0, 0, 0.2, 1],
} as const;

/**
 * Default fade-in variant: opacity + a small upward drift. Components that
 * respect `prefers-reduced-motion` (via `useReducedMotion()`) should strip
 * the `y` offset and keep only the opacity transition when reduced motion is
 * requested.
 */
export const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE.out },
  },
} as const;
