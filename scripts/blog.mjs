import path from 'path'
import { fileURLToPath } from 'url'
import { program } from 'commander'
import fs from 'fs'
import child_process from 'child_process'

import {
  BLOG_POST_DIR,
  BLOG_POST_FORMATS,
  MEDIA_DIR,
  SORT_FUNCTIONS,
  assertSafeSlug,
  bold,
  findPost,
  formatDate,
  linked,
  parseLimit,
  readContentDir,
  readContentFile,
  serializeFrontmatter,
  slugifyFilename,
  today,
  writeNewFile
} from './lib/content.js'
import {
  convertToJpeg,
  insertBlocks,
  isSupportedImage,
  makeTempDir,
  markdownImage,
  needsConversion,
  readClipboard,
  targetFilename,
  uniqueFilename
} from './lib/media.js'
import { exiftoolVersion, findLocation, stripLocation } from './lib/location.js'
import { format } from 'date-fns'

const __filename = fileURLToPath(import.meta.url)

// Resolve the editor to use.
// Precedence: $VISUAL -> $EDITOR -> fallback to VS Code ("code --wait").
// Using $VISUAL first follows conventional CLI tooling behaviour.
const EDITOR = process.env.VISUAL || process.env.EDITOR || 'code --wait'

// Frontmatter template for a new post. Exported for testing.
//
// xposts is deliberately NOT included here -- see XPOSTS_STUB.
export function newPostFrontmatter(title, date = today()) {
  return {
    title,
    date,
    categories: [],
    tags: [],
    eleventyExcludeFromCollections: true
  }
}

// The cross-post block is emitted commented out, because a live `url: TBD`
// would render a broken link. Every post in the corpus that has not been
// cross-posted yet carries this block commented out, so this matches what the
// author was doing by hand. `blog publish` uncomments it.
export const XPOSTS_STUB = `# xposts:
#   - label: Mastodon
#     url: TBD
#   - label: Facebook
#     url: TBD
`

// Exit with a message rather than an unhandled stack trace.
function fail(message) {
  console.error(`Error: ${message}`)
  process.exit(1)
}

program
  .name('blog')
  .description('Blog post manipulation tool')

program.command('new <title> [slug]')
  .description('Create a new blog post')
  .option('-e, --editor <editor>', 'Editor to open blog post in', EDITOR)
  .option('--no-open', 'Do not open the post in an editor')
  .action((title, slug, { editor, open }) => {
    let postSlug
    try {
      postSlug = assertSafeSlug(slug || slugifyFilename(title))
    } catch (err) {
      return fail(err.message)
    }

    const filepath = path.join(BLOG_POST_DIR, `${postSlug}.md`)
    const mediaDir = path.join(MEDIA_DIR, postSlug)

    // Check before writing anything, so a collision can never cost us a post.
    const existing = findPost(postSlug)
    if (existing) {
      return fail(`A post with the slug "${postSlug}" already exists: ${existing}`)
    }

    // Insert the commented cross-post stub inside the frontmatter fence.
    const frontmatter = serializeFrontmatter(newPostFrontmatter(title))
      .replace(/---\n$/, XPOSTS_STUB + '---\n')

    try {
      writeNewFile(filepath, frontmatter + '\n')
    } catch (err) {
      return fail(err.message)
    }
    console.log(`Created ${filepath}`)

    // recursive:true so a leftover media directory is not a fatal error.
    fs.mkdirSync(mediaDir, { recursive: true })
    console.log(`Created ${mediaDir}`)

    if (!open) return

    // Spawn the editor. Use a shell so that "editor" may contain flags
    // (e.g. "code --wait" or "vim -O").
    child_process.spawn(editor, [filepath], {
      stdio: 'inherit',
      shell: true,
      env: process.env
    })
  })

