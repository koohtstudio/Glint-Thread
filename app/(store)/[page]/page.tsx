import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCareGuides, getPage, getPages } from '@/lib/data'
import { faqJsonLd, pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { Breadcrumbs } from '@/components/content/breadcrumbs'
import { JsonLd } from '@/components/content/json-ld'
import { RichText } from '@/components/content/rich-text'
import { ContactForm } from '@/components/content/contact-form'
import { Accordion } from '@/components/ui/accordion'

/** Content pages (PRD 6.6): about, shipping-returns, faq, contact, care, size-guide, privacy, terms, accessibility. */
export const instant = false

export async function generateStaticParams() {
  return (await getPages()).map((p) => ({ page: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/[page]'>): Promise<Metadata> {
  const { page: slug } = await params
  const page = await getPage(slug)
  if (!page) return {}
  return pageMetadata({
    title: page.seo.title ?? (slug === 'about' ? 'Our story' : page.title),
    description: page.seo.description ?? page.intro ?? undefined,
    path: `/${slug}`,
  })
}

export default async function ContentPage({ params }: PageProps<'/[page]'>) {
  const { page: slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()
  const guides = slug === 'care' ? await getCareGuides() : []

  return (
    <article className="container-x pt-8 pb-28 lg:pt-10">
      <Breadcrumbs
        crumbs={[
          { name: t('nav.home'), href: '/' },
          { name: slug === 'about' ? t('footer.ourStory') : page.title, href: `/${slug}` },
        ]}
      />
      <div className="mx-auto mt-12 max-w-[680px] lg:mt-20">
        <header>
          <p className="eyebrow">{page.eyebrow}</p>
          <h1 className="t-h1 mt-4">{page.title}</h1>
          {page.intro ? (
            <p className="t-lede mt-6">
              <RichTextInline text={page.intro} />
            </p>
          ) : null}
        </header>

        {page.body.length ? <RichText value={page.body} className="mt-12 lg:mt-16" /> : null}

        {page.faqs.length ? (
          <>
            <JsonLd data={faqJsonLd(page.faqs)} />
            <Accordion
              className="mt-12 lg:mt-16"
              items={page.faqs.map((f, i) => ({
                id: `faq-${i}`,
                title: f.question,
                content: <RichText value={f.answer} size="compact" />,
              }))}
            />
          </>
        ) : null}

        {guides.length ? (
          <div className="mt-12 space-y-16 lg:mt-16">
            {guides.map((g) => (
              <section
                key={g.slug}
                id={g.slug}
                aria-labelledby={`${g.slug}-title`}
                className="scroll-mt-28 border-t border-line pt-8"
              >
                <h2 id={`${g.slug}-title`} className="t-h3">
                  {g.title}
                </h2>
                <RichText value={g.body} className="mt-6" />
              </section>
            ))}
          </div>
        ) : null}

        {slug === 'contact' ? (
          <div className="mt-14 border-t border-line pt-12">
            <ContactForm />
          </div>
        ) : null}
      </div>
    </article>
  )
}

/** Intros may carry a markdown link, e.g. "[Write to us](/contact)". */
function RichTextInline({ text }: { text: string }) {
  const m = text.match(/^(.*)\[([^\]]+)\]\(([^)]+)\)(.*)$/)
  if (!m) return <>{text}</>
  return (
    <>
      {m[1]}
      <a href={m[3]} className="prose-link text-bone-50">
        {m[2]}
      </a>
      {m[4]}
    </>
  )
}
