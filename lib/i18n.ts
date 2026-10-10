import messages from '@/messages/en-CA.json'

export type Messages = typeof messages
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends readonly unknown[]
      ? never
      : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]
export type MessageKey = Leaves<Messages>
export type MessageVars = Record<string, string | number>

export const locale = 'en-CA'

function lookup(key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in node)
      return (node as Record<string, unknown>)[part]
    return undefined
  }, messages)
}

/** Tiny translation helper: dot-path keys, `{name}` interpolation. Missing keys return the key. */
export function t(key: MessageKey, vars?: MessageVars): string {
  const value = lookup(key)
  if (typeof value !== 'string') return key
  if (!vars) return value
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

/** Raw access for list-shaped messages (for example the announcement bar). */
export function tList(key: 'announcements'): string[] {
  return messages[key]
}
