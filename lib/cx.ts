/** Joins truthy class names. Deliberately tiny; components avoid conflicting utilities instead of merging. */
export function cx(...parts: (string | false | null | undefined | 0)[]): string {
  return parts.filter(Boolean).join(' ')
}
