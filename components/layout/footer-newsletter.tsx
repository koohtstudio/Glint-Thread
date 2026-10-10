'use client'

import { usePathname } from 'next/navigation'
import { t } from '@/lib/i18n'
import { NewsletterForm } from '@/components/content/newsletter-form'

/** The home page has a full newsletter band, so the footer points to it there instead of repeating the form. */
export function FooterNewsletter() {
  const pathname = usePathname()
  return (
    <div>
      <h2 className="eyebrow">{t('footer.newsletter')}</h2>
      <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-bone-300">
        {t('newsletter.body')}
      </p>
      <div className="mt-6">
        {pathname === '/' ? (
          <a href="#newsletter" className="link-cta btn-label">
            <span>{t('newsletter.submit')}</span>
          </a>
        ) : (
          <NewsletterForm compact source="footer" />
        )}
      </div>
    </div>
  )
}
