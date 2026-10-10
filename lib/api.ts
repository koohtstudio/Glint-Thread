import type { ZodError } from 'zod'

/** Small helpers for JSON route handlers. */
export function jsonError(
  error: string,
  message: string,
  status: number,
  extra: Record<string, unknown> = {},
) {
  return Response.json(
    { error, message, ...extra },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}

/** Zod issues to `{ field: message }` (first message per top-level field) for inline form errors. */
export function zodFields(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_'
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

export function noStore<T>(body: T, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}
