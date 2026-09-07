import { test } from 'node:test'
import assert from 'node:assert/strict'

import { lch } from '../config/utils/social/colors.js'
import { readPost } from '../config/utils/social/extract.js'
import { socialImageUrl } from '../config/utils/social/index.js'
import {
  charsPerLine,
  clampToLines,
  fitFontSize,
  linesInHeight,
  wrap
} from '../config/utils/social/text.js'

/* Colors ------------------------------------------------------------------ */

test('lch resolves an in-gamut color to sRGB', () => {
  // --color-almost-black and --color-75-white, the dark-mode page background
  // and body text (src/static/styles/_variables.sass).
  assert.equal(lch(10, 2, 87), '#1c1b19')
  assert.equal(lch(75, 2, 87), '#bab8b5')
})

test('lch resolves greys with no chroma', () => {
  assert.equal(lch(0, 0, 0), '#000000')
  assert.equal(lch(100, 0, 0), '#ffffff')
})

test('lch gamut-maps a color outside sRGB instead of clipping it', () => {
  // --color-pink-brighter, the dark-mode link color, is far outside sRGB.
  const pink = lch(50, 132, 339)
  assert.match(pink, /^#[0-9a-f]{6}$/)

  const [r, g, b] = [1, 3, 5].map((i) => parseInt(pink.slice(i, i + 2), 16))
  // Naive channel clipping drives this to a fully saturated #ff00cc and shifts
  // the hue; gamut mapping keeps it a pink that sRGB can actually show.
  assert.ok(r > b && b > g, `expected a magenta-leaning pink, got ${pink}`)
  assert.ok(r < 255, `expected chroma to be reduced, got ${pink}`)
})

/* Text fitting ------------------------------------------------------------ */

test('charsPerLine measures IBM Plex Mono at 0.6em per glyph', () => {
  assert.equal(charsPerLine(600, 10), 100)
  assert.equal(charsPerLine(1008, 64), 26)
  // Never returns zero, however narrow the measure.
  assert.equal(charsPerLine(1, 64), 1)
})

test('wrap breaks on whitespace within the measure', () => {
  assert.deepEqual(wrap('one two three four', 9), ['one two', 'three', 'four'])
})

test('wrap hard-breaks a word longer than the measure', () => {
  assert.deepEqual(wrap('supercalifragilistic', 8), ['supercal', 'ifragili', 'stic'])
})

test('wrap collapses runs of whitespace', () => {
  assert.deepEqual(wrap('  one \n\n two  ', 20), ['one two'])
})

test('linesInHeight counts whole lines and never returns zero', () => {
  assert.equal(linesInHeight(300, 32, 1.5625), 6)
  assert.equal(linesInHeight(10, 32, 1.5625), 1)
})

test('fitFontSize keeps the largest size that fits the space', () => {
  const sizes = [72, 64, 56, 48, 40]
  // Two words fit on one line even at the top of the scale.
  assert.equal(fitFontSize('Short title', { width: 1008, height: 400, lineHeight: 1.5625, sizes }), 72)
})

test('fitFontSize steps down the scale for a title that would overflow', () => {
  const sizes = [72, 64, 56, 48, 40]
  const title = 'Signal is not appropriate for military communication, whether you use it well or not'
  const size = fitFontSize(title, { width: 1008, height: 232, lineHeight: 1.5625, sizes })

  assert.ok(size < 72, `expected a smaller size than 72, got ${size}`)
  const lines = wrap(title, charsPerLine(1008, size)).length
  assert.ok(lines * size * 1.5625 <= 232, `expected ${lines} lines at ${size}px to fit 232px`)
})

test('fitFontSize falls back to the smallest size when nothing fits', () => {
  const sizes = [72, 64, 56]
  assert.equal(fitFontSize('x'.repeat(2000), { width: 200, height: 100, lineHeight: 1.5625, sizes }), 56)
})

test('clampToLines leaves text that already fits alone', () => {
  const text = 'A short opening paragraph.'
  assert.equal(clampToLines(text, { width: 880, fontSize: 36, maxLines: 4 }), text)
})

test('clampToLines trims to a whole word and marks the cut', () => {
  const text = 'All week I have seen insects landing. I was lying on my stomach on a small dock by the pond.'
  const clamped = clampToLines(text, { width: 400, fontSize: 36, maxLines: 2 })

  assert.ok(clamped.endsWith('…'))
  assert.ok(text.startsWith(clamped.slice(0, -1)), 'expected a prefix of the original text')
  // The ellipsis should follow a word, not a partial one or a stray space.
  assert.match(clamped, /\w…$/)
})

/* URLs -------------------------------------------------------------------- */

test('socialImageUrl names both cards from the post slug', () => {
  assert.equal(socialImageUrl('dragonflies'), '/media/social/dragonflies.png')
  assert.equal(socialImageUrl('dragonflies', 'opengraph'), '/media/social/dragonflies.png')
  assert.equal(socialImageUrl('dragonflies', 'story'), '/media/social/dragonflies-story.png')
})

/* Reading a rendered post ------------------------------------------------- */

const page = ({ head = '', body }) => `<!doctype html><html><head>
  <title>We're not as pretty as the dragonflies.</title>${head}
</head><body>
  <article class="blog-post">
    <header>
      <div class="categories">Life, Dance</div>
      <time datetime="2013-08-03T00:00:00.000Z">August 03, 2013</time>
    </header>
    <div class="content"><rich-text class="rich-text">${body}</rich-text></div>
  </article>
</body></html>`

test('readPost reads the title, categories and date from the rendered page', () => {
  const post = readPost(page({ body: '<p>First paragraph.</p>' }))

  assert.equal(post.title, "We're not as pretty as the dragonflies.")
  assert.deepEqual(post.categories, ['Life', 'Dance'])
  assert.equal(post.date, 'August 03, 2013')
})

test('readPost returns null for a page that is not a blog post', () => {
  assert.equal(readPost('<!doctype html><html><body><main>Archive</main></body></html>'), null)
})

test('readPost reports no categories rather than an empty one', () => {
  const post = readPost(page({ body: '<p>First.</p>' }).replace('Life, Dance', ''))
  assert.deepEqual(post.categories, [])
})

test('readPost surfaces the preview image the page advertises', () => {
  const post = readPost(page({
    head: '<meta property="og:image" content="https://chromamine.com/media/social/dragonflies.png">',
    body: '<p>First.</p>'
  }))

  assert.equal(post.openGraphImage, 'https://chromamine.com/media/social/dragonflies.png')
})

test('readPost takes only the first paragraph when it stands on its own', () => {
  const first = 'A'.repeat(300)
  const post = readPost(page({ body: `<p>${first}</p><p>Second paragraph.</p>` }))

  assert.equal(post.excerpt, first)
})

test('readPost adds the second paragraph when the first is short', () => {
  const post = readPost(page({ body: '<p>Short opener.</p><p>And the rest.</p>' }))
  assert.equal(post.excerpt, 'Short opener. And the rest.')
})

test('readPost skips a leading image and its caption', () => {
  const post = readPost(page({
    body: '<p><picture><img src="/pond.jpg" alt=""></picture><em>A caption.</em></p>' +
      '<p>' + 'The real opening sentence. '.repeat(12) + '</p>'
  }))

  assert.ok(post.excerpt.startsWith('The real opening sentence.'), post.excerpt)
})

test('readPost normalizes whitespace in the excerpt', () => {
  const post = readPost(page({ body: '<p>One\n  two\tthree</p><p>Four.</p>' }))
  assert.equal(post.excerpt, 'One two three Four.')
})

test('readPost falls back to the page description when the body has no prose', () => {
  // Observable notebook posts build their body on the client.
  const post = readPost(page({
    head: '<meta property="og:description" content="From the post frontmatter.">',
    body: '<div id="notebook"></div><script>define()</script>'
  }))

  assert.equal(post.excerpt, 'From the post frontmatter.')
})

test('readPost yields an empty excerpt when there is nothing to read', () => {
  const post = readPost(page({ body: '<div id="notebook"></div>' }))
  assert.equal(post.excerpt, '')
})
