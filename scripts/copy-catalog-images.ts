/**
 * predev / prebuild: copies catalog/images to public/catalog/images and generates tiny blur
 * placeholders (LQIP) into lib/data/generated/image-meta.json for `placeholder="blur"`.
 * Idempotent: unchanged files are skipped, and existing placeholders are reused.
 */
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const src = path.join(root, 'catalog', 'images')
const dest = path.join(root, 'public', 'catalog', 'images')
const metaFile = path.join(root, 'lib', 'data', 'generated', 'image-meta.json')

type Meta = Record<string, { blurDataURL: string; hash: string }>

async function main() {
  await mkdir(dest, { recursive: true })
  let meta: Meta = {}
  try {
    meta = JSON.parse(await readFile(metaFile, 'utf8'))
  } catch {
    meta = {}
  }

  const files = (await readdir(src)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()
  let copied = 0
  let generated = 0
  const next: Meta = {}

  for (const file of files) {
    const from = path.join(src, file)
    const to = path.join(dest, file)
    const s = await stat(from)
    const d = await stat(to).catch(() => null)
    if (!d || d.size !== s.size) {
      await copyFile(from, to)
      copied++
    }
    const key = `images/${file}`
    const hash = createHash('sha1')
      .update(await readFile(from))
      .digest('hex')
      .slice(0, 12)
    const prev = meta[key]
    if (prev && prev.hash === hash) {
      next[key] = prev
      continue
    }
    const buf = await sharp(from).resize(10, 13, { fit: 'inside' }).jpeg({ quality: 50 }).toBuffer()
    next[key] = { blurDataURL: `data:image/jpeg;base64,${buf.toString('base64')}`, hash }
    generated++
  }

  const json = JSON.stringify(next, null, 0).replace(/},"/g, '},\n"')
  const before = await readFile(metaFile, 'utf8').catch(() => '')
  if (before !== json) await writeFile(metaFile, json)
  console.log(
    `[images] ${files.length} images: ${copied} copied, ${generated} placeholders generated`,
  )
}

main().catch((err) => {
  console.error('[images] failed:', err)
  process.exit(1)
})
