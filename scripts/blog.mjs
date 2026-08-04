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
