import { z } from "zod";

/**
 * Runtime schemas for the auth/identity payloads, colocated with the auth api
 * module. Mirror the TypeScript shapes in `@/shared/api/types` (CurrentUser,
 * AuthSession) so a drifted backend contract is caught at the network seam.
 */
export const userRoleSchema = z.enum(["STUDENT", "ADMIN", "SUPER_ADMIN"]);

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string(),
  role: userRoleSchema,
  studentId: z.string().nullish(),
  adminUserId: z.string().nullish(),
  csrfToken: z.string().optional(),
});

/** Envelope returned by `GET /me` and `POST /auth/login/verify`. */
export const authSessionSchema = z.object({
  user: currentUserSchema,
  csrfToken: z.string().optional(),
});

export type MeResponse = z.infer<typeof authSessionSchema>;
