import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { program } from 'commander'

import {
  BLOG_POST_DIR,
  BLOG_POST_FORMATS,
  DANCE_EVENTS_DIR,
  MEDIA_DIR,
  ROOT_DIR,
  readContentDir,
  toDateParts
} from './lib/content.js'
import { ExiftoolMissingError, findLocation, isMediaPath } from './lib/location.js'

const __filename = fileURLToPath(import.meta.url)

const SRC_DIR = path.join(ROOT_DIR, 'src')

// Frontmatter keys currently in use. Anything outside these sets is either a
// typo or a new field that should be added here deliberately.
const POST_KEYS = new Set([
  'title', 'date', 'categories', 'tags', 'xposts', 'images', 'excerpt',
  'seoImage', 'seoDescription', 'dances', 'eleventyExcludeFromCollections',
  'layout', 'permalink'
])

const EVENT_KEYS = new Set([
  'name', 'date', 'date_end', 'city', 'tzid', 'band', 'bandURL', 'program',
  'street', 'url', 'description', 'layout', 'permalink'
])

const DANCE_KEYS = new Set(['title', 'author', 'type', 'notes', 'caller', 'medley'])

// Keys that no template reads. Worth surfacing so authors stop hand-writing
// metadata that never reaches the HTML.
//
// `excerpt`, `seoImage` and `seoDescription` used to be listed here; post.webc
// now reads all three to fill in the Open Graph tags, and `seoImage` also
// decides whether the post needs a generated preview card.
const UNCONSUMED_POST_KEYS = new Set()

class Report {
  constructor() {
    this.errors = []
    this.warnings = []
  }

  error(file, message) {
    this.errors.push({ file, message })
  }

  warn(file, message) {
    this.warnings.push({ file, message })
  }

  print({ errorsOnly = false } = {}) {
    const groups = new Map()
    const add = (level, { file, message }) => {
      if (!groups.has(file)) groups.set(file, [])
      groups.get(file).push({ level, message })
    }
    this.errors.forEach((e) => add('error', e))
    if (!errorsOnly) this.warnings.forEach((w) => add('warning', w))

    for (const [file, items] of [...groups.entries()].sort()) {
      console.log(`\n${file}`)
      for (const { level, message } of items) {
        console.log(`  ${level === 'error' ? 'error' : 'warn '}  ${message}`)
      }
    }

    console.log(
      `\n${this.errors.length} error(s), ${this.warnings.length} warning(s)`
    )
  }
}

// Pull every media reference out of a post body.
//
// Deliberately not a markdown parse: references also appear inside Liquid
// shortcodes (e.g. `{% button "..." "/media/foo/Some File.shortcut" %}`), and
// filenames may contain spaces, so we scan for quoted and bracketed targets.
export function extractMediaRefs(body) {
  const refs = new Set()
  // Patterns must never span a newline: prose is full of apostrophes, and a
  // quote class that allows \n will happily swallow whole paragraphs.
  const patterns = [
    /\]\(([^)\n]+)\)/g,               // markdown links and images
    /"([^"\n]*\/media\/[^"\n]*)"/g    // shortcode args and HTML attributes
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(body)) !== null) {
      const target = match[1].trim().split(/\s+"/)[0] // drop markdown titles
      if (!target.includes('/media/')) continue
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) continue // external URL
      refs.add(target.split('#')[0].split('?')[0])
    }
  }
  return [...refs]
}

