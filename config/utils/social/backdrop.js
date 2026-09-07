/* The peonies backdrop the cards sit on.
 *
 * _global.sass paints the top of every page with peonies.svg used as an *alpha
 * mask* over a `--color-base` → transparent gradient, at 0.1 opacity. This
 * rebuilds that effect with sharp: the SVG is rasterized to a greyscale mask,
 * multiplied by a vertical fade, scaled down to the same opacity, and used as
 * the alpha channel of a flat `--color-base` layer over the page background.
 *
 * The source SVG is 4MB of clip paths and takes ~0.5s to rasterize, so results
 * are memoized per card size — a build renders each size once no matter how
 * many cards it makes.
 */

import sharp from 'sharp'

import { colors, backdropOpacity } from './theme.js'

const PEONIES_SVG = './src/static/styles/images/peonies.svg'

const cache = new Map()

// A white-to-black vertical ramp, used to multiply the peonies mask down to
// nothing by the foot of the card the way the stylesheet's linear-gradient does.
const fadeSvg = (width, height) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="1" stop-color="#000"/>
    </linearGradient>
    <rect width="${width}" height="${height}" fill="url(#fade)"/>
  </svg>`
)

async function render (width, height) {
  // The pattern is square. Fitting the whole square to the card's longer edge
  // and cropping from the top keeps whole flowers in frame — scaling it to the
  // card's aspect ratio instead would either squash the drawing or crop so far
  // in that only leaf edges survive.
  const size = Math.max(width, height)
  const square = await sharp(PEONIES_SVG).resize(size, size).png().toBuffer()

  // `greyscale()` only desaturates; `b-w` is what actually collapses the image
  // to the one channel per pixel that joinChannel expects below.
  const alpha = await sharp(square)
    .extract({ left: Math.round((size - width) / 2), top: 0, width, height })
    .composite([{ input: fadeSvg(width, height), blend: 'multiply' }])
    .linear(backdropOpacity, 0)
    .toColourspace('b-w')
    .raw()
    .toBuffer()

  const flowers = await sharp({
    create: { width, height, channels: 3, background: colors.base }
  })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer()

  return sharp({
    create: { width, height, channels: 3, background: colors.background }
  })
    .composite([{ input: flowers }])
    .png()
    .toBuffer()
}

/* A `width` × `height` PNG of the page background with the peonies motif
 * faded across it. Cards are composited on top of this.
 */
export function backdrop (width, height) {
  const key = `${width}x${height}`
  if (!cache.has(key)) cache.set(key, render(width, height))
  return cache.get(key)
}
