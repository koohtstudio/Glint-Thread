/**
 * Copy lint (PRD 3.2): runs over UI strings and default content. Fails on banned words, em dashes,
 * emoji, US spellings, unverifiable material claims and more than one exclamation mark per page.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import messages from '@/messages/en-CA.json'
import { homeDefaults } from '@/content/home'
import { careGuides } from '@/content/care'
import { collectionEditorial, departmentEditorial } from '@/content/merch'
import { pageSeeds } from '@/content/pages'
import { siteDefaults } from '@/content/site'

function strings(value: unknown, path = ''): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }]
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`))
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k))
  return []
}

const sources = {
  messages,
  home: homeDefaults,
  care: careGuides,
  merch: { collectionEditorial, departmentEditorial },
  pages: pageSeeds,
  site: siteDefaults,
}
const all = Object.entries(sources)
  .flatMap(([name, value]) => strings(value, name))
  .filter((s) => !/^images\//.test(s.text) && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.text))

const BANNED: [RegExp, string][] = [
  [/\belevat(e|es|ed|ing)\b/i, 'elevate'],
  [/\bcurated\b/i, 'curated'],
  [/timeless elegance/i, 'timeless elegance'],
  [/must-have/i, 'must-have'],
  [/game-?changer/i, 'game-changer'],
  [/\bunleash/i, 'unleash'],
  [/discover your/i, 'discover your'],
  [/\bindulge/i, 'indulge'],
  [/\bluxurious\b/i, 'luxurious'],
  [/shop now/i, 'shop now'],
  [/[—–]/, 'em or en dash'],
  [/(?![\u00a9\u00ae\u2122])\p{Extended_Pictographic}/u, 'emoji'],
  [/\b(color|colors|favorite|center|jewelry|cozy|pajamas)\b/i, 'US spelling'],
  [/\b(sterling|hypoallergenic|tarnish-proof|tarnish proof|waterproof)\b/i, 'unverifiable claim'],
]

const CLAIM_ALLOW = [/real gold/i, /gold loan/i, /gold-tone/i, /silver-tone/i, /gold\/silver/i]
const BARE_METAL = /\b(gold|silver)\b(?!-tone)/i

describe('copy lint', () => {
  it('finds strings to lint', () => {
    expect(all.length).toBeGreaterThan(100)
  })

  for (const [re, label] of BANNED) {
    it(`has no ${label}`, () => {
      const hits = all.filter((s) => re.test(s.text)).map((s) => `${s.path}: ${s.text}`)
      expect(hits).toEqual([])
    })
  }

  it('never calls plated pieces gold or silver', () => {
    const hits = all
      .filter((s) => {
        let text = s.text
        for (const allow of CLAIM_ALLOW) text = text.replace(new RegExp(allow.source, 'gi'), '')
        return BARE_METAL.test(text)
      })
      .filter((s) => !s.path.startsWith('messages.listing') && !/COLOUR/.test(s.path))
      .map((s) => `${s.path}: ${s.text}`)
    expect(hits).toEqual([])
  })

  it('uses at most one exclamation mark per page', () => {
    for (const page of pageSeeds) {
      const text = strings(page)
        .map((s) => s.text)
        .join(' ')
      expect((text.match(/!/g) ?? []).length, page.slug).toBeLessThanOrEqual(1)
    }
    expect(strings(homeDefaults).filter((s) => s.text.includes('!'))).toHaveLength(0)
  })

  it('uses the PRD 3.3 core copy verbatim', () => {
    expect(homeDefaults.hero.headline).toBe('All the glint.')
    expect(homeDefaults.hero.headlineItalic).toBe('None of the gold loan.')
    expect(homeDefaults.hero.sub).toBe(
      'Gold-tone jewellery and everyday accessories, chosen in small batches and shipped across Canada.',
    )
    expect(homeDefaults.brandBand.line).toBe(
      'Small batches. Honest materials, honestly labelled. Shipped across Canada.',
    )
    expect(messages.bag.empty).toBe('Your bag is feeling a little light.')
    expect(messages.notFound.title).toBe('This page wandered off, like the other earring.')
    expect(messages.product.soldOutLong).toBe('Sold out. These were small-batch, and they went.')
    expect(messages.brand.signOff).toBe('All the glint. None of the gold loan.')
    expect(messages.newsletter.body).toBe(
      "Ten percent off your first order, plus first dibs on small-batch drops. We email when there's something worth opening.",
    )
  })

  it('keeps em dashes and emoji out of component and route source', () => {
    const walk = (dir: string): string[] => {
      let out: string[] = []
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name)
        if (statSync(full).isDirectory()) out = out.concat(walk(full))
        else if (/\.(tsx?|css)$/.test(name)) out.push(full)
      }
      return out
    }
    const files = ['components', 'app', 'lib/email'].flatMap((d) => {
      try {
        return walk(d)
      } catch {
        return []
      }
    })
    const hits = files.filter((f) => {
      const src = readFileSync(f, 'utf8')
      return /\u2014/.test(src) || /(?![\u00a9\u00ae\u2122])\p{Extended_Pictographic}/u.test(src)
    })
    expect(hits).toEqual([])
  })
})