// Resolve a media reference the way the build does.
// See config/markdown.js: absolute paths are rooted at src/, relative paths are
// resolved against the post's own directory.
export function resolveMediaRef(ref, postDir) {
  const decoded = safeDecode(ref)
  return decoded.startsWith('/')
    ? path.join(SRC_DIR, decoded)
    : path.join(postDir, decoded)
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function checkPosts(report) {
  const posts = readContentDir(BLOG_POST_DIR, {
    extensions: BLOG_POST_FORMATS,
    onError: (message) => report.error('src/posts', message)
  })

  const usedMediaDirs = new Set()

  for (const post of posts) {
    const rel = path.relative(ROOT_DIR, post.path)

    for (const key of Object.keys(post.data)) {
      if (!POST_KEYS.has(key)) {
        report.warn(rel, `unknown frontmatter key "${key}"`)
      } else if (UNCONSUMED_POST_KEYS.has(key)) {
        report.warn(rel, `frontmatter key "${key}" is not read by any template`)
      }
    }

    if (!post.data.title) report.error(rel, 'missing title')
    if (!toDateParts(post.data.date)) report.error(rel, 'missing or unparseable date')

    // Body references
    for (const ref of extractMediaRefs(post.content)) {
      const resolved = resolveMediaRef(ref, path.dirname(post.path))
      if (resolved.startsWith(MEDIA_DIR)) usedMediaDirs.add(mediaDirOf(resolved))
      if (!fs.existsSync(resolved)) {
        report.error(rel, `media reference does not exist: ${ref}`)
      }
    }

    // `images` frontmatter, which the {% image %} shortcode resolves against
    // src/media/<fileSlug>/ -- see config/shortcodes/image.js
    const images = post.data.images
    const entries = Array.isArray(images)
      ? images
      : images && typeof images === 'object' ? Object.values(images) : []

    if (entries.length) usedMediaDirs.add(path.join(MEDIA_DIR, post.slug))

    // A known top-level key nested under `images` is an indentation slip: the
    // key silently stops being read. This is how a post ended up with its
    // xposts links never rendering.
    if (images && !Array.isArray(images) && typeof images === 'object') {
      for (const key of Object.keys(images)) {
        if (POST_KEYS.has(key)) {
          report.error(
            rel,
            `"${key}" is nested under "images" and is therefore ignored -- it should be a top-level key`
          )
        }
      }
    }

    for (const image of entries) {
      if (!image || typeof image !== 'object') continue
      if (!image.src) {
        report.error(rel, 'an images entry has no src')
        continue
      }
      const resolved = path.join(MEDIA_DIR, post.slug, safeDecode(image.src))
      if (!fs.existsSync(resolved)) {
        report.error(
          rel,
          `images.src does not exist: src/media/${post.slug}/${image.src}`
        )
      }
      if (!image.alt) report.warn(rel, `image "${image.src}" has no alt text`)
    }

    if (post.data.seoImage) {
      const resolved = resolveMediaRef(post.data.seoImage, path.dirname(post.path))
      if (!fs.existsSync(resolved)) {
        report.error(rel, `seoImage does not exist: ${post.data.seoImage}`)
      }
    }
  }

  return { posts, usedMediaDirs }
}

function mediaDirOf(resolvedPath) {
  const rel = path.relative(MEDIA_DIR, resolvedPath)
  return path.join(MEDIA_DIR, rel.split(path.sep)[0])
}

function checkMediaDirs(report, posts, usedMediaDirs) {
  if (!fs.existsSync(MEDIA_DIR)) return

  const postSlugs = new Set(posts.map((p) => p.slug))
  // Standalone pages (src/*.md) may also own a media directory.
  for (const entry of fs.readdirSync(SRC_DIR, { withFileTypes: true })) {
    if (entry.isFile()) postSlugs.add(path.basename(entry.name, path.extname(entry.name)))
  }

  for (const entry of fs.readdirSync(MEDIA_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const dir = path.join(MEDIA_DIR, entry.name)
    if (postSlugs.has(entry.name)) continue
    if (usedMediaDirs.has(dir)) continue

    const empty = fs.readdirSync(dir).length === 0
    report.warn(
      `src/media/${entry.name}`,
      empty
        ? 'empty media directory with no matching post'
        : 'media directory has no matching post slug and is not referenced by any post'
    )
  }

  // A post that uses {% image %} needs a directory named for its slug, because
  // the shortcode hard-codes fileSlug.
  for (const post of posts) {
    if (!post.data.images) continue
    const dir = path.join(MEDIA_DIR, post.slug)
    if (!fs.existsSync(dir)) {
      report.error(
        path.relative(ROOT_DIR, post.path),
        `uses images frontmatter but src/media/${post.slug}/ does not exist`
      )
    }
  }
}

function checkDanceEvents(report) {
  if (!fs.existsSync(DANCE_EVENTS_DIR)) return

  const events = readContentDir(DANCE_EVENTS_DIR, {
    extensions: ['md'],
    onError: (message) => report.error('src/dance/events', message)
  })

  for (const event of events) {
    const rel = path.relative(ROOT_DIR, event.path)

    for (const key of Object.keys(event.data)) {
      if (!EVENT_KEYS.has(key)) report.warn(rel, `unknown frontmatter key "${key}"`)
    }

    if (!/^\d{4}-\d{2}-\d{2}-/.test(event.file)) {
      report.warn(rel, 'filename does not follow the YYYY-MM-DD-venue convention')
    }

    const start = event.data.date ? new Date(event.data.date) : null
    const end = event.data.date_end ? new Date(event.data.date_end) : null
    if (start && isNaN(start)) report.error(rel, 'unparseable date')
    if (end && isNaN(end)) report.error(rel, 'unparseable date_end')
    if (start && end && !isNaN(start) && !isNaN(end)) {
      // Equal timestamps just mean no times were recorded (both are date-only),
      // which is a real authoring pattern rather than a mistake.
      if (+end < +start) report.error(rel, 'date_end is before date')
      else if (+end === +start) report.warn(rel, 'date_end is identical to date (no times recorded)')
    }

    const prog = event.data.program
    if (prog === undefined) continue
    if (!Array.isArray(prog)) {
      report.error(rel, 'program must be a list of sets')
      continue
    }
    prog.forEach((set, i) => {
      if (!Array.isArray(set)) {
        report.error(rel, `program set ${i + 1} must be a list of dances`)
        return
      }
      set.forEach((dance, j) => {
        if (!dance || typeof dance !== 'object') return
        const where = `set ${i + 1}, dance ${j + 1}`
        if (!dance.title) report.error(rel, `${where} has no title`)
        for (const key of Object.keys(dance)) {
          if (!DANCE_KEYS.has(key)) {
            const hint = key === 'note' ? ' (did you mean "notes"? the layout only renders "notes")' : ''
            report.warn(rel, `${where}: unknown key "${key}"${hint}`)
          }
        }
      })
    })
  }
}

// Assert the two slugify implementations agree on every tag in use.
//
// Photos must not carry GPS metadata.
//
// The pre-commit hook in .githooks/ is what actually keeps this true; this
// check is the backstop that notices when the hook was bypassed with
// --no-verify, or was never installed because `npm install` has not been run
// since the repo was cloned.
//
// Walks src/ rather than asking git, so a photo that is merely sitting in the
// working tree unstaged still gets reported.
function checkImageLocation(report) {
  const files = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (isMediaPath(full)) files.push(full)
    }
  }
  walk(SRC_DIR)
  if (!files.length) return

  let hits
  try {
    hits = findLocation(files)
  } catch (error) {
    if (error instanceof ExiftoolMissingError) {
      report.warn('media', 'exiftool is not installed, so photos were not checked for location data')
      return
    }
    throw error
  }

  for (const { file, tags } of hits) {
    report.error(
      path.relative(ROOT_DIR, file),
      `carries location metadata (${tags.join(', ')}); run \`npm run strip-location\``
    )
  }
}

