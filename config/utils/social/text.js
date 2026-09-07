/* Line-fitting helpers for the social cards.
 *
 * Satori lays text out itself, but it won't tell us how many lines it used, and
 * a card that silently overflows is worse than one with a smaller headline. The
 * site is set entirely in IBM Plex Mono, though, so line breaks are predictable:
 * every glyph is exactly 0.6em wide, and the wrap points can be computed here
 * before handing the text over.
 */

// IBM Plex Mono's advance width, as a fraction of the font size.
const ADVANCE = 0.6

export const charsPerLine = (width, fontSize) => Math.max(1, Math.floor(width / (fontSize * ADVANCE)))

/* Greedy word wrap, reported as slices of the original text.
 *
 * Each line records where it ends in `text`, so a caller wanting the part that
 * fits can cut it from the original. Rebuilding it by joining the wrapped lines
 * instead would put a space inside any word long enough to have been
 * hard-broken across a line ending — a URL, most often.
 */
function wrapLines (text, columns) {
  const lines = []
  let line = ''
  let end = 0

  const push = () => {
    lines.push({ text: line, end })
    line = ''
  }

  for (const { 0: match, index } of text.matchAll(/\S+/g)) {
    let word = match
    let at = index

    if (line && line.length + 1 + word.length > columns) push()

    // A word with no room to fit on a line of its own is broken across lines.
    while (!line && word.length > columns) {
      line = word.slice(0, columns)
      end = at + columns
      push()
      word = word.slice(columns)
      at += columns
    }

    line = line ? `${line} ${word}` : word
    end = at + word.length
  }

  if (line) push()
  return lines
}

/* The lines `text` wraps to at `columns` characters. */
export const wrap = (text, columns) => wrapLines(text, columns).map((line) => line.text)

/* The prefix of `text` that fills at most `maxLines` lines, cut from the
 * original so that hard-broken words keep their spelling.
 */
export function takeLines (text, columns, maxLines) {
  const lines = wrapLines(text, columns)
  return lines.length <= maxLines ? text : text.slice(0, lines[maxLines - 1].end)
}

/* How many lines of `fontSize` text fit in `height`. */
export const linesInHeight = (height, fontSize, lineHeight) =>
  Math.max(1, Math.floor(height / (fontSize * lineHeight)))

/* The largest size from `sizes` at which `text` fits the space it has, so a
 * long headline steps down through the scale instead of overflowing the card.
 *
 * Falls back to the smallest size in the ladder; the caller is expected to
 * clamp the text itself, since past a point no size will fit.
 */
export function fitFontSize (text, { width, height, lineHeight, sizes }) {
  const fits = (size) => wrap(text, charsPerLine(width, size)).length <= linesInHeight(height, size, lineHeight)
  return sizes.find(fits) ?? sizes.at(-1)
}

/* Trim `text` to `maxLines`, ending on a word boundary with an ellipsis. */
export function clampToLines (text, { width, fontSize, maxLines }) {
  const columns = charsPerLine(width, fontSize)
  const kept = takeLines(text, columns, maxLines)
  if (kept === text) return text

  // Leave room for the ellipsis, then drop back to the last whole word.
  const room = kept.slice(0, -1)
  const atWord = room.replace(/[\s,;:.!?—–-]*\S*$/, '')

  // Dropping back is right for prose, but one very long word — a URL, usually —
  // would take whole lines of text with it. Cut into the word instead.
  return (atWord.length >= room.length - columns ? atWord || room : room) + '…'
}

/* The end of the last complete sentence of `text` that fits in `maxLines`, or
 * null if not even the first sentence does.
 *
 * A sentence ends at `.`, `!` or `?` — together with any closing quote or
 * bracket that belongs with it — when what follows starts a new sentence.
 * Requiring a capital next is what keeps "e.g." and "vs." from reading as
 * sentence ends; an initial or a title ("Mr. Smith") can still fool it, which
 * costs a slightly early cut and nothing worse.
 */
export function truncateToSentence (text, { width, fontSize, maxLines }) {
  const columns = charsPerLine(width, fontSize)
  const ends = [...text.matchAll(/[.!?]["')\]’”]*(?=\s+[A-Z“"(]|\s*$)/g)]
    .map((match) => match.index + match[0].length)

  // Longest first: keep as much of the paragraph as will fit.
  for (let i = ends.length - 1; i >= 0; i--) {
    const candidate = text.slice(0, ends[i])
    if (wrap(candidate, columns).length <= maxLines) return candidate
  }

  return null
}

/* Choose how much of a post's opening to show, in whole paragraphs where
 * possible.
 *
 * Preference order: as many complete paragraphs as fit (up to
 * `maxParagraphs`), then as much of the first paragraph as ends on a complete
 * sentence. Cutting mid-sentence is the last resort, and only happens when a
 * single sentence is longer than the space available.
 *
 * Returns the paragraphs to set, so the card can space them as the site does.
 */
export function fitProse (paragraphs, { width, fontSize, maxLines, maxParagraphs = 2 }) {
  const columns = charsPerLine(width, fontSize)
  const usable = paragraphs.filter(Boolean).slice(0, maxParagraphs)
  if (!usable.length) return []

  // Paragraphs are separated by a blank line, as the stylesheet's margin does.
  const totalLines = (chosen) =>
    chosen.reduce((lines, paragraph) => lines + wrap(paragraph, columns).length, 0) +
    chosen.length - 1

  for (let count = usable.length; count > 1; count--) {
    const chosen = usable.slice(0, count)
    if (totalLines(chosen) <= maxLines) return chosen
  }

  const [first] = usable
  if (wrap(first, columns).length <= maxLines) return [first]

  return [
    truncateToSentence(first, { width, fontSize, maxLines }) ??
      clampToLines(first, { width, fontSize, maxLines })
  ]
}
