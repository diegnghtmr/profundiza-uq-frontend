import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Frosted content card: rgba(255,255,255,0.9), backdrop-blur(24px), 30px radius,
 * the single 8px ambient shadow, no visible border. Padding is `p-8` (32px) by
 * default per the design system's spacious density.
 */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "surface-frosted rounded-[30px] p-8 text-ink-black",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-heading-sm font-medium tracking-[-0.44px] text-ink-black",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body text-graphite", className)} {...props} />;
}