program.command('list')
  .description('List all blog posts')
  .option('-l, --limit <limit>', 'Limit the number of posts to display (set to 0 to list all)', '5')
  .option('-s, --sort <type>', 'Type of sorting to use', '-date')
  .option('-d, --drafts', 'Only show drafts and posts with unfilled cross-post URLs')
  .addHelpText('after', `
Sort values: ${Object.keys(SORT_FUNCTIONS).join(', ')}`)
  .action(({ limit, sort, drafts }) => {
    if (!Object.hasOwn(SORT_FUNCTIONS, sort)) {
      return fail(`--sort must be one of: ${Object.keys(SORT_FUNCTIONS).join(', ')} (got "${sort}")`)
    }

    let max
    try {
      max = parseLimit(limit)
    } catch (err) {
      return fail(err.message)
    }

    let entries
    try {
      entries = readContentDir(BLOG_POST_DIR, { extensions: BLOG_POST_FORMATS })
    } catch (err) {
      return fail(err.message)
    }

    let posts = entries
      .map(({ data, path: filepath }) => ({ ...data, path: `file://${filepath}` }))
      .filter((post) => post.title)

    if (drafts) {
      posts = posts.filter((post) =>
        post.eleventyExcludeFromCollections ||
        (post.xposts || []).some((x) => x.url === 'TBD')
      )
    }

    posts = posts.toSorted(SORT_FUNCTIONS[sort])

    const outputPosts = max === 0 ? posts : posts.slice(0, max)

    outputPosts.forEach((post) => {
      const flags = []
      if (post.eleventyExcludeFromCollections) flags.push('draft')
      if ((post.xposts || []).some((x) => x.url === 'TBD')) flags.push('xposts TBD')
      const suffix = flags.length ? ` [${flags.join(', ')}]` : ''
      console.log(`${bold(linked(post.title, post.path))} ${formatDate(post.date)}${suffix}`)
    })

    if (posts.length === 0) console.log('No posts found.')
    else if (max !== 0 && posts.length > max) {
      console.log(`... and ${posts.length - max} more (run with --limit 0 to see all)`)
    }
  })

program.command('publish <slug>')
  .description('Mark a draft as published and fill in cross-post URLs')
  .option('-m, --mastodon <url>', 'Mastodon cross-post URL')
  .option('-f, --facebook <url>', 'Facebook cross-post URL')
  .action((slug, options) => {
    let postSlug
    try {
      postSlug = assertSafeSlug(slug)
    } catch (err) {
      return fail(err.message)
    }

    const filepath = findPost(postSlug)
    if (!filepath) return fail(`No post found with the slug "${postSlug}"`)

    const raw = fs.readFileSync(filepath, 'utf-8')
    const { data } = readContentFile(filepath)

    const changes = []
    let updated = raw

    if (data.eleventyExcludeFromCollections) {
      updated = removeFrontmatterLine(updated, 'eleventyExcludeFromCollections')
      changes.push('removed draft flag')
    }

    const urls = [['Mastodon', options.mastodon], ['Facebook', options.facebook]]
    if (urls.some(([, url]) => url)) {
      const uncommented = uncommentXposts(updated)
      if (uncommented !== updated) {
        updated = uncommented
        changes.push('uncommented xposts block')
      }
    }

    for (const [label, url] of urls) {
      if (!url) continue
      const next = setXpostUrl(updated, label, url)
      if (next === updated) {
        console.warn(`Warning: no "${label}" entry in xposts; leaving it alone`)
      } else {
        updated = next
        changes.push(`set ${label} URL`)
      }
    }

    // Drop any entry still reading TBD, rather than shipping a broken link.
    const pruned = dropTbdXposts(updated)
    if (pruned !== updated) {
      updated = pruned
      changes.push('dropped unfilled cross-post entries')
    }

    if (!changes.length) {
      console.log(`Nothing to do: ${path.basename(filepath)} is already published with no cross-post URLs to fill.`)
      return
    }

    fs.writeFileSync(filepath, updated)
    console.log(`Updated ${filepath}\n  ${changes.join('\n  ')}`)

    const remaining = (readContentFile(filepath).data.xposts || []).filter((x) => x.url === 'TBD')
    if (remaining.length) {
      console.log(`  still TBD: ${remaining.map((x) => x.label).join(', ')}`)
    }
  })

