import type { Metadata } from 'next'
import { getProductCards } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Price } from '@/components/ui/price'
import { ProgressLine } from '@/components/ui/progress-line'
import { TextLink } from '@/components/ui/text-link'
import { Checkbox, Input, Textarea } from '@/components/ui/field'
import { MatImage } from '@/components/product/mat-image'
import { ProductCard } from '@/components/product/product-card'
import { StyleguideInteractive } from './interactive'

export const metadata: Metadata = {
  title: 'Styleguide',
  robots: { index: false, follow: false },
}

const COLOURS = [
  ['ink-950', '#0C0B0A', 'Page background'],
  ['ink-900', '#141311', 'Surfaces'],
  ['ink-800', '#1B1916', 'Mats, hover'],
  ['ink-700', '#2A2723', 'Disabled, hover borders'],
  ['line', 'rgba(244,239,231,.10)', 'Hairlines'],
  ['bone-50', '#F4EFE7', 'Text, light sections'],
  ['bone-200', '#E4DCCF', 'Light borders'],
  ['bone-300', '#CFC7BA', 'Secondary text'],
  ['bone-500', '#9A9184', 'Muted text'],
  ['champagne-400', '#C9A96E', 'Accent'],
  ['champagne-600', '#A8874C', 'Accent on light'],
  ['oxblood-600', '#6E2A2F', 'Promo on light'],
  ['success', '#7FA37A', 'Inline success'],
  ['error', '#D07A6E', 'Inline error'],
] as const

const SWATCH: Record<string, string> = {
  'ink-950': 'bg-ink-950',
  'ink-900': 'bg-ink-900',
  'ink-800': 'bg-ink-800',
  'ink-700': 'bg-ink-700',
  line: 'bg-line',
  'bone-50': 'bg-bone-50',
  'bone-200': 'bg-bone-200',
  'bone-300': 'bg-bone-300',
  'bone-500': 'bg-bone-500',
  'champagne-400': 'bg-champagne-400',
  'champagne-600': 'bg-champagne-600',
  'oxblood-600': 'bg-oxblood-600',
  success: 'bg-success',
  error: 'bg-error',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-16">
      <h2 className="eyebrow mb-8">{title}</h2>
      {children}
    </section>
  )
}

export default async function StyleguidePage() {
  const cards = await getProductCards()
  const single = cards.find((c) => c.slug === 'oversized-open-heart-earrings')!
  const multi = cards.find((c) => c.slug === 'classic-beret')!
  const socks = cards.find((c) => c.slug === 'critter-crew-socks')!
  const soldOut = { ...cards.find((c) => c.slug === 'pink-corduroy-bucket-hat')!, soldOut: true }
  const lowRes = cards.find((c) => c.slug === 'taupe-ring-buckle-crossbody')!

  return (
    <div className="container-x py-16">
      <p className="eyebrow">Internal, noindex</p>
      <h1 className="t-h1 mt-4">Styleguide</h1>
      <p className="t-lede measure mt-6">
        Tokens, type and every component state, for design QA (PRD 4, 14.2).
      </p>

      <Section title="Colour tokens">
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-7">
          {COLOURS.map(([name, hex, use]) => (
            <li key={name}>
              <div className={`aspect-square border border-line ${SWATCH[name]}`} />
              <p className="mt-3 text-[13px] font-medium">{name}</p>
              <p className="tabular text-[12px] text-bone-500">{hex}</p>
              <p className="text-[12px] text-bone-300">{use}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type scale">
        <div className="space-y-8">
          <p className="t-hero">
            All the glint. <em>None of the gold loan.</em>
          </p>
          <p className="t-h1">H1 Small batches, honestly made</p>
          <p className="t-h2">H2 This week&apos;s edit</p>
          <p className="t-h3">H3 Shop by department</p>
          <p className="measure text-base">
            Body 16/1.6. Gold-tone jewellery and everyday accessories, chosen in small batches and
            shipped across Canada. Pieces are plated over base metal unless the listing says
            stainless steel.
          </p>
          <p className="text-[15px]">Dense UI 15px. Shipping calculated at checkout.</p>
          <p className="text-[14px] leading-[1.4] font-medium">Card title 14/1.4 weight 500</p>
          <p className="eyebrow">Eyebrow 11px, 0.18em</p>
          <p className="btn-label">Button label 13px</p>
          <p className="price text-[17px]">$1,234.56 tabular</p>
        </div>
      </Section>

      <Section title="Buttons and links">
        <div className="flex flex-wrap items-center gap-6">
          <Button>Add to bag</Button>
          <Button variant="secondary">Secondary</Button>
          <Button loading loadingLabel="Adding">
            Loading
          </Button>
          <Button disabled>Disabled</Button>
          <TextLink href="/collections/fall-edit">See the fall edit</TextLink>
          <a href="#" className="link-anim">
            Nav link
          </a>
        </div>
        <div className="light-section on-light mt-10 flex flex-wrap items-center gap-6 p-8">
          <Button variant="primary-on-light">Sign up</Button>
          <Button variant="secondary-on-light">Secondary on light</Button>
          <a href="#" className="prose-link">
            Prose link on light
          </a>
        </div>
      </Section>

      <Section title="Prices, badges, progress">
        <div className="flex flex-wrap items-center gap-10">
          <Price cents={1199} />
          <Price cents={1199} compareAtCents={1499} />
          <Price cents={599} fromCents={599} />
          <Badge>Buy 2, get 1 free</Badge>
          <Badge>Sold out</Badge>
          <div className="w-64">
            <ProgressLine value={4200} max={6000} label="Free shipping progress" />
          </div>
        </div>
      </Section>

      <Section title="Mats">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <MatImage image={single.images[1]} sizes="25vw" />
          <MatImage image={lowRes.images[0]} sizes="25vw" />
          <MatImage image={multi.images[0]} sizes="25vw" aspect="1/1" />
          <div className="w-24">
            <MatImage image={socks.images[0]} sizes="96px" inset="tight" />
          </div>
        </div>
      </Section>

      <Section title="Product cards">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          <ProductCard product={single} />
          <ProductCard product={multi} />
          <ProductCard product={socks} />
          <ProductCard product={soldOut} />
          <ProductCard product={lowRes} />
        </div>
      </Section>

      <Section title="Forms">
        <div className="grid max-w-3xl gap-10 md:grid-cols-2">
          <Input label="Email" placeholder="name@example.ca" />
          <Input
            label="Email"
            defaultValue="not-an-email"
            error="Enter a valid email address, like name@example.ca."
          />
          <Input label="Order number" hint="It starts with GT-, like GT-7K2M9Q." />
          <Textarea label="Message" />
          <Checkbox label="Yes, email me about new drops and offers from Glint & Thread. Unsubscribe anytime." />
          <Checkbox label="With an error" error="Tick the box so we know you want our emails." />
        </div>
      </Section>

      <Section title="Interactive">
        <StyleguideInteractive
          pyjamas={cards.find((c) => c.slug === 'suede-touch-pyjama-set')!}
          beret={multi}
        />
      </Section>
    </div>
  )
}
