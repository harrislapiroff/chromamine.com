/* The two social card layouts, rendered with Satori and sharp.
 *
 * Both cards restate the top of a blog post as it appears on the site in dark
 * mode: the "Hi, I'm Harris Lapiroff." site header, then the post's categories,
 * title (with its hanging pilcrow) and date, over the faded peonies backdrop.
 *
 * Satori draws the text to an SVG with the glyphs embedded as paths, so sharp
 * can rasterize it without needing the fonts itself. It renders onto a
 * transparent canvas and is composited over ./backdrop.js, which sharp can
 * build far more cheaply than Satori could draw a 4MB SVG pattern.
 */

import satori from 'satori'
import sharp from 'sharp'

import { backdrop } from './backdrop.js'
import { loadFonts } from './fonts.js'
import { charsPerLine, clampToLines, fitFontSize, linesInHeight, wrap } from './text.js'
import {
  BASE_LINE_HEIGHT,
  BASE_FONT_SIZE,
  colors,
  fontFamily,
  weightBold,
  weightNormal
} from './theme.js'

// The site's line-height as a unitless ratio, so the cards keep its rhythm.
const LINE_HEIGHT = BASE_LINE_HEIGHT / BASE_FONT_SIZE

// The vertical space one line of text at `fontSize` occupies.
const lineBox = (fontSize) => Math.ceil(fontSize * LINE_HEIGHT)

// Open Graph's standard 1.91:1, and Instagram's 9:16 story frame.
export const OPEN_GRAPH_SIZE = { width: 1200, height: 630 }
export const STORY_SIZE = { width: 1080, height: 1920 }

const el = (style, children) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } })
const text = (style, children) => ({ type: 'span', props: { style, children } })

/* "Hi, I'm Harris Lapiroff." — src/_components/site-header.webc.
 *
 * The name is the only bold part. Satori collapses whitespace between spans, so
 * the space before it is a non-breaking one.
 */
const siteHeader = (fontSize) => el(
  { fontSize, lineHeight: LINE_HEIGHT, color: colors.base },
  [
    text({}, 'Hi, I\'m\u00a0'),
    text({ fontWeight: weightBold }, 'Harris Lapiroff'),
    text({}, '.')
  ]
)

// A single muted line: the date under a post title, or the site name in the
// footer. The category line above a title is the same, in italics.
const oneLine = (value, fontSize, { italic = false } = {}) => el(
  { fontSize, lineHeight: LINE_HEIGHT, color: colors.muted, ...(italic ? { fontStyle: 'italic' } : {}) },
  [text({}, value)]
)

/* Choose the size a title should be set at, and work out how it breaks.
 *
 * Satori cannot report an overflow, so a title that would run past the space it
 * has steps down the scale until it fits, and is clipped if even the smallest
 * size overruns. The height it settles on is returned too, so the story card
 * can give the excerpt whatever the title did not use.
 */
function fitTitle (title, { width, height, sizes }) {
  const fontSize = fitFontSize(title, { width, height, lineHeight: LINE_HEIGHT, sizes })
  const lines = wrap(title, charsPerLine(width, fontSize))
    .slice(0, linesInHeight(height, fontSize, LINE_HEIGHT))

  return { fontSize, text: lines.join(' '), height: lines.length * lineBox(fontSize) }
}

/* The post title, with the pilcrow hanging in the margin the way
 * page-title.webc floats it 2ch to the left of the text column.
 */
const postTitle = ({ fontSize, text: title }) => {
  const hang = fontSize * 0.6 * 2

  return el(
    { fontSize, lineHeight: LINE_HEIGHT, fontWeight: weightBold, color: colors.striking },
    [
      text({ width: hang, marginLeft: -hang, flexShrink: 0, color: colors.link }, '¶'),
      text({}, title)
    ]
  )
}

const page = ({ x, y }, children) => el(
  {
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    paddingLeft: x,
    paddingRight: x,
    paddingTop: y,
    paddingBottom: y,
    fontFamily,
    fontWeight: weightNormal
  },
  children
)

