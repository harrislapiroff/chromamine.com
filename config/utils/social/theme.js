/* The site's dark-mode design, expressed for the social image renderer.
 *
 * The values here mirror src/static/styles/_variables.sass — the same `lch()`
 * numbers, resolved to sRGB by ./colors.js. Satori can't read the stylesheet
 * (there is no browser and no cascade), so the palette has to be restated;
 * keeping the raw `lch()` arguments visible makes the two easy to diff by eye
 * when the stylesheet changes.
 *
 * Type is expressed as multiples of the site's 16px/25px base rhythm so the
 * cards keep the stylesheet's proportions rather than inventing a new scale.
 */

import { lch } from './colors.js'

export const colors = {
  // --color-background: --color-almost-black
  background: lch(10, 2, 87),
  // --color-base: --color-75-white
  base: lch(75, 2, 87),
  // --color-text-muted: --color-55-white
  muted: lch(55, 2, 87),
  // --color-text-striking: --color-85-white
  striking: lch(85, 0, 0),
  // --color-link: --color-pink-brighter
  link: lch(50, 132, 339),
  // --color-accent-1: --color-red-pink-brighter
  accent: lch(70, 132, 25)
}

// --font-family-base, and the two weights dark mode actually uses:
// --font-weight-normal is 300 under `prefers-color-scheme: dark`, not 400.
export const fontFamily = 'IBM Plex Mono'
export const weightNormal = 300
export const weightBold = 600

// The site's --font-size-base / --line-height-base.
export const BASE_FONT_SIZE = 16
export const BASE_LINE_HEIGHT = 25

// The peonies backdrop: 0.1 opacity, painted in --color-base, fading to
// transparent down the element (see the body::before rule in _global.sass).
export const backdropOpacity = 0.1
