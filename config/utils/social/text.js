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

/* Greedy word wrap, matching how the browser breaks a paragraph. Words longer
 * than the measure are hard-broken rather than allowed to overhang.
 */
export function wrap (text, columns) {
  const lines = []
  let line = ''

  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) {
      line = word
    } else if (line.length + 1 + word.length <= columns) {
      line += ' ' + word
    } else {
      lines.push(line)
      line = word
    }

    while (line.length > columns) {
      lines.push(line.slice(0, columns))
      line = line.slice(columns)
    }
  }

  if (line) lines.push(line)
  return lines
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
  const lines = wrap(text, columns)
  if (lines.length <= maxLines) return text

  const kept = lines.slice(0, maxLines).join(' ')
  // Leave room for the ellipsis, then drop back to the last whole word.
  const trimmed = kept.slice(0, kept.length - 1).replace(/[\s,;:.!?—–-]*\S*$/, '')
  return (trimmed || kept) + '…'
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
