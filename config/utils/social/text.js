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
