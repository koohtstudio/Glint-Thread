/** The first value of a Next search param (`string | string[] | undefined`). */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? ''
}
