/* Reading a rendered blog post back out of its own HTML.
 *
 * The social images are built from the pages the site just produced rather than
 * from the markdown behind them, because that is the only place all of it
 * exists at once: a notebook post has no prose in its source, and post.webc has
 * already worked out which image the post leads with.
 */

import { JSDOM } from 'jsdom'

const textOf = (node) => node?.textContent.replace(/\s+/g, ' ').trim() || ''

/* The opening prose of a post, paragraph by paragraph.
 *
 * A description the post wrote for itself (`seoDescription`, else `excerpt`,
 * the same order og:description takes them) wins, since it was written to be
 * shared. post.webc advertises it as the page's description only when the
 * frontmatter sets one.
 *
 * Otherwise how much of the body to use is left to the card, which is the only
 * thing that knows how much room there is. Paragraphs carrying an image are
 * skipped, so a post that opens with a photo and its caption is still described
 * by its first real sentence. Notebook posts build their body on the client, so
 * without a description they have no prose to read at all.
 */
function readParagraphs (content, document) {
  const described = document.querySelector('meta[name="description"]')?.content
    .replace(/\s+/g, ' ').trim()
  if (described) return [described]

  return [...(content?.querySelectorAll(':scope > rich-text > p, :scope > p') ?? [])]
    .filter((paragraph) => !paragraph.querySelector('img, picture, svg'))
    .map(textOf)
    .filter(Boolean)
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
    paragraphs: readParagraphs(article.querySelector('.content'), document),
    // Whatever post.webc decided to advertise as this post's preview image.
    openGraphImage: document.querySelector('meta[property="og:image"]')?.content
  }
}
