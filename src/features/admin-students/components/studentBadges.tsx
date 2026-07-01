import { Badge } from "@/shared/components/ui";
import type { AcademicShift, UserStatus } from "@/shared/api/types";

/** Spectrum accent stops reused from the design system (see Badge.tsx). */
const SHIFT_DOT: Record<AcademicShift, string> = {
  DAY: "#ffb005",
  NIGHT: "#0358f7",
};

const SHIFT_LABEL: Record<AcademicShift, string> = {
  DAY: "Day",
  NIGHT: "Night",
};

/** Day/Night pill, matching the offering shift badge used elsewhere. */
export function ShiftBadge({ shift }: { shift: AcademicShift }) {
  return (
    <Badge tone="neutral" dotColor={SHIFT_DOT[shift]}>
      {SHIFT_LABEL[shift]}
    </Badge>
  );
}

/** Active = neutral fill + positive accent dot; Inactive = quiet. Fills stay
 *  monochrome per the badge rules — only the small dot carries color. */
export function StudentStatusBadge({ status }: { status: UserStatus }) {
  return status === "ACTIVE" ? (
    <Badge tone="neutral" dotColor="#ffb005">
      Active
    </Badge>
  ) : (
    <Badge tone="muted">Inactive</Badge>
  );
}
