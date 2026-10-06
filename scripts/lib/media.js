// Adding images to a post: pulling them off the clipboard, converting them to
// something a browser and eleventy-img can read, and embedding them.
//
// Used by `blog image`, which the Zed task in .zed/tasks.json runs. Everything
// that touches the system (clipboard, sips) is macOS-only; the text helpers are
// pure so they can be tested anywhere.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { slugifyFilename } from './content.js'

// Formats that go into the media directory as they are. Everything else that
// sips can read -- HEIC from a phone, TIFF, camera raw -- becomes a JPEG.
//
// HEIC is the case that matters: the prebuilt sharp eleventy-img uses has no
// HEVC decoder, so a .heic in src/media would break the build.
export const WEB_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'
])

export const CONVERTIBLE_EXTENSIONS = new Set([
  '.heic', '.heif', '.tif', '.tiff', '.bmp', '.dng', '.cr2', '.nef', '.arw',
  '.raf', '.orf', '.rw2'
])

export const JPEG_QUALITY = 90

export function needsConversion(filePath) {
  return CONVERTIBLE_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

export function isSupportedImage(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return WEB_EXTENSIONS.has(ext) || CONVERTIBLE_EXTENSIONS.has(ext)
}

// The filename an image will have in the media directory: slugified, with the
// extension it will have after any conversion. `IMG 0042.HEIC` -> img-0042.jpg.
export function targetFilename(sourcePath) {
  const ext = path.extname(sourcePath)
  const stem = slugifyFilename(path.basename(sourcePath, ext)) || 'image'
  if (needsConversion(sourcePath)) return `${stem}.jpg`
  const lower = ext.toLowerCase()
  return `${stem}${lower === '.jpeg' ? '.jpg' : lower}`
}

// Append -2, -3, ... until the name is free, so adding an image never
// overwrites one already in the post.
export function uniqueFilename(dir, filename, exists = fs.existsSync) {
  const ext = path.extname(filename)
  const stem = path.basename(filename, ext)
  let candidate = filename
  for (let n = 2; exists(path.join(dir, candidate)); n++) {
    candidate = `${stem}-${n}${ext}`
  }
  return candidate
}

export function markdownImage(slug, filename, alt = '') {
  return `![${alt}](/media/${slug}/${filename})`
}

// Line index just past the frontmatter, or 0 when there is none.
function bodyStart(lines) {
  if (!/^---\s*$/.test(lines[0] ?? '')) return 0
  const close = lines.findIndex((line, i) => i > 0 && /^---\s*$/.test(line))
  return close === -1 ? 0 : close + 1
}

// Insert block-level snippets (one paragraph each) at a 1-based line number,
// which is what Zed hands a task as $ZED_ROW.
//
// A blank cursor line is replaced; otherwise the images go after the cursor
// line, so a paragraph is never split mid-sentence. Blank lines are added
// around them as needed, because markdown only treats an image as its own
// paragraph when it is set off from the text around it.
export function insertBlocks(raw, line, snippets) {
  const lines = raw.split('\n')
  const start = bodyStart(lines)

  let index = Math.min(Math.max(line, 1), lines.length) - 1
  if (index < start) {
    throw new Error(`Line ${line} is inside the frontmatter; move the cursor into the post body.`)
  }

  let before, after
  if (lines[index].trim() === '') {
    before = lines.slice(0, index)
    after = lines.slice(index + 1)
  } else {
    before = lines.slice(0, index + 1)
    after = lines.slice(index + 1)
  }

  const block = snippets.flatMap((snippet, i) => (i ? ['', snippet] : [snippet]))
  if (before.length && before.at(-1).trim() !== '') block.unshift('')
  // A file ending in a newline splits into a trailing '' that already
  // separates the block from end-of-file.
  if (!after.length || after[0].trim() !== '') block.push('')

  return [...before, ...block, ...after].join('\n')
}

// --- macOS integration -------------------------------------------------------

// Reads whatever is on the pasteboard that could be an image. File references
// win (a ⌘C in Finder); failing that, raw image data (a screenshot copied with
// ⌃⇧⌘4, or an image copied out of a browser) is written into `dataDir`.
//
// Output is one `file\t<path>` or `data\t<path>` line per item. The pasteboard
// name is a parameter so tests can use a private one instead of the clipboard.
const CLIPBOARD_SCRIPT = `
ObjC.import('AppKit')
function run(argv) {
  const [dataDir, name] = argv
  const pb = name ? $.NSPasteboard.pasteboardWithName(name) : $.NSPasteboard.generalPasteboard
  const fileOnly = $.NSDictionary.dictionaryWithObjectForKey(true, 'NSPasteboardURLReadingFileURLsOnlyKey')
  const urls = pb.readObjectsForClassesOptions($.NSArray.arrayWithObject($.NSURL), fileOnly)
  const out = []
  if (urls && urls.count > 0) {
    for (let i = 0; i < urls.count; i++) out.push('file\\t' + urls.objectAtIndex(i).path.js)
    return out.join('\\n')
  }
  const types = [['public.png', 'png'], ['public.jpeg', 'jpg'], ['public.heic', 'heic'], ['public.tiff', 'tiff']]
  for (const [type, ext] of types) {
    const data = pb.dataForType(type)
    if (data && data.length > 0) {
      const file = dataDir + '/pasted.' + ext
      data.writeToFileAtomically(file, true)
      return 'data\\t' + file
    }
  }
  return ''
}
`

// Returns [{kind: 'file' | 'data', path}]. Data items live in a temp directory
// the caller should remove once they have been copied.
export function readClipboard({ dataDir, pasteboard } = {}) {
  const result = spawnSync(
    'osascript',
    ['-l', 'JavaScript', '-e', CLIPBOARD_SCRIPT, dataDir, ...(pasteboard ? [pasteboard] : [])],
    { encoding: 'utf8' }
  )
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`Could not read the clipboard:\n${result.stderr}`)
  }
  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [kind, ...rest] = line.split('\t')
      return { kind, path: rest.join('\t') }
    })
}

export function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'blog-image-'))
}

// Convert to JPEG with sips, which ships with macOS and decodes HEIC natively.
export function convertToJpeg(source, destination, quality = JPEG_QUALITY) {
  const result = spawnSync(
    'sips',
    ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality), source, '--out', destination],
    { encoding: 'utf8' }
  )
  if (result.error) throw result.error
  if (result.status !== 0 || !fs.existsSync(destination)) {
    throw new Error(`sips could not convert ${source}:\n${result.stderr || result.stdout}`)
  }
}