program.command('image <post> [files...]')
  .description('Add images to a post\'s media directory and embed them (default: from the clipboard)')
  .option('-l, --line <n>', 'Line to embed at, 1-based (default: end of the post)')
  .option('--pasteboard <name>', 'Read from a named pasteboard instead of the clipboard (for testing)')
  .addHelpText('after', `
<post> is a slug or a path to the post file. With no files, takes whatever is
on the clipboard: files copied in Finder, or image data such as a screenshot.
HEIC, TIFF and raw files are converted to JPEG; GPS metadata is stripped.`)
  .action((post, files, { line, pasteboard }) => {
    const postPath = fs.existsSync(post) ? path.resolve(post) : findPost(post)
    if (!postPath) return fail(`No post found for "${post}"`)

    let slug
    try {
      slug = assertSafeSlug(path.basename(postPath, path.extname(postPath)))
    } catch (err) {
      return fail(err.message)
    }

    const lineNumber = line === undefined ? Infinity : Number(line)
    if (lineNumber !== Infinity && !(Number.isInteger(lineNumber) && lineNumber >= 1)) return fail(`--line must be a positive integer, got "${line}"`)

    const tmpDir = makeTempDir()
    let error = null
    try {
      let sources = files.map((file) => ({ kind: 'file', path: path.resolve(file) }))
      if (!sources.length) sources = readClipboard({ dataDir: tmpDir, pasteboard })
      if (!sources.length) throw new Error('The clipboard has no files or image data on it.')

      const unsupported = sources.filter((source) => !isSupportedImage(source.path))
      if (unsupported.length) {
        throw new Error(`Not an image format this can handle:\n  ${unsupported.map((s) => s.path).join('\n  ')}`)
      }
      const missing = sources.filter((source) => !fs.existsSync(source.path))
      if (missing.length) throw new Error(`File not found:\n  ${missing.map((s) => s.path).join('\n  ')}`)

      // Check the insertion point before copying anything, so a bad cursor
      // position does not leave orphaned files behind.
      const raw = fs.readFileSync(postPath, 'utf-8')
      insertBlocks(raw, lineNumber, [''])

      const mediaDir = path.join(MEDIA_DIR, slug)
      fs.mkdirSync(mediaDir, { recursive: true })

      const added = []
      for (const source of sources) {
        // Pasted data has no name of its own; date it so it sorts sensibly.
        const named = source.kind === 'data'
          ? path.join(path.dirname(source.path), `image-${format(new Date(), 'yyyyMMdd-HHmmss')}${path.extname(source.path)}`)
          : source.path

        // A file already in the media directory (say, dropped there through
        // Zed's project panel) only needs embedding, unless it needs converting.
        if (path.dirname(source.path) === mediaDir && !needsConversion(source.path)) {
          added.push({ filename: path.basename(source.path), copied: false })
          continue
        }

        const filename = uniqueFilename(mediaDir, targetFilename(named))
        const destination = path.join(mediaDir, filename)
        if (needsConversion(source.path)) convertToJpeg(source.path, destination)
        else fs.copyFileSync(source.path, destination, fs.constants.COPYFILE_EXCL)
        added.push({ filename, copied: true, converted: needsConversion(source.path), from: source.kind === 'file' ? source.path : 'clipboard' })
      }

      // The pre-commit hook would catch location data anyway, but cleaning it
      // here means the file on disk is never the one carrying it.
      const copied = added.filter((item) => item.copied).map((item) => path.join(mediaDir, item.filename))
      let stripped = []
      if (copied.length) {
        if (exiftoolVersion()) {
          stripped = findLocation(copied).map((hit) => path.basename(hit.file))
          stripLocation(stripped.map((name) => path.join(mediaDir, name)))
        } else {
          console.warn('Warning: exiftool is not installed, so GPS data was not checked. The pre-commit hook will refuse to commit these until it is.')
        }
      }

      const snippets = added.map((item) => markdownImage(slug, item.filename))
      fs.writeFileSync(postPath, insertBlocks(fs.readFileSync(postPath, 'utf-8'), lineNumber, snippets))

      for (const item of added) {
        const notes = []
        if (item.converted) notes.push('converted to JPEG')
        if (stripped.includes(item.filename)) notes.push('GPS removed')
        const from = item.copied ? ` <- ${item.from}` : ''
        console.log(`${path.relative(process.cwd(), path.join(mediaDir, item.filename))}${from}${notes.length ? ` (${notes.join(', ')})` : ''}`)
      }
      console.log(`Embedded ${added.length} image(s) in ${path.basename(postPath)}. Remember the alt text.`)
    } catch (err) {
      error = err
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
    if (error) fail(error.message)
  })

// Split a file into [frontmatter, rest] so edits stay inside the frontmatter
// block. Returns null when the file has no frontmatter.
function splitFrontmatter(raw) {
  const match = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)/)
  if (!match) return null
  return { open: match[1], body: match[2], close: match[3], rest: raw.slice(match[0].length) }
}

