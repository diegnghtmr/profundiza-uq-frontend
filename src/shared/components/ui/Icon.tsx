import type { LucideIcon } from "lucide-react";
import {
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Menu,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Settings,
  LogOut,
  User,
  FileText,
  Calendar,
  Filter,
  Download,
  ArrowLeft,
  Loader2,
} from "lucide-react";

// Closed, curated registry of NAMED lucide-react imports (ADR-004). Each entry
// pulls in exactly the icon it needs, so bundlers can tree-shake every icon
// NOT referenced here. Adding an icon means: 1) add a named import above,
// 2) add one entry below. Never replace this with a dynamic lookup against
// the full `lucide-react` barrel (e.g. `import * as icons from "lucide-react"`
// then `icons[name]`) — that forces the bundler to keep every icon in the
// package reachable and defeats tree-shaking entirely.
const REGISTRY = {
  check: Check,
  close: X,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  search: Search,
  bell: Bell,
  menu: Menu,
  "alert-triangle": AlertTriangle,
  info: Info,
  plus: Plus,
  trash: Trash2,
  settings: Settings,
  "log-out": LogOut,
  user: User,
  "file-text": FileText,
  calendar: Calendar,
  filter: Filter,
  download: Download,
  "arrow-left": ArrowLeft,
  spinner: Loader2,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof REGISTRY;

const SIZE = { sm: 14, md: 18, lg: 24 } as const; // md=18 matches the text-subheading rhythm

export type IconSize = keyof typeof SIZE;

interface IconBase {
  name: IconName;
  size?: IconSize;
  className?: string;
  strokeWidth?: number;
}

export type IconProps = IconBase & ({ label: string } | { label?: undefined });

/**
 * Single entry point for every icon in the app (FR-001). Decorative by
 * default (`aria-hidden`, no accessible name); pass `label` for a meaningful
 * icon (e.g. an icon-only button) to expose an accessible name instead.
 */
export function Icon({
  name,
  size = "md",
  className,
  strokeWidth = 1.5,
  label,
}: IconProps) {
  const LucideComponent = REGISTRY[name];

  if (label) {
    return (
      <LucideComponent
        size={SIZE[size]}
        strokeWidth={strokeWidth}
        className={className}
        role="img"
        aria-label={label}
      />
    );
  }

  return (
    <LucideComponent
      size={SIZE[size]}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    />
  );
}
