import { PortableText, type PortableTextComponents } from '@portabletext/react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { RichText as RichTextValue } from '@/lib/data/types'
import { cx } from '@/lib/cx'

/** Owner facts still to fill in show as `[[LIKE_THIS]]`, highlighted so they are easy to spot before launch. */
function withPlaceholders(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    const parts = children.split(/(\[\[[^\]]+\]\])/g)
    if (parts.length === 1) return children
    return parts.map((part, i) =>
      /^\[\[.*\]\]$/.test(part) ? (
        <mark
          key={i}
          className="bg-transparent text-champagne-400 underline decoration-dotted underline-offset-4"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }
  if (Array.isArray(children))
    return children.map((c, i) => <span key={i}>{withPlaceholders(c)}</span>)
  return children
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{withPlaceholders(children)}</p>,
    h2: ({ children }) => <h2 className="t-h3 mt-14 mb-5 text-bone-50 first:mt-0">{children}</h2>,
    h3: ({ children }) => (
      <h3 className="mt-10 mb-3 text-[19px] leading-snug font-medium text-bone-50">{children}</h3>
    ),
    h4: ({ children }) => <h4 className="eyebrow mt-8 mb-3">{children}</h4>,
    blockquote: ({ children }) => (
      <blockquote className="border-l border-champagne-400 pl-5 text-bone-50">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-none space-y-2 pl-0 [&>li]:relative [&>li]:pl-6 [&>li]:before:absolute [&>li]:before:top-[0.8em] [&>li]:before:left-0 [&>li]:before:h-px [&>li]:before:w-3 [&>li]:before:bg-bone-500 [&>li]:before:content-['']">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal space-y-2 pl-6 marker:text-bone-500">{children}</ol>
    ),
  },
  listItem: ({ children }) => <li>{withPlaceholders(children)}</li>,
  marks: {
    em: ({ children }) => <em className="italic">{children}</em>,
    strong: ({ children }) => <strong className="font-medium text-bone-50">{children}</strong>,
    link: ({ value, children }) => {
      const href: string = value?.href ?? '#'
      return href.startsWith('/') ? (
        <Link href={href} className="prose-link text-bone-50">
          {children}
        </Link>
      ) : (
        <a href={href} className="prose-link text-bone-50" rel="noopener noreferrer">
          {children}
        </a>
      )
    },
  },
  types: {
    callout: ({ value }: { value: { text?: string } }) => (
      <aside className="my-10 border-y border-line py-6 text-[17px] text-bone-50">
        <PortableTextInline text={value.text ?? ''} />
      </aside>
    ),
    image: ({ value }: { value: { url?: string; alt?: string; caption?: string } }) =>
      value.url ? (
        <figure className="my-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt={value.alt ?? ''} className="w-full" loading="lazy" />
          {value.caption ? (
            <figcaption className="mt-3 text-[13px] text-bone-500">{value.caption}</figcaption>
          ) : null}
        </figure>
      ) : null,
  },
}

/** Callouts are stored as plain text with markdown-style links; render links inline. */
function PortableTextInline({ text }: { text: string }) {
  const parts: ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(
      <Link key={m.index} href={m[2]} className="prose-link">
        {m[1]}
      </Link>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

/** Portable Text renderer for content pages, care guides and product descriptions (PRD 6.6). */
export function RichText({
  value,
  className,
  size = 'reading',
}: {
  value: RichTextValue
  className?: string
  size?: 'reading' | 'compact'
}) {
  return (
    <div
      className={cx(
        'space-y-5 text-bone-300',
        size === 'reading' ? 'text-[17px] leading-[1.7]' : 'text-[15px] leading-relaxed',
        className,
      )}
    >
      <PortableText value={value} components={components} />
    </div>
  )
}
