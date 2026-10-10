/** "Mix & Match Socks" -> "Mix & match socks"; "Earrings: Buy 2, Get 1 Free" -> "Earrings: buy 2, get 1 free". */
export function sentenceCase(s: string): string {
  const lower = s.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}
