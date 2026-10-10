/** Only same-site relative paths are allowed as a post-sign-in destination (no open redirects). Pure: client and server. */
export function safeNext(next: string | null | undefined, fallback = '/account'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\'))
    return fallback
  return next
}
