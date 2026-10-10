/**
 * A full page load to a same-site path. Used where server state must be re-read (after signing in or out, or
 * deleting an account), which a client-side route change would not do.
 */
export function hardNavigate(path: string) {
  window.location.assign(new URL(path, window.location.origin).href)
}
