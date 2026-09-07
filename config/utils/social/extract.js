/* Reading a rendered blog post back out of its own HTML.
 *
 * The social images are built from the pages the site just produced rather than
 * from the markdown behind them, because that is the only place all of it
 * exists at once: a notebook post has no prose in its source, and post.webc has
 * already worked out which image the post leads with.
 */

import { JSDOM } from 'jsdom'

// Below this a first paragraph is too slight to stand alone on a story card,
// and the one after it is taken as well.
const SHORT_PARAGRAPH = 240

const textOf = (node) => node?.textContent.replace(/\s+/g, ' ').trim() || ''

/* The opening prose of a post: its first paragraph, plus the second when the
 * first is short.
 *
 * Paragraphs carrying an image are skipped, so a post that opens with a photo
 * and its caption is still described by its first real sentence.
 */
function readExcerpt (content, document) {
  const paragraphs = [...(content?.querySelectorAll(':scope > rich-text > p, :scope > p') ?? [])]
    .filter((paragraph) => !paragraph.querySelector('img, picture, svg'))
    .map(textOf)
    .filter(Boolean)

  // Notebook posts build their body on the client, so the markup holds no prose
  // to read; fall back to the description the page already advertises, which
  // comes from the post's own `excerpt` frontmatter.
  if (!paragraphs.length) {
    return document.querySelector('meta[property="og:description"]')?.content || ''
  }

  const [first, second] = paragraphs
  return second && first.length < SHORT_PARAGRAPH ? `${first} ${second}` : first
}

/* Everything the cards need from one rendered post page, or null if the page
 * turns out not to be a blog post after all.
 */
export function readPost (html) {
  const { document } = new JSDOM(html).window
  const article = document.querySelector('article.blog-post')
  if (!article) return null

  return {
    title: textOf(document.querySelector('title')),
    categories: textOf(article.querySelector('.categories')).split(/,\s*/).filter(Boolean),
    date: textOf(article.querySelector('header time')),
    excerpt: readExcerpt(article.querySelector('.content'), document),
    // Whatever post.webc decided to advertise as this post's preview image.
    openGraphImage: document.querySelector('meta[property="og:image"]')?.content
  }
}