// config/filters.js builds the tag permalink; the inline slugify in
// src/_components/blog-post-tags.webc builds the links pointing at it. They use
// different algorithms, so a tag with punctuation or a double space would make
// the link 404. All current tags agree -- this pins that.
async function checkTagSlugs(report, posts) {
  const { slugify: permalinkSlugify } = await import('../config/filters.js')
  const linkSlugify = (str) =>
    str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const tags = new Set()
  for (const post of posts) for (const tag of post.data.tags || []) tags.add(tag)

  for (const tag of [...tags].sort()) {
    const permalink = permalinkSlugify(tag)
    const link = linkSlugify(tag)
    if (permalink !== link) {
      report.error(
        'tags',
        `tag "${tag}" slugs to "${permalink}" for its permalink but "${link}" for links to it`
      )
    }
  }
}

program
  .name('validate')
  .description('Check content for broken references and frontmatter problems')
  .option('--errors-only', 'Show only errors, suppressing warnings')
  .option('--strict', 'Exit non-zero on warnings as well as errors')
  .action(async ({ errorsOnly, strict }) => {
    const report = new Report()

    const { posts, usedMediaDirs } = checkPosts(report)
    checkMediaDirs(report, posts, usedMediaDirs)
    checkDanceEvents(report)
    checkImageLocation(report)
    await checkTagSlugs(report, posts)

    report.print({ errorsOnly })

    if (report.errors.length || (strict && report.warnings.length)) process.exit(1)
  })

if (process.argv[1] === __filename) {
  program.parse()
}
