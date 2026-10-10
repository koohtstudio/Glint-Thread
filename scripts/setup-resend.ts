/**
 * Creates the Resend objects the newsletter needs, idempotently (safe to re-run):
 *   - topic "Newsletter" (default subscription opt_out: people are subscribed only after confirming)
 *   - segment "Newsletter subscribers"
 *   - contact properties consent_text_version, consent_at, signup_source, confirmed_at
 * Prints the IDs to paste into .env.local. Resend replaced Audiences with Contacts, Segments, Topics
 * and Properties, so there is no audience ID any more.
 *
 *   npm run setup:resend            needs RESEND_API_KEY (full access key)
 *   npm run setup:resend -- --dry-run   shows what would be created, calls nothing
 */
import { Resend } from 'resend'
import {
  CONTACT_PROPERTY_KEYS,
  NEWSLETTER_SEGMENT_NAME,
  NEWSLETTER_TOPIC_DESCRIPTION,
  NEWSLETTER_TOPIC_NAME,
} from '../lib/newsletter-config'
import { loadEnvFiles } from './load-env'

const dryRun = process.argv.includes('--dry-run')

function fail(what: string, error: { message: string }): never {
  console.error(`[resend] ${what}: ${error.message}`)
  process.exit(1)
}

async function main() {
  loadEnvFiles()
  if (dryRun) {
    console.log(
      `[resend] DRY RUN. Would ensure: topic "${NEWSLETTER_TOPIC_NAME}", segment "${NEWSLETTER_SEGMENT_NAME}", properties ${CONTACT_PROPERTY_KEYS.join(', ')}`,
    )
    return
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error(
      '[resend] Set RESEND_API_KEY (a full-access key) in .env.local, or use --dry-run.',
    )
    process.exit(1)
  }
  const resend = new Resend(apiKey)

  // Topic
  const topics = await resend.topics.list()
  if (topics.error) fail('could not list topics', topics.error)
  let topic = topics.data.data.find((t) => t.name === NEWSLETTER_TOPIC_NAME)
  let topicId = topic?.id
  if (topicId) console.log(`[resend] topic exists: ${topicId}`)
  else {
    const created = await resend.topics.create({
      name: NEWSLETTER_TOPIC_NAME,
      description: NEWSLETTER_TOPIC_DESCRIPTION,
      defaultSubscription: 'opt_out',
    })
    if (created.error) fail('could not create topic', created.error)
    topicId = created.data.id
    console.log(`[resend] topic created: ${topicId}`)
  }
  topic = undefined

  // Segment (list is paginated)
  let segmentId: string | undefined
  let after: string | undefined
  for (let page = 0; page < 20 && !segmentId; page++) {
    const segments = await resend.segments.list({ limit: 100, ...(after ? { after } : {}) })
    if (segments.error) fail('could not list segments', segments.error)
    segmentId = segments.data.data.find((s) => s.name === NEWSLETTER_SEGMENT_NAME)?.id
    if (!segments.data.has_more || !segments.data.data.length) break
    after = segments.data.data[segments.data.data.length - 1].id
  }
  if (segmentId) console.log(`[resend] segment exists: ${segmentId}`)
  else {
    const created = await resend.segments.create({ name: NEWSLETTER_SEGMENT_NAME })
    if (created.error) fail('could not create segment', created.error)
    segmentId = created.data.id
    console.log(`[resend] segment created: ${segmentId}`)
  }

  // Consent properties
  const existing = new Set<string>()
  let propAfter: string | undefined
  for (let page = 0; page < 20; page++) {
    const props = await resend.contactProperties.list({
      limit: 100,
      ...(propAfter ? { after: propAfter } : {}),
    })
    if (props.error) fail('could not list contact properties', props.error)
    for (const p of props.data.data) existing.add(p.key)
    if (!props.data.has_more || !props.data.data.length) break
    propAfter = props.data.data[props.data.data.length - 1].id
  }
  for (const key of CONTACT_PROPERTY_KEYS) {
    if (existing.has(key)) {
      console.log(`[resend] property exists: ${key}`)
      continue
    }
    const created = await resend.contactProperties.create({ key, type: 'string' })
    if (created.error) fail(`could not create property ${key}`, created.error)
    console.log(`[resend] property created: ${key}`)
  }

  console.log('\nAdd these to .env.local (and to your hosting environment):\n')
  console.log(`RESEND_NEWSLETTER_TOPIC_ID=${topicId}`)
  console.log(`RESEND_NEWSLETTER_SEGMENT_ID=${segmentId}`)
}

main().catch((err) => {
  console.error('[resend] failed:', err)
  process.exit(1)
})