async function rasterize (tree, { width, height }) {
  const svg = await satori(tree, { width, height, fonts: await loadFonts() })

  return sharp(await backdrop(width, height))
    .composite([{ input: await sharp(Buffer.from(svg)).png().toBuffer() }])
    .png()
    .toBuffer()
}

/* The link preview card shown by Mastodon, Facebook, iMessage and friends.
 *
 * Used only for posts with no image of their own — a post that has one should
 * lead with that instead.
 */
export function renderOpenGraphCard ({ title, categories = [], date }) {
  const padding = { x: 96, y: 96 }
  const gap = 12
  const type = { header: 32, meta: 28 }
  const measure = OPEN_GRAPH_SIZE.width - padding.x * 2

  // The site header, the footer, and the category and date lines each take one
  // line; the title is sized to whatever is left between them.
  const metaLines = (categories.length ? 1 : 0) + (date ? 1 : 0)
  const title_ = fitTitle(title, {
    width: measure,
    height: OPEN_GRAPH_SIZE.height - padding.y * 2 -
      lineBox(type.header) - lineBox(type.meta) -
      metaLines * (lineBox(type.meta) + gap),
    sizes: [72, 64, 56, 48, 40]
  })

  return rasterize(
    page(padding, [
      siteHeader(type.header),
      el({ flexDirection: 'column', flexGrow: 1, justifyContent: 'center', gap }, [
        ...(categories.length ? [oneLine(categories.join(', '), type.meta, { italic: true })] : []),
        postTitle(title_),
        ...(date ? [oneLine(date, type.meta)] : [])
      ]),
      oneLine('chromamine.com', type.meta)
    ]),
    OPEN_GRAPH_SIZE
  )
}

/* A 1080×1920 story frame, generated for every post: the same header and title,
 * plus enough of the opening prose to be worth reading on its own.
 *
 * The title may take up to half the frame and the excerpt takes what is left,
 * so a long headline shortens the quotation rather than pushing it off the
 * bottom of the image.
 */
export function renderStoryCard ({ title, categories = [], date, excerpt }) {
  // Instagram lays its own chrome — the account header, the reply bar — over
  // the top and bottom of a story, so the card keeps well clear of both.
  const padding = { x: 104, y: 200 }
  const gap = 16
  const excerptGap = 40
  const type = { header: 40, meta: 32, body: 36 }
  const measure = STORY_SIZE.width - padding.x * 2
  const available = STORY_SIZE.height - padding.y * 2

  // Past this the frame stops being a quotation and starts being an essay; a
  // longer opening paragraph is cut short with an ellipsis instead.
  const MAX_EXCERPT_LINES = 12

  const metaLines = (categories.length ? 1 : 0) + (date ? 1 : 0)
  const title_ = fitTitle(title, {
    width: measure,
    height: available / 2,
    sizes: [80, 72, 64, 56, 48]
  })

  const excerptLines = Math.min(
    MAX_EXCERPT_LINES,
    linesInHeight(
      available - lineBox(type.header) - lineBox(type.meta) -
        metaLines * (lineBox(type.meta) + gap) - title_.height - gap - excerptGap,
      type.body,
      LINE_HEIGHT
    )
  )

  return rasterize(
    page(padding, [
      siteHeader(type.header),
      el({ flexDirection: 'column', flexGrow: 1, justifyContent: 'center', gap }, [
        ...(categories.length ? [oneLine(categories.join(', '), type.meta, { italic: true })] : []),
        postTitle(title_),
        ...(date ? [oneLine(date, type.meta)] : []),
        ...(excerpt
          ? [el(
              { marginTop: excerptGap, fontSize: type.body, lineHeight: LINE_HEIGHT, color: colors.base },
              [text({}, clampToLines(excerpt, { width: measure, fontSize: type.body, maxLines: excerptLines }))]
            )]
          : [])
      ]),
      oneLine('chromamine.com', type.meta)
    ]),
    STORY_SIZE
  )
}
