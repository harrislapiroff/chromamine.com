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

import { JSDOM } from 'jsdom'

import { renderOpenGraphCard, renderStoryCard } from './cards.js'

// Where rendered cards are kept between builds, and where they have to end up
// in the published site.
const CACHE_DIR = './.cache/social-images/'
const PUBLISH_DIR = './_site/media/social/'

export const SOCIAL_URL_PATH = '/media/social/'

// Bump when a card's design changes, so existing caches are not reused for
// images that would now render differently.
const RENDERER_VERSION = 1

// How many cards to draw at once. See mapWithConcurrency below.
const CONCURRENCY = 4

/* The URL of a post's social image. `kind` is 'opengraph' or 'story'.
 *
 * Both the templates (to fill in `og:image`) and this hook (to decide what to
 * render) derive the URL from the post's slug, so neither has to be told about
 * files the other made.
 */
export function socialImageUrl (slug, kind = 'opengraph') {
  return `${SOCIAL_URL_PATH}${slug}${kind === 'story' ? '-story' : ''}.png`
}

// A post's slug is the last segment of its URL, which posts.11tydata.js builds
// from the source filename.
const slugFromUrl = (url) => url.replace(/\/+$/, '').split('/').pop()

const textOf = (node) => node?.textContent.trim() || ''

/* Pull everything the cards need out of a rendered post page. */
function readPost (html) {
  const { document } = new JSDOM(html).window
  const article = document.querySelector('article.blog-post')
  if (!article) return null

  const content = article.querySelector('.content')

  return {
    title: textOf(document.querySelector('title')),
    categories: textOf(article.querySelector('.categories')).split(/,\s*/).filter(Boolean),
    date: textOf(article.querySelector('header time')),
    excerpt: readExcerpt(content, document),
    // Whatever post.webc decided to advertise as the preview image.
    openGraphImage: document.querySelector('meta[property="og:image"]')?.content
  }
}

/* The opening prose of a post: its first paragraph, plus the second when the
 * first is too short to stand on its own.
 *
 * Paragraphs that carry an image are skipped — a post that opens with a photo
 * and its caption should still be described by its first real sentence.
 */
function readExcerpt (content, document) {
  const paragraphs = [...(content?.querySelectorAll(':scope > rich-text > p, :scope > p') ?? [])]
    .filter((p) => !p.querySelector('img, picture, svg'))
    .map((p) => p.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  // Notebook posts render their body on the client, so there is no prose in the
  // markup to read; fall back to the description the page already advertises.
  if (!paragraphs.length) {
    return document.querySelector('meta[property="og:description"]')?.content || ''
  }

  const [first, second] = paragraphs
  return second && first.length < 240 ? `${first} ${second}` : first
}

/* The two kinds of card, and the parts of a post each one draws.
 *
 * Naming the inputs explicitly is what makes the cache honest: an image is
 * only rebuilt when something it actually shows has changed, so editing a
 * post's opening paragraph does not invalidate its link preview.
 */
const CARDS = {
  opengraph: {
    render: renderOpenGraphCard,
    inputs: ({ title, categories, date }) => ({ title, categories, date })
  },
  story: {
    render: renderStoryCard,
    inputs: ({ title, categories, date, excerpt }) => ({ title, categories, date, excerpt })
  }
}

const cacheKey = (inputs) =>
  crypto.createHash('sha256')
    .update(JSON.stringify({ ...inputs, version: RENDERER_VERSION }))
    .digest('hex')
    .slice(0, 16)

/* Render one of a post's cards, reusing the cached PNG when nothing it draws
 * has changed, and copy it into the build output under its public filename.
 */
async function writeCard (kind, post, slug) {
  const { render, inputs } = CARDS[kind]
  const card = inputs(post)
  const filename = path.basename(socialImageUrl(slug, kind))
  const cached = path.join(CACHE_DIR, `${path.parse(filename).name}-${cacheKey(card)}.png`)

  try {
    await fs.access(cached)
  } catch {
    await fs.writeFile(cached, await render(card))
  }

  await fs.copyFile(cached, path.join(PUBLISH_DIR, filename))
  return path.basename(cached)
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

/* Drop cached renders of cards that no longer exist, or that have been
 * superseded — otherwise every edit to a post's opening paragraph leaves
 * another copy of its story image behind forever.
 */
async function pruneCache (kept) {
  const stale = (await fs.readdir(CACHE_DIR)).filter((file) => !kept.has(file))
  await Promise.all(stale.map((file) => fs.rm(path.join(CACHE_DIR, file))))
  return stale.length
}

/* Generate the social images for the blog posts written in this build.
 *
 * `results` is the `eleventy.after` results list, already filtered to posts.
 * `prune` must only be set when that list covers every post — an incremental
 * rebuild sees just the page that changed, and pruning against it would throw
 * away every other post's cached images.
 */
export async function generateSocialImages (results, { prune = false } = {}) {
  await fs.mkdir(CACHE_DIR, { recursive: true })
  await fs.mkdir(PUBLISH_DIR, { recursive: true })

  const kept = new Set()

  const written = await mapWithConcurrency(results, CONCURRENCY, async ({ url, content }) => {
    const post = readPost(content)
    if (!post) return 0

    const slug = slugFromUrl(url)
    const files = []

    // Every post gets a story image; only posts with no image of their own get
    // a generated link preview.
    files.push(await writeCard('story', post, slug))

    if (post.openGraphImage?.endsWith(socialImageUrl(slug, 'opengraph'))) {
      files.push(await writeCard('opengraph', post, slug))
    }

    files.forEach((file) => kept.add(file))
    return files.length
  })

  return {
    published: written.reduce((total, count) => total + count, 0),
    pruned: prune ? await pruneCache(kept) : 0
  }
}
