/* Build-time generation of the per-post social images.
 *
 * This runs from an `eleventy.after` hook, over the rendered pages rather than
 * the source files, so a post's categories, date and opening prose are read
 * from exactly the markup a reader sees — including for posts whose body is
 * generated (Observable notebooks), where the source has no prose to read.
 *
 * Which posts get an Open Graph card is *not* decided here. post.webc already
 * has to work out whether a post has an image of its own, because that is what
 * it puts in `og:image`; this hook just renders whatever card the page asked
 * for by pointing `og:image` at one.
 *
 * Rendering is memoized on disk the same way generated post images are (see
 * ../images.js): the cache lives under .cache/, which survives between builds
 * on the hosts that build this site, while _site/ does not.
 */

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { getSEOImage, toAbsoluteUrl } from '../../filters.js'
import { optimizedImageUrl } from '../images.js'
import { renderOpenGraphCard, renderStoryCard } from './cards.js'
import { readPost } from './extract.js'
import { rendererFingerprint } from './fingerprint.js'

// Where rendered cards are kept between builds, and where they have to end up
// in the published site. Both hold one subdirectory per kind of card.
const CACHE_DIR = './.cache/social-images/'
const PUBLISH_DIR = './_site/media/social/'

export const SOCIAL_URL_PATH = '/media/social/'

// How many cards to draw at once. See mapWithConcurrency below.
const CONCURRENCY = 4

/* The URL of a post's social image. `kind` is 'opengraph' or 'story'.
 *
 * Both the templates (to fill in `og:image`) and this hook (to decide what to
 * render) derive the URL from the post's slug, so neither has to be told about
 * files the other made.
 *
 * The two kinds live in separate directories rather than being told apart by a
 * suffix: a post slugged `foo-story` would otherwise claim the same filename as
 * the story frame of a post slugged `foo`.
 */
export function socialImageUrl (slug, kind = 'opengraph') {
  // Slugs come from filenames, and a filename may hold characters that mean
  // something in a URL — `assertSafeSlug` allows `?`, and this repo has carried
  // a post slugged that way. Unencoded, everything after it reads as a query
  // string and the image 404s.
  return `${SOCIAL_URL_PATH}${KINDS[kind].directory}/${encodeURIComponent(slug)}.png`
}

/* The absolute URL a post should advertise as its link preview.
 *
 * This is the one place the question is settled. A post with an image of its
 * own leads with that, resolved to a generated variant — the originals in
 * src/media run to 11MB, past what a scraper will fetch — and a post without
 * one gets a generated card. `generateSocialImages` below decides what to
 * render by reading the URL this produced, so the page and the images cannot
 * disagree about which posts need a card.
 */
export async function previewImageUrl (content, page, baseUrl, override) {
  const own = getSEOImage(content, override)
  const url = own
    ? (await optimizedImageUrl(own, page.inputPath)) ?? own
    : socialImageUrl(slugOf(page.inputPath))

  return toAbsoluteUrl(url, baseUrl)
}

/* A post's slug, taken from its source filename.
 *
 * This has to be Eleventy's `page.fileSlug`, because that is what post.webc
 * passes to socialImageUrl when it fills in `og:image`, and this hook decides
 * what to render by matching against the URL that produced. Deriving it from
 * the output URL instead would agree only until a post set its own permalink.
 */
const slugOf = (inputPath) => path.parse(inputPath).name

/* The two kinds of card: where each one lives, and the parts of a post it draws.
 *
 * Naming the inputs explicitly is what makes the cache honest: an image is
 * only rebuilt when something it actually shows has changed, so editing a
 * post's opening paragraph does not invalidate its link preview.
 */
const KINDS = {
  opengraph: {
    directory: 'og',
    render: renderOpenGraphCard,
    inputs: ({ title, categories, date }) => ({ title, categories, date })
  },
  story: {
    directory: 'story',
    render: renderStoryCard,
    inputs: ({ title, categories, date, paragraphs }) => ({ title, categories, date, paragraphs })
  }
}

