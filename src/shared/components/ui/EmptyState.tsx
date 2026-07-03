import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { FadeIn } from "./FadeIn";
import { Icon, type IconName } from "./Icon";

export interface EmptyStateProps {
  /** Decorative icon (aria-hidden) — meaning is carried by the title/description text. */
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * No-data / restricted state (FR-004). Renders on the frosted monochrome card
 * surface — no saturated fill; icon is decorative, title/description carry
 * the meaning (CC-A11Y: no color-only meaning). The card enters via `FadeIn`
 * (FR-006): a subtle opacity+drift transition, reduced-motion aware, that
 * never blocks the action button from being clicked immediately.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <FadeIn
      className={cn(
        "surface-frosted flex flex-col items-center gap-3 rounded-[30px] p-8 text-center",
        className,
      )}
    >
      {icon ? <Icon name={icon} size="lg" className="text-slate" /> : null}
      <p className="text-subheading font-medium text-ink-black">{title}</p>
      {description ? (
        <p className="text-body-sm text-graphite">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </FadeIn>
  );
}
