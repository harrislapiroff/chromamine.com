/* IBM Plex Mono, loaded off disk for Satori.
 *
 * Satori has no font fallback of its own — every weight the cards use has to be
 * handed to it explicitly. It reads ttf/otf/woff but not woff2, and @ibm/plex
 * ships woff alongside the woff2 the site itself serves, so the same font files
 * the browser gets back the images too.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import { fontFamily, weightNormal, weightBold } from './theme.js'

const FONT_DIR = './node_modules/@ibm/plex/IBM-Plex-Mono/fonts/complete/woff/'

const FACES = [
  { weight: weightNormal, style: 'normal', file: 'IBMPlexMono-Light.woff' },
  { weight: weightNormal, style: 'italic', file: 'IBMPlexMono-LightItalic.woff' },
  { weight: weightBold, style: 'normal', file: 'IBMPlexMono-SemiBold.woff' }
]

let cached = null

// Reading four font files per image would dominate the render time, so the
// buffers are loaded once and shared by every card in the build.
export function loadFonts () {
  cached ??= Promise.all(FACES.map(async ({ weight, style, file }) => ({
    name: fontFamily,
    weight,
    style,
    data: await fs.readFile(path.join(FONT_DIR, file))
  })))
  return cached
}
