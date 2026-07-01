import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Button variants per DESIGN.md. The system deliberately avoids saturated CTAs:
 * - neutral: filled #D9D9D9 pebble, hovers to ink-black/white (the "anti-CTA")
 * - ghost:   transparent pill, hover tint only — used for tabs/toggles
 * - soft:    rgba(0,0,0,0.04) fill, 16px radius — contextual/banner actions
 * - danger:  neutral surface with a subtle red border accent (gradient stop),
 *            never a saturated fill — for destructive confirm actions only
 */
export type ButtonVariant = "neutral" | "ghost" | "soft" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium select-none " +
  "transition-colors duration-200 ease-out focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ink-black/15 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  neutral:
    "bg-pebble text-ink-black/85 rounded-[30px] hover:bg-ink-black hover:text-snow",
  ghost:
    "bg-transparent text-ink-black/85 rounded-full hover:bg-ink-black/[0.04]",
  soft: "bg-ink-black/[0.04] text-ink-black/85 rounded-2xl hover:bg-ink-black/[0.08]",
  danger:
    "bg-snow text-ink-black/85 rounded-[30px] border border-spectrum-gradient/40 " +
    "hover:bg-spectrum-gradient/[0.06]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-body-sm",
  md: "h-11 px-6 text-body-sm",
  lg: "h-14 px-8 text-body",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "neutral", size = "md", className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
