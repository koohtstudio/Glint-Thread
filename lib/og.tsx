/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>; next/image does not apply */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

/** Open Graph cards (PRD 13): the product image on the mat, set in Instrument Serif on ink-950. */
export const OG_SIZE = { width: 1200, height: 630 }

const fonts = Promise.all([
  readFile(join(process.cwd(), 'assets/fonts/InstrumentSerif-Regular.ttf')),
  readFile(join(process.cwd(), 'assets/fonts/InstrumentSerif-Italic.ttf')),
]).then(([regular, italic]) => [
  { name: 'Instrument Serif', data: regular, style: 'normal' as const, weight: 400 as const },
  { name: 'Instrument Serif', data: italic, style: 'italic' as const, weight: 400 as const },
])

/** Local catalogue images are inlined as data URLs; Sanity CDN images are requested at OG size. */
export async function ogImageSrc(src: string): Promise<string> {
  if (src.startsWith('/')) {
    const buf = await readFile(join(process.cwd(), 'public', src))
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  }
  const url = new URL(src)
  if (url.hostname === 'cdn.sanity.io') {
    url.searchParams.set('w', '900')
    url.searchParams.set('fm', 'jpg')
  }
  return url.toString()
}

const C = {
  ink950: '#0C0B0A',
  ink800: '#1B1916',
  line: 'rgba(244,239,231,0.14)',
  bone50: '#F4EFE7',
  bone300: '#CFC7BA',
  champagne: '#C9A96E',
}

export async function matCard({
  eyebrow,
  title,
  line,
  imageSrc,
}: {
  eyebrow: string
  title: string
  line?: string
  imageSrc: string | null
}) {
  const img = imageSrc ? await ogImageSrc(imageSrc) : null
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: C.ink950,
        padding: 56,
        fontFamily: 'Instrument Serif',
      }}
    >
      <div
        style={{
          width: 420,
          height: 518,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.ink800,
          border: `1px solid ${C.line}`,
          padding: 34,
        }}
      >
        {img ? (
          <img
            src={img}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : null}
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingLeft: 64,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{ fontSize: 22, letterSpacing: 5, textTransform: 'uppercase', color: C.bone300 }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: title.length > 30 ? 64 : 78,
              lineHeight: 1,
              color: C.bone50,
              marginTop: 28,
            }}
          >
            {title}
          </div>
          {line ? (
            <div style={{ fontSize: 32, lineHeight: 1.25, color: C.bone300, marginTop: 28 }}>
              {line}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            borderTop: `1px solid ${C.line}`,
            paddingTop: 22,
          }}
        >
          <div style={{ display: 'flex', fontSize: 38, color: C.bone50 }}>
            Glint&nbsp;<span style={{ fontStyle: 'italic' }}>&amp;</span>&nbsp;Thread
          </div>
          <div style={{ fontSize: 22, color: C.champagne }}>Shipped across Canada</div>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: await fonts },
  )
}

export async function brandCard({ imageSrc }: { imageSrc: string }) {
  const img = await ogImageSrc(imageSrc)
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: C.ink950,
        fontFamily: 'Instrument Serif',
      }}
    >
      <img src={img} alt="" style={{ width: 520, height: 630, objectFit: 'cover' }} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 64px',
        }}
      >
        <div
          style={{ fontSize: 20, letterSpacing: 5, textTransform: 'uppercase', color: C.bone300 }}
        >
          Small-batch jewellery &amp; accessories
        </div>
        <div style={{ fontSize: 92, lineHeight: 0.95, color: C.bone50, marginTop: 28 }}>
          All the glint.
        </div>
        <div style={{ fontSize: 92, lineHeight: 0.95, color: C.bone50, fontStyle: 'italic' }}>
          None of the
        </div>
        <div style={{ fontSize: 92, lineHeight: 0.95, color: C.bone50, fontStyle: 'italic' }}>
          gold loan.
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: C.bone300, marginTop: 44 }}>
          Glint&nbsp;<span style={{ fontStyle: 'italic' }}>&amp;</span>&nbsp;Thread
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: await fonts },
  )
}

export async function monogram(size: number) {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.ink950,
        color: C.bone50,
        fontFamily: 'Instrument Serif',
        fontSize: size * 0.5,
        letterSpacing: -size * 0.01,
      }}
    >
      G<span style={{ fontStyle: 'italic', color: C.champagne }}>&amp;</span>T
    </div>,
    { width: size, height: size, fonts: await fonts },
  )
}
