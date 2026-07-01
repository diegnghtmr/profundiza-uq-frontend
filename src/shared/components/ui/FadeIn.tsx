import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { fadeIn, MOTION_DURATION } from "@/shared/lib/motion";

export type FadeInAs = "div" | "span" | "li" | "section" | "article";

export interface FadeInProps {
  children: ReactNode;
  /** Delay, in seconds, before the entrance transition starts. */
  delay?: number;
  className?: string;
  /** Rendered wrapper element. Defaults to `div`. */
  as?: FadeInAs;
}

const REDUCED_MOTION_VARIANTS = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
} as const;

/**
 * Subtle entrance transition (FR-006): opacity + a small upward drift driven
 * by the shared `fadeIn` motion token. Children are interactive immediately
 * — the transition only affects opacity/transform, never pointer-events, so
 * a wrapped dialog/button/link stays operable before the animation settles.
 *
 * Reduced motion (`useReducedMotion()`, backed by `matchMedia`) strips the
 * transform entirely and applies a near-instant opacity-only change — motion
 * is never forced on users who opted out (CC-A11Y, ADR-007).
 */
export function FadeIn({ children, delay = 0, className, as = "div" }: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[as];

  const variants = prefersReducedMotion
    ? {
        hidden: REDUCED_MOTION_VARIANTS.hidden,
        show: {
          ...REDUCED_MOTION_VARIANTS.show,
          transition: { duration: 0, delay },
        },
      }
    : {
        hidden: fadeIn.hidden,
        show: {
          ...fadeIn.show,
          transition: {
            duration: MOTION_DURATION.base,
            ease: fadeIn.show.transition.ease,
            delay,
          },
        },
      };

  return (
    <MotionTag
      initial="hidden"
      animate="show"
      variants={variants}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
