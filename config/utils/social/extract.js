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
 * How much of it to use is left to the card, which is the only thing that knows
 * how much room there is. Paragraphs carrying an image are skipped, so a post
 * that opens with a photo and its caption is still described by its first real
 * sentence.
 */
function readParagraphs (content, document) {
  const paragraphs = [...(content?.querySelectorAll(':scope > rich-text > p, :scope > p') ?? [])]
    .filter((paragraph) => !paragraph.querySelector('img, picture, svg'))
    .map(textOf)
    .filter(Boolean)

  if (paragraphs.length) return paragraphs

  // Notebook posts build their body on the client, so the markup holds no prose
  // to read; fall back to the description the page already advertises, which
  // comes from the post's own `excerpt` frontmatter.
  const described = document.querySelector('meta[property="og:description"]')?.content
  return described ? [described] : []
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
