import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import yaml from 'yaml'
import { format } from 'date-fns'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const ROOT_DIR = path.join(__dirname, '..', '..')
export const BLOG_POST_DIR = path.join(ROOT_DIR, 'src', 'posts')
export const MEDIA_DIR = path.join(ROOT_DIR, 'src', 'media')
export const DANCE_EVENTS_DIR = path.join(ROOT_DIR, 'src', 'dance', 'events')

// Matches the formats Eleventy collects posts from (see eleventy.config.js).
export const BLOG_POST_FORMATS = ['md', 'ojs', 'omd', 'html']

// Slugify a value for use as a filename or directory name.
//
// This is deliberately stricter than the `slugify` filter in config/filters.js:
// that one builds tag permalinks and changing it would rewrite live URLs. This
// one strips anything that has no business in a path, which the looser version
// did not -- it is why `src/media/will-ai-eat-everything?/` exists on disk.
export function slugifyFilename(value) {
  return String(value)
    .toLowerCase()
    .replace(/['‘’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Reject slugs that would escape the directory they are joined onto. The slug
// is an untrusted CLI argument that gets handed straight to path.join.
export function assertSafeSlug(slug) {
  if (!slug) throw new Error('Slug may not be empty')
  if (slug !== path.basename(slug) || slug === '..' || slug.includes(path.sep)) {
    throw new Error(`Slug may not contain a path separator: ${slug}`)
  }
  return slug
}

// Pull a timezone-independent {year, month, day} out of a frontmatter date.
//
// YAML parses an unquoted `date: 2026-07-07` into a Date at UTC midnight. Read
// back with local-time getters that becomes the 6th anywhere west of UTC, which
// is why every date in `blog list` used to be a day early.
export function toDateParts(value) {
  if (value instanceof Date) {
    return {
      year: value.getUTCFullYear(),
      month: value.getUTCMonth() + 1,
      day: value.getUTCDate()
    }
  }
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  return { year: +match[1], month: +match[2], day: +match[3] }
}

// Format a frontmatter date for display, without shifting it across a timezone
// boundary. Returns an empty string when the date is missing or unparseable.
export function formatDate(value, pattern = 'M/d/yyyy') {
  const parts = toDateParts(value)
  if (!parts) return ''
  return format(new Date(parts.year, parts.month - 1, parts.day), pattern)
}

// Today's date in the local timezone. `new Date().toISOString()` would give the
// UTC date, dating a post created after 8pm Eastern as tomorrow.
export function today() {
  return format(new Date(), 'yyyy-MM-dd')
}

// Sort comparators shared by `blog list`. Exported so the CLI can offer the
// key list to commander's .choices() rather than silently falling back.
export const SORT_FUNCTIONS = {
  '-date': (a, b) => compareDates(a.date, b.date, true),
  'date': (a, b) => compareDates(a.date, b.date),
  '-title': (a, b) => String(b.title).localeCompare(String(a.title)),
  'title': (a, b) => String(a.title).localeCompare(String(b.title))
}

// Undated posts sort last in both directions, so the direction flag is applied
// to the comparison rather than by swapping the arguments.
function compareDates(a, b, descending = false) {
  const pa = toDateParts(a)
  const pb = toDateParts(b)
  if (!pa && !pb) return 0
  if (!pa) return 1
  if (!pb) return -1
  const cmp = (
    pa.year - pb.year ||
    pa.month - pb.month ||
    pa.day - pb.day
  )
  return descending ? -cmp : cmp
}

// Parse the --limit option. Returns 0 for "no limit".
//
// Previously `--limit abc` produced slice(0, NaN) -> [] and printed nothing at
// all, which was indistinguishable from having no posts.
export function parseLimit(value) {
  const num = Number(value)
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(`--limit must be a non-negative integer, got "${value}"`)
  }
  return num
}

// Read a content directory, parsing frontmatter for each file.
//
// Skips subdirectories (readFileSync on one throws EISDIR and used to kill the
// whole listing) and reports malformed frontmatter per file instead of aborting
// the run with an anonymous YAMLException.
export function readContentDir(dir, { extensions, onError } = {}) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error(`Content directory not found: ${dir}`)
    throw err
  }

  const results = []
  for (const entry of entries) {
    if (!entry.isFile()) continue

    const ext = path.extname(entry.name).slice(1).toLowerCase()
    if (extensions && !extensions.includes(ext)) continue

    const filepath = path.join(dir, entry.name)
    try {
      const raw = fs.readFileSync(filepath, 'utf-8')
      const { data, content } = matter(raw)
      results.push({ file: entry.name, slug: path.basename(entry.name, path.extname(entry.name)), path: filepath, ext, data, content })
    } catch (err) {
      const message = `${entry.name}: ${err.message.split('\n')[0]}`
      if (onError) onError(message, filepath, err)
      else console.warn(`Skipping ${message}`)
    }
  }
  return results
}

// Read a single content file's frontmatter and body.
export function readContentFile(filepath) {
  const raw = fs.readFileSync(filepath, 'utf-8')
  return matter(raw)
}

// Serialize frontmatter the way the existing corpus is written.
//
// Note we use the `yaml` package here rather than matter.stringify(), which
// quotes the date (`date: '2026-08-04'`). All 76 existing posts have it
// unquoted, and Eleventy's permalink computation in posts.11tydata.js reads
// `page.date` as a Date.
export function serializeFrontmatter(data) {
  return '---\n' + yaml.stringify(data) + '---\n'
}

// Write a new content file, refusing to clobber an existing one.
//
// The 'wx' flag is the whole point: `blog new` used to writeFileSync over a
// published post, print "Created", and only then crash on the media directory.
export function writeNewFile(filepath, contents) {
  try {
    fs.writeFileSync(filepath, contents, { flag: 'wx' })
  } catch (err) {
    if (err.code === 'EEXIST') {
      throw new Error(`Refusing to overwrite existing file: ${filepath}`)
    }
    throw err
  }
  return filepath
}

// Resolve a post slug to its file, across all supported post formats.
export function findPost(slug, dir = BLOG_POST_DIR) {
  for (const ext of BLOG_POST_FORMATS) {
    const candidate = path.join(dir, `${slug}.${ext}`)
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

// Terminal formatting, suppressed when stdout is not a TTY so that piping the
// output to a file or pager does not fill it with escape sequences.
const isTTY = () => Boolean(process.stdout.isTTY)
export const linked = (text, link) =>
  isTTY() ? `\u001b]8;;${link}\u001b\\${text}\u001b]8;;\u001b\\` : text
export const bold = (text) => (isTTY() ? `\u001b[1m${text}\u001b[22m` : text)
