import path from 'node:path'
import fs from 'node:fs/promises'

import Image from '@11ty/eleventy-img'

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

export const IMAGE_OPTIONS = {
  widths: IMAGE_WIDTHS,
  formats: IMAGE_FORMATS,
  urlPath: IMAGE_URL_PATH,
  outputDir: IMAGE_CACHE_DIR,
  // Lower webp encoding effort: effort only controls the compression search,
  // not visual quality at a fixed quality value, so this speeds up the build
  // at the cost of marginally larger files.
  sharpWebpOptions: { effort: 2 }
}

// Track every in-flight generation so the build can wait for all images to be
// written to the cache before copying them into the output directory. The
// markdown image renderer in particular cannot await generation directly
// (markdown-it render rules are synchronous), so it registers its work here.
const pending = []

export function generateImage(src, options = IMAGE_OPTIONS) {
  const promise = Image(src, options)
  pending.push(promise)
  return promise
}

// Copy the images generated during this build out of the persistent cache and
// into the published output directory. Only files referenced this build are
// copied, so stale variants left in the cache don't bloat the deploy.
export async function copyGeneratedImagesToOutput() {
  const results = await Promise.allSettled(pending)
  await fs.mkdir(IMAGE_PUBLISH_DIR, { recursive: true })
  const copied = new Set()
  await Promise.all(results.flatMap((result) => {
    if (result.status !== 'fulfilled') return []
    return Object.values(result.value).flat().flatMap((entry) => {
      if (copied.has(entry.filename)) return []
      copied.add(entry.filename)
      return fs.copyFile(entry.outputPath, path.join(IMAGE_PUBLISH_DIR, entry.filename))
    })
  }))
  return copied.size
}