/* What a cached render is keyed on: the post content the card draws, and the
 * renderer that drew it — so a change to either produces a different file.
 */
const KEY_LENGTH = 16

// Marks a render still being written. Carries the pid so two builds against the
// same cache cannot claim each other's temporary file.
const PARTIAL_SUFFIX = `.${process.pid}.partial`

const cacheKey = (inputs, renderer) =>
  crypto.createHash('sha256')
    .update(JSON.stringify({ ...inputs, renderer }))
    .digest('hex')
    .slice(0, KEY_LENGTH)

/* Render one of a post's cards, reusing the cached PNG when nothing it draws
 * has changed, and copy it into the build output under its public filename.
 */
async function writeCard (kind, post, slug) {
  const { directory, render, inputs } = KINDS[kind]
  const cacheDir = path.join(CACHE_DIR, directory)
  const key = cacheKey(inputs(post), await rendererFingerprint())
  const cached = path.join(cacheDir, `${slug}-${key}.png`)

  try {
    await fs.access(cached)
  } catch {
    // Write somewhere else first: a build interrupted mid-write would otherwise
    // leave a truncated PNG that every later build treats as a cache hit, since
    // existence is the only test made above.
    const partial = `${cached}${PARTIAL_SUFFIX}`
    await fs.writeFile(partial, await render(inputs(post)))
    await fs.rename(partial, cached)
  }

  await fs.mkdir(path.join(PUBLISH_DIR, directory), { recursive: true })
  await fs.copyFile(cached, path.join(PUBLISH_DIR, directory, `${slug}.png`))

  await pruneSuperseded(cacheDir, slug, path.basename(cached))
}

/* Render at most a few cards at once.
 *
 * Satori and sharp are both CPU-bound, and a first build has to draw one image
 * per post; letting all of them go at once buys nothing and costs a lot of
 * memory, while doing them one at a time leaves sharp's thread pool idle.
 */
async function mapWithConcurrency (items, limit, fn) {
  const results = []
  const queue = [...items.entries()]

  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [index, item] = next
      results[index] = await fn(item)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/* Drop earlier renders of one card, so editing a post does not leave a copy of
 * its every previous state behind forever.
 *
 * Pruning is per card rather than a sweep of the directory against everything
 * this build produced: a watch, serve or `--incremental` rebuild reports only
 * the pages that changed, and a sweep would take every other post's cache with
 * it.
 *
 * Renders of `slug` are its name, a dash, and a fixed-length key — matching on
 * length as well as prefix is what stops a post named `foo` from claiming the
 * cached images of one named `foo-bar`. Leftovers from an interrupted write go
 * too; nothing else would ever collect them.
 */
async function pruneSuperseded (directory, slug, keep) {
  const width = slug.length + 1 + KEY_LENGTH + '.png'.length
  const stale = (await fs.readdir(directory)).filter((file) =>
    file !== keep &&
    file.startsWith(`${slug}-`) &&
    (file.length === width || file.endsWith('.partial'))
  )

  // `force` because a second build against the same cache may have removed the
  // same file between the listing above and this call.
  await Promise.all(stale.map((file) => fs.rm(path.join(directory, file), { force: true })))
}

/* Generate the social images for the blog posts written in this build.
 *
 * `results` is the `eleventy.after` results list, already filtered to posts.
 * Returns how many images were published.
 */
export async function generateSocialImages (results) {
  await Promise.all(Object.values(KINDS).map(
    ({ directory }) => fs.mkdir(path.join(CACHE_DIR, directory), { recursive: true })
  ))

  const written = await mapWithConcurrency(results, CONCURRENCY, async ({ inputPath, content }) => {
    const post = readPost(content)
    if (!post) return 0

    const slug = slugOf(inputPath)

    // Every post gets a story image; only posts with no image of their own get
    // a generated link preview.
    await writeCard('story', post, slug)
    if (!post.openGraphImage?.endsWith(socialImageUrl(slug, 'opengraph'))) return 1

    await writeCard('opengraph', post, slug)
    return 2
  })

  return written.reduce((total, count) => total + count, 0)
}