// Remove a top-level frontmatter key, preserving all other formatting.
//
// Edits are done line-by-line rather than by re-serializing, so publishing a
// post does not reformat frontmatter the author hand-wrote.
export function removeFrontmatterLine(raw, key) {
  const parts = splitFrontmatter(raw)
  if (!parts) return raw
  const kept = parts.body.split('\n').filter((line) => !new RegExp(`^${key}\\s*:`).test(line))
  return parts.open + kept.join('\n') + parts.close + parts.rest
}

// Uncomment a commented-out `# xposts:` block so its URLs can be filled in.
// Returns the input unchanged when there is no commented block.
export function uncommentXposts(raw) {
  const parts = splitFrontmatter(raw)
  if (!parts) return raw

  const lines = parts.body.split('\n')
  const start = lines.findIndex((line) => /^#\s*xposts:\s*$/.test(line))
  if (start === -1) return raw

  let end = start + 1
  while (end < lines.length && /^\s*#/.test(lines[end])) end++

  for (let i = start; i < end; i++) {
    lines[i] = lines[i].replace(/^(\s*)#\s?/, '$1')
  }
  return parts.open + lines.join('\n') + parts.close + parts.rest
}

// Remove xposts list items whose url is still TBD, so publishing never emits a
// link pointing at the literal string "TBD".
export function dropTbdXposts(raw) {
  const parts = splitFrontmatter(raw)
  if (!parts) return raw

  const lines = parts.body.split('\n')
  const start = lines.findIndex((line) => /^xposts:\s*$/.test(line))
  if (start === -1) return raw

  // Collect the bounds of each list item in the block.
  let end = start + 1
  while (end < lines.length && /^\s+\S/.test(lines[end])) end++

  const kept = []
  let item = null
  for (let i = start + 1; i < end; i++) {
    if (/^\s*-\s/.test(lines[i])) {
      if (item) kept.push(item)
      item = []
    }
    if (item) item.push(lines[i])
  }
  if (item) kept.push(item)

  const surviving = kept.filter((entry) => !entry.some((l) => /url:\s*TBD\s*$/.test(l)))
  if (surviving.length === kept.length) return raw

  const rebuilt = surviving.length
    ? [lines[start], ...surviving.flat()]
    : [] // no cross-posts at all: drop the key entirely

  const next = [...lines.slice(0, start), ...rebuilt, ...lines.slice(end)]
  return parts.open + next.join('\n') + parts.close + parts.rest
}

// Set the `url` of the xposts entry with the given label, preserving all other
// formatting. Returns the input unchanged when no such entry exists.
export function setXpostUrl(raw, label, url) {
  const parts = splitFrontmatter(raw)
  if (!parts) return raw

  const lines = parts.body.split('\n')
  const labelIndex = lines.findIndex((line) =>
    new RegExp(`^\\s*-?\\s*label:\\s*['"]?${label}['"]?\\s*$`, 'i').test(line)
  )
  if (labelIndex === -1) return raw

  // The url may sit on either side of the label within the same list item.
  for (let i = labelIndex + 1; i < lines.length; i++) {
    if (/^\s*-\s/.test(lines[i])) break // next list item
    const match = lines[i].match(/^(\s*)url:\s*(.*)$/)
    if (match) {
      lines[i] = `${match[1]}url: ${url}`
      return parts.open + lines.join('\n') + parts.close + parts.rest
    }
  }
  return raw
}

// Only run the CLI when executed directly, so importing this module (e.g. from
// tests) doesn't trigger argument parsing.
if (process.argv[1] === __filename) {
  program.parse()
}
