/**
 * Domain types derived from professional-electives-openapi-v0.1.yaml (base path /api/v1).
 * Only the subset needed by the current foundation is modeled. Extend as endpoints
 * are wired. Keep names aligned with the OpenAPI component schemas.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN";
export type AdminRole = "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type AcademicShift = "DAY" | "NIGHT";
export type SemesterStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type ResourceStatus = "ACTIVE" | "INACTIVE" | "CLOSED";

export type PriorityGroup =
  | "DIRECT_SAME_SHIFT"
  | "WAITLIST_SAME_SHIFT"
  | "WAITLIST_OPPOSITE_SHIFT";

export type EnrollmentRequestStatus =
  | "SUBMITTED"
  | "PENDING_REVIEW"
  | "WAITLIST_SAME_SHIFT"
  | "WAITLIST_OPPOSITE_SHIFT"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED_BY_STUDENT"
  | "CANCELLED_BY_ADMIN";

export type EnrollmentDecisionType =
  | "ACCEPT"
  | "REJECT"
  | "ADMIN_CANCEL"
  | "MOVE_TO_REVIEW"
  | "CREATE_GROUP_ACCEPTANCE"
  | "CAPACITY_ADJUSTMENT_ACCEPTANCE";

export type NotificationType =
  | "REQUEST_SUBMITTED"
  | "REQUEST_CANCELLED_BY_STUDENT"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "REQUEST_CANCELLED_BY_ADMIN"
  | "REPORT_READY"
  | "REPORT_FAILED"
  | "WINDOW_OPEN"
  | "WINDOW_CLOSING_SOON";

// ---------------------------------------------------------------------------
// Error envelope
// ---------------------------------------------------------------------------

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  traceId: string;
}

// ---------------------------------------------------------------------------
// Auth / identity
// ---------------------------------------------------------------------------

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  studentId?: string | null;
  adminUserId?: string | null;
  /** Per-session CSRF token; present on the /me response. */
  csrfToken?: string;
}

export interface AuthSession {
  user: CurrentUser;
  /** Per-session CSRF token; sent back as X-CSRF-Token on state-changing calls. */
  csrfToken?: string;
}

export interface StartLoginRequest {
  email: string;
}

export interface StartLoginResponse {
  delivery: "EMAIL_SENT";
  expiresInSeconds?: number;
}

export interface VerifyLoginRequest {
  email: string;
  code: string;
}

// ---------------------------------------------------------------------------
// Academic structure
// ---------------------------------------------------------------------------

export interface Student {
  id: string;
  institutionalEmail: string;
  documentNumber: string;
  fullName: string;
  academicShift: AcademicShift;
  status: UserStatus;
  completedProfessionalElectivesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  id: string;
  code: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: SemesterStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Elective {
  id: string;
  name: string;
  area: string;
  description?: string | null;
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OfferingPrerequisite {
  id: string;
  offeringId: string;
  prerequisiteId?: string | null;
  name: string;
  description: string;
  planType?: string | null;
  source: "ELECTIVE_DEFAULT" | "OFFERING_SPECIFIC";
  status: ResourceStatus;
}

export interface OfferingGroup {
  id: string;
  offeringId: string;
  groupCode: string;
  shift: AcademicShift;
  teacherName?: string | null;
  scheduleText: string;
  capacity: number;
  acceptedCount?: number;
  pendingDirectCount?: number;
  waitlistSameShiftCount?: number;
  waitlistOppositeShiftCount?: number;
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OfferingGroupSummary {
  id: string;
  groupCode: string;
  shift: AcademicShift;
  scheduleText: string;
  capacity: number;
  acceptedCount: number;
  status: ResourceStatus;
  /** Not part of the summary contract, but rendered when the backend includes it. */
  teacherName?: string | null;
}

export interface ElectiveOfferingSummary {
  id: string;
  semesterId: string;
  elective: Elective;
  groups: OfferingGroupSummary[];
}

export interface ElectiveOfferingDetail {
  id: string;
  semesterId: string;
  elective: Elective;
  prerequisites: OfferingPrerequisite[];
  groups: OfferingGroup[];
}

// ---------------------------------------------------------------------------
// Enrollment windows
// ---------------------------------------------------------------------------

export interface EnrollmentWindow {
  id: string;
  semesterId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  targetShift?: AcademicShift | null;
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
}

/** Response of GET /enrollment-windows. */
export interface EnrollmentWindowsPage {
  items: EnrollmentWindow[];
}

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------

export interface SubmitEnrollmentBatchRequest {
  semesterId: string;
  items: Array<{ offeringGroupId: string }>;
}

/** Response of POST /enrollment-requests/batch. */
export interface EnrollmentRequestBatchResult {
  items: EnrollmentRequest[];
}

export interface EnrollmentRequest {
  id: string;
  semesterId: string;
  studentId: string;
  offeringId: string;
  offeringGroupId: string;
  enrollmentWindowId?: string;
  studentShift?: AcademicShift;
  offeringShift?: AcademicShift;
  priorityGroup: PriorityGroup;
  status: EnrollmentRequestStatus;
  arrivalSequence: number;
  submittedAt: string;
  cancelledAt?: string | null;
  latestReason?: string | null;
}

export interface EnrollmentDecision {
  id: string;
  enrollmentRequestId: string;
  adminUserId: string;
  decisionType: EnrollmentDecisionType;
  previousStatus: EnrollmentRequestStatus;
  newStatus: EnrollmentRequestStatus;
  reason: string;
  createdAt: string;
}

export interface CreateEnrollmentDecisionRequest {
  decisionType: EnrollmentDecisionType;
  reason: string;
}

/** Response of POST /admin/enrollment-requests/{requestId}/decisions. */
export interface EnrollmentDecisionResult {
  request: EnrollmentRequest;
  decision: EnrollmentDecision;
}

// ---------------------------------------------------------------------------
// Admin review queue
// ---------------------------------------------------------------------------

export interface AdminReviewQueueItem {
  request: EnrollmentRequest;
  student: Student;
  offering: ElectiveOfferingSummary;
  group: OfferingGroup;
  warnings?: string[];
}

export interface AdminReviewQueuePage {
  items: AdminReviewQueueItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

/** Response of GET /notifications. */
export interface NotificationsPage {
  items: Notification[];
  page: number;
  pageSize: number;
  total: number;
  unread: number;
}
