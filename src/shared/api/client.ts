import type { ApiError } from "./types";

/**
 * Base URL for the backend. Same-origin "/api/v1" by default so a dev proxy or
 * reverse proxy can route without code changes. Override via VITE_API_URL.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? "/api/v1";

/**
 * CSRF token for the current session. The backend returns it in the login-verify
 * and `/me` responses and validates the `X-CSRF-Token` header on state-changing
 * requests. We hold it in a module variable (not React state) because the seam
 * that needs it is {@link fetchClient}, which runs outside the component tree.
 */
let csrfToken: string | null = null;

/** Overwrite the in-memory CSRF token (e.g. clear it on logout). */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

/** HTTP methods that the backend's CSRF middleware guards. */
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Thrown by {@link fetchClient} when the API returns a non-2xx error envelope. */
export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly traceId: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error.code;
    this.traceId = error.traceId;
    this.details = error.details;
  }
}

export interface FetchOptions extends Omit<RequestInit, "body"> {
  /** JSON-serializable request body. */
  body?: unknown;
  /** Query string parameters appended to the URL. */
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: FetchOptions["query"]): string {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Typed fetch wrapper. Always sends cookies (session auth), serializes JSON
 * bodies, and parses the {code,message,details,traceId} error envelope into an
 * {@link ApiRequestError}. This is the single seam every real query swaps onto.
 */
export async function fetchClient<TResponse>(
  path: string,
  options: FetchOptions = {},
): Promise<TResponse> {
  const { body, query, headers, ...rest } = options;

  // Attach the CSRF token on state-changing requests; the backend rejects them
  // with 403 otherwise. GET/HEAD/OPTIONS are exempt server-side.
  const method = (rest.method ?? "GET").toUpperCase();
  const csrfHeader: Record<string, string> =
    csrfToken && MUTATING_METHODS.has(method)
      ? { "X-CSRF-Token": csrfToken }
      : {};

  const response = await fetch(buildUrl(path, query), {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...csrfHeader,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const envelope: ApiError =
      isJson && payload && typeof payload === "object" && "code" in payload
        ? (payload as ApiError)
        : {
            code: "UNKNOWN",
            message:
              typeof payload === "string" && payload
                ? payload
                : response.statusText,
            traceId: "",
          };
    throw new ApiRequestError(response.status, envelope);
  }

  // Capture the rotating CSRF token whenever the backend hands one back
  // (login-verify and /me), so later mutations send it automatically.
  if (
    isJson &&
    payload &&
    typeof payload === "object" &&
    "csrfToken" in payload &&
    typeof (payload as { csrfToken: unknown }).csrfToken === "string"
  ) {
    csrfToken = (payload as { csrfToken: string }).csrfToken;
  }

  return payload as TResponse;
}
