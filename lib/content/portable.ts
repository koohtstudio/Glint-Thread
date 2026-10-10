/**
 * Converts the small markdown dialect used in `content/` into Portable Text, so local mode and the
 * Sanity seed share one source and the storefront renders a single rich-text format.
 *
 * Supported: `## h2`, `### h3`, paragraphs, `- bullets`, `1. numbers`, `> callout`, `[text](href)`, `*italic*`.
 */
import type { PortableTextBlock } from '@portabletext/types'

type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type MarkDef = { _type: 'link'; _key: string; href: string }

export interface CalloutBlock {
  _type: 'callout'
  _key: string
  text: string
}

let counter = 0
const key = (prefix: string) => `${prefix}${(counter++).toString(36)}`

function parseInline(text: string, prefix: string): { children: Span[]; markDefs: MarkDef[] } {
  const children: Span[] = []
  const markDefs: MarkDef[] = []
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*([^*]+)\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last)
      children.push({
        _type: 'span',
        _key: key(prefix),
        text: text.slice(last, m.index),
        marks: [],
      })
    if (m[1] !== undefined) {
      const def: MarkDef = { _type: 'link', _key: key(`${prefix}l`), href: m[2] }
      markDefs.push(def)
      children.push({ _type: 'span', _key: key(prefix), text: m[1], marks: [def._key] })
    } else {
      children.push({ _type: 'span', _key: key(prefix), text: m[3], marks: ['em'] })
    }
    last = m.index + m[0].length
  }
  if (last < text.length)
    children.push({ _type: 'span', _key: key(prefix), text: text.slice(last), marks: [] })
  if (!children.length) children.push({ _type: 'span', _key: key(prefix), text: '', marks: [] })
  return { children, markDefs }
}

export function markdownToPortableText(source: string, keyPrefix = 'k'): PortableTextBlock[] {
  counter = 0
  const blocks: PortableTextBlock[] = []
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  let paragraph: string[] = []

  const flush = () => {
    if (!paragraph.length) return
    const { children, markDefs } = parseInline(paragraph.join(' ').trim(), keyPrefix)
    blocks.push({
      _type: 'block',
      _key: key(keyPrefix),
      style: 'normal',
      children,
      markDefs,
    } as PortableTextBlock)
    paragraph = []
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    const heading = line.match(/^(#{2,4})\s+(.*)$/)
    const bullet = line.match(/^[-*]\s+(.*)$/)
    const numbered = line.match(/^\d+\.\s+(.*)$/)
    const callout = line.match(/^>\s?(.*)$/)
    if (heading) {
      flush()
      const { children, markDefs } = parseInline(heading[2], keyPrefix)
      blocks.push({
        _type: 'block',
        _key: key(keyPrefix),
        style: `h${heading[1].length}`,
        children,
        markDefs,
      } as PortableTextBlock)
    } else if (bullet || numbered) {
      flush()
      const { children, markDefs } = parseInline((bullet ?? numbered)![1], keyPrefix)
      blocks.push({
        _type: 'block',
        _key: key(keyPrefix),
        style: 'normal',
        listItem: bullet ? 'bullet' : 'number',
        level: 1,
        children,
        markDefs,
      } as PortableTextBlock)
    } else if (callout) {
      flush()
      blocks.push({
        _type: 'callout',
        _key: key(keyPrefix),
        text: callout[1],
      } as unknown as PortableTextBlock)
    } else {
      paragraph.push(line)
    }
  }
  flush()
  return blocks
}

/** Plain text of a Portable Text array, for meta descriptions, JSON-LD and the launch check. */
export function portableTextToPlain(blocks: PortableTextBlock[] | null | undefined): string {
  if (!blocks) return ''
  return blocks
    .map((b) => {
      const block = b as unknown as { _type: string; text?: string; children?: { text?: string }[] }
      if (block._type === 'callout') return block.text ?? ''
      return (block.children ?? []).map((c) => c.text ?? '').join('')
    })
    .join('\n\n')
}
