import { test } from 'node:test'
import assert from 'node:assert/strict'

import { lch } from '../config/utils/social/colors.js'
import { readPost } from '../config/utils/social/extract.js'
import { rendererFingerprint } from '../config/utils/social/fingerprint.js'
import { socialImageUrl } from '../config/utils/social/index.js'
import {
  charsPerLine,
  clampToLines,
  fitFontSize,
  fitProse,
  linesInHeight,
  takeLines,
  truncateToSentence,
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

/* Fitting prose ----------------------------------------------------------- */

// 40 characters to the line, at these dimensions.
const PROSE = { width: 864, fontSize: 36 }

test('truncateToSentence keeps the most whole sentences that fit', () => {
  const text = 'One two three. Four five six seven eight nine. Ten.'

  assert.equal(truncateToSentence(text, { ...PROSE, maxLines: 1 }), 'One two three.')
  // Two lines is the whole thing, so nothing is given up.
  assert.equal(truncateToSentence(text, { ...PROSE, maxLines: 2 }), text)
})

test('truncateToSentence does not mistake an abbreviation for a sentence end', () => {
  // A cut after "e.g." would leave a fragment; the sentence proper ends later.
  const text = 'Some tools, e.g. a mask, help here. A second sentence follows on.'
  assert.equal(truncateToSentence(text, { ...PROSE, maxLines: 1 }), 'Some tools, e.g. a mask, help here.')
})

test('truncateToSentence keeps closing punctuation with the sentence', () => {
  const text = 'He said "go away." Then a much longer second sentence carried on and on.'
  assert.equal(truncateToSentence(text, { ...PROSE, maxLines: 1 }), 'He said "go away."')
})

test('truncateToSentence gives up when not even one sentence fits', () => {
  const text = 'A single sentence far longer than the space it has been given here.'
  assert.equal(truncateToSentence(text, { ...PROSE, maxLines: 1 }), null)
})

test('fitProse takes both paragraphs when they fit', () => {
  const paragraphs = ['A short opener.', 'And a short second.']
  assert.deepEqual(fitProse(paragraphs, { ...PROSE, maxLines: 6 }), paragraphs)
})

test('fitProse drops to one paragraph when both will not fit', () => {
  const paragraphs = ['A short opener.', 'And a short second.']
  assert.deepEqual(fitProse(paragraphs, { ...PROSE, maxLines: 1 }), ['A short opener.'])
})

test('fitProse budgets a blank line between paragraphs', () => {
  // Two one-line paragraphs need three lines: one each, plus the gap.
  const paragraphs = ['One line here.', 'One line there.']
  assert.deepEqual(fitProse(paragraphs, { ...PROSE, maxLines: 2 }), ['One line here.'])
  assert.deepEqual(fitProse(paragraphs, { ...PROSE, maxLines: 3 }), paragraphs)
})

test('fitProse never takes more than two paragraphs', () => {
  const paragraphs = ['One.', 'Two.', 'Three.']
  assert.deepEqual(fitProse(paragraphs, { ...PROSE, maxLines: 20 }), ['One.', 'Two.'])
})

test('fitProse cuts a long paragraph at a sentence end, with no ellipsis', () => {
  const text = 'One two three. Four five six seven eight. Nine ten eleven twelve thirteen fourteen.'
  const [fitted] = fitProse([text], { ...PROSE, maxLines: 2 })

  assert.equal(fitted, 'One two three. Four five six seven eight.')
  assert.ok(!fitted.endsWith('…'), 'a sentence-boundary cut needs no ellipsis')
})

test('fitProse falls back to an ellipsis only when no sentence fits', () => {
  const text = 'A single unbroken sentence that is far longer than the two lines it has been given to live in'
  const [fitted] = fitProse([text], { ...PROSE, maxLines: 2 })

  assert.ok(fitted.endsWith('…'), fitted)
  assert.ok(text.startsWith(fitted.slice(0, -1)), 'expected a prefix of the original')
})

test('fitProse returns nothing when there is no prose', () => {
  assert.deepEqual(fitProse([], { ...PROSE, maxLines: 6 }), [])
})

/* The card layouts budget a fixed number of lines for the excerpt and Satori
 * cannot report an overflow, so this is the property the whole pipeline exists
 * to guarantee: whatever comes back fits, and comes from the post.
 */
test('fitProse output always fits its budget and comes from the source', () => {
  const fragments = [
    'All week I have seen insects landing.',
    'It was quiet.',
    'Roughly a century ago, labor organizing gradually, but successfully, reduced the work week.',
    'See https://chromamine.com/2025/07/share-links-thoughtfully?fbclid=IwY2xjawLbtGF for more.',
    'Mr. Smith went to Washington, D.C. and stayed.',
    'Supercalifragilisticexpialidociousandthensomemore.'
  ]

  for (const width of [300, 640, 864]) {
    for (const fontSize of [24, 36, 52]) {
      for (const maxLines of [1, 2, 5, 12]) {
        for (let i = 0; i < fragments.length; i++) {
          const paragraphs = [fragments[i], fragments[(i + 1) % fragments.length]]
          const shown = fitProse(paragraphs, { width, fontSize, maxLines })
          if (!shown.length) continue

          const columns = charsPerLine(width, fontSize)
          const used = shown.reduce((n, p) => n + wrap(p, columns).length, 0) + shown.length - 1
          assert.ok(used <= maxLines, `${used} lines used of ${maxLines}: ${JSON.stringify(shown)}`)

          shown.forEach((paragraph, index) => {
            const body = paragraph.endsWith('…') ? paragraph.slice(0, -1) : paragraph
            assert.ok(paragraphs[index].startsWith(body), `not from the post: ${paragraph}`)
          })
        }
      }
    }
  }
})

test('a long category list is held to the one line the layout budgets', () => {
  const many = ['Dance', 'Software', 'Life', 'Miscellany', 'Politics', 'Photography']
  const clamped = clampToLines(many.join(', '), { width: 936, fontSize: 28, maxLines: 1 })

  assert.equal(wrap(clamped, charsPerLine(936, 28)).length, 1)
})

/* URLs -------------------------------------------------------------------- */

test('socialImageUrl names both cards from the post slug', () => {
  assert.equal(socialImageUrl('dragonflies'), '/media/social/og/dragonflies.png')
  assert.equal(socialImageUrl('dragonflies', 'opengraph'), '/media/social/og/dragonflies.png')
  assert.equal(socialImageUrl('dragonflies', 'story'), '/media/social/story/dragonflies.png')
})

test('socialImageUrl keeps a -story slug clear of the story frames', () => {
  // Told apart by a suffix, these two would be the same file.
  assert.notEqual(socialImageUrl('my-trip-story'), socialImageUrl('my-trip', 'story'))
})

test('takeLines cuts from the original, keeping hard-broken words intact', () => {
  const title = 'Supercalifragilisticexpialidocious and friends'

  assert.equal(takeLines(title, 20, 3), title)
  // Rejoining the wrapped lines would put a space inside the long word.
  assert.equal(takeLines(title, 20, 2), 'Supercalifragilisticexpialidocious and')
})

test('clampToLines cuts into a word too long to drop back from', () => {
  const url = 'https://chromamine.com/2025/07/share-links-thoughtfully-with-my-ios-shortcut/'
  const clamped = clampToLines(url, { width: 400, fontSize: 33.3, maxLines: 2 })

  assert.ok(clamped.endsWith('…'))
  assert.ok(url.startsWith(clamped.slice(0, -1)), clamped)
  assert.ok(!clamped.includes(' '), `no space may be introduced: ${clamped}`)
})

test('rendererFingerprint hashes the renderer to a stable short digest', async () => {
  const fingerprint = await rendererFingerprint()

  assert.match(fingerprint, /^[0-9a-f]{12}$/)
  assert.equal(await rendererFingerprint(), fingerprint)
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

test('readPost returns the post prose paragraph by paragraph', () => {
  const post = readPost(page({ body: '<p>First paragraph.</p><p>Second paragraph.</p>' }))
  assert.deepEqual(post.paragraphs, ['First paragraph.', 'Second paragraph.'])
})

test('readPost skips a leading image and its caption', () => {
  const post = readPost(page({
    body: '<p><picture><img src="/pond.jpg" alt=""></picture><em>A caption.</em></p>' +
      '<p>The real opening sentence.</p>'
  }))

  assert.deepEqual(post.paragraphs, ['The real opening sentence.'])
})

test('readPost normalizes whitespace in the prose', () => {
  const post = readPost(page({ body: '<p>One\n  two\tthree</p>' }))
  assert.deepEqual(post.paragraphs, ['One two three'])
})

test('readPost falls back to the page description when the body has no prose', () => {
  // Observable notebook posts build their body on the client.
  const post = readPost(page({
    head: '<meta property="og:description" content="From the post frontmatter.">',
    body: '<div id="notebook"></div><script>define()</script>'
  }))

  assert.deepEqual(post.paragraphs, ['From the post frontmatter.'])
})

test('readPost yields no paragraphs when there is nothing to read', () => {
  const post = readPost(page({ body: '<div id="notebook"></div>' }))
  assert.deepEqual(post.paragraphs, [])
})
