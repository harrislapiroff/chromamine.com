import path from 'node:path'
import fs from 'node:fs/promises'

import Image from '@11ty/eleventy-img'
import { JSDOM } from 'jsdom'

/* Shared @11ty/eleventy-img configuration and disk-cache plumbing.
 *
 * Image processing dominates build time, so we lean on eleventy-img's
 * "skip if the output already exists" behavior. The catch (described by
 * https://www.zachleat.com/web/faster-builds-with-eleventy-img/) is that this
 * only helps if the output directory survives between builds — and the build
 * output (_site) is wiped on every build, and starts empty on every deploy.
 *
 * So we write generated images to a persistent cache directory instead, and
 * copy them into the output directory once the build is done. The cache lives
 * under .cache/, which is preserved across builds by hosts like Cloudflare
 * Pages and Vercel (and is already where @11ty/eleventy-fetch caches data).
 */

// Where eleventy-img writes generated files (persisted across builds)
export const IMAGE_CACHE_DIR = './.cache/eleventy-img/'

// Where those files must end up in the published site
export const IMAGE_PUBLISH_DIR = './_site/media/img/'

// Public URL path referenced from the generated <picture> markup
export const IMAGE_URL_PATH = '/media/img/'

// Images render at most 768 CSS px wide (see the sizes attribute on output), so
// 768 and 1536 cover 1x and 2x retina exactly; intermediate or larger variants
// are imperceptible overkill for this fixed column width.
export const IMAGE_WIDTHS = [768, 1536]

// webp + jpeg cover every browser; svg passes through untouched for svg sources.
export const IMAGE_FORMATS = ['webp', 'jpeg', 'svg']

// Every output file eleventy-img decided to produce during this build, so the
// copy below moves exactly the variants the site references and leaves stale
// ones behind in the cache.
//
// The image transform plugin generates images internally and hands back no
// metadata, so there is no return value to collect. `filenameFormat` is the one
// hook it calls for each output variant, so we name the files ourselves there
// and record the names as we go. The format below is identical to the one
// eleventy-img uses by default, so URLs are unchanged.
const generated = new Set()

export const IMAGE_OPTIONS = {
  widths: IMAGE_WIDTHS,
  formats: IMAGE_FORMATS,
  urlPath: IMAGE_URL_PATH,
  outputDir: IMAGE_CACHE_DIR,
  // Lower webp encoding effort: effort only controls the compression search,
  // not visual quality at a fixed quality value, so this speeds up the build
  // at the cost of marginally larger files.
  sharpWebpOptions: { effort: 2 },
  // Applied to every <img> the transform plugin rewrites, unless the tag sets
  // the attribute itself.
  defaultAttributes: {
    sizes: '(max-width: 768px) 100vw, 768px',
    loading: 'lazy',
    decoding: 'async'
  },
  filenameFormat: (id, src, width, format) => {
    // Passthrough copies come through without a width and keep the bare hash.
    const filename = width ? `${id}-${width}.${format}` : `${id}.${format}`
    generated.add(filename)
    return filename
  }
}

// Copy the images generated during this build out of the persistent cache and
// into the published output directory. In --serve mode nothing is generated up
// front (eleventy-img serves images on request instead), so this is a no-op.
export async function copyGeneratedImagesToOutput() {
  if (generated.size === 0) return 0
  await fs.mkdir(IMAGE_PUBLISH_DIR, { recursive: true })
  await Promise.all(Array.from(generated, (filename) => fs.copyFile(
    path.join(IMAGE_CACHE_DIR, filename),
    path.join(IMAGE_PUBLISH_DIR, filename)
  )))
  return generated.size
}

// The URL of the largest generated variant of `src`, or null if it cannot be
// resolved. `inputPath` is the template the reference came from.
//
// Link previews need a URL that resolves to a reasonably sized file: the
// scrapers cap what they will fetch (8MB at Facebook, less elsewhere), and the
// originals in src/media run past that. The transform plugin only rewrites
// <img> tags in the built HTML, so a <meta> tag has to resolve its own.
export async function optimizedImageUrl(src, inputPath) {
  if (!src || /^[a-z]+:/i.test(src)) return null

  const file = src.startsWith('/')
    ? path.join('./src', src)
    : path.join(path.dirname(inputPath), src)

  try {
    const metadata = await Image(file, IMAGE_OPTIONS)
    // jpeg is the format every scraper handles; svg sources pass through.
    const variants = metadata.jpeg ?? metadata.webp ?? metadata.svg ?? []
    return variants.at(-1)?.url ?? null
  } catch {
    // A reference that does not resolve is the content validator's problem,
    // not a reason to fail the build.
    return null
  }
}

// Rewrite the <img> tags in a chunk of rendered HTML to point at generated
// variants instead of the full-size original. `inputPath` is the template the
// HTML came from, needed to resolve relative image paths.
//
// The transform plugin rewrites the built pages, but feeds embed a post's
// `templateContent` — the HTML as it looked *before* transforms ran — so
// without this subscribers would download multi-megabyte originals. Feed
// readers don't do anything useful with srcset, so this swaps in the smallest
// variant rather than building a whole <picture>.
export async function optimizeImagesInHtml(html, inputPath) {
  if (!html.includes('<img')) return html

  const dom = new JSDOM(`<body>${html}</body>`)
  const { document } = dom.window

  await Promise.all(Array.from(document.querySelectorAll('img'), async (img) => {
    const src = img.getAttribute('src')
    if (!src || /^[a-z]+:/i.test(src)) return

    // Resolve exactly the way the transform plugin does: absolute paths from
    // src/, relative ones from the directory of the template that wrote them.
    const file = src.startsWith('/')
      ? path.join('./src', src)
      : path.join(path.dirname(inputPath), src)

    const metadata = await Image(file, IMAGE_OPTIONS)
    // jpeg for the widest feed reader support; a source with transparency
    // doesn't get one, so fall back to the formats that are generated.
    const [smallest] = metadata.jpeg ?? metadata.webp ?? metadata.svg ?? []
    if (!smallest) return

    img.setAttribute('src', smallest.url)
    img.setAttribute('width', smallest.width)
    img.setAttribute('height', smallest.height)
  }))

  return document.body.innerHTML
}
