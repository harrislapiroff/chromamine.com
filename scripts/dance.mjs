import path from 'path'
import { fileURLToPath } from 'url'
import { program } from 'commander'
import fs from 'fs'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DANCE_EVENTS_DIR = path.join(__dirname, '..', 'src', 'dance', 'events')
const SCRIPTS_DATA_DIR = path.join(__dirname, 'data')

// Build the sorted, de-duplicated list of dances from a collection of event
// `program` values (each the `program` field parsed from an event's
// frontmatter). Kept as a pure function so it can be unit tested without
// touching the filesystem.
export function extractDances(programs) {
  const danceMap = new Map()

  programs.forEach((program) => {
    if (!program) return

    // Iterate through all sets in the program
    program.forEach((set) => {
      set.forEach((dance) => {
        const title = dance.title
        const author = dance.author

        if (!title || !author) return

        // For medleys, split them out
        if (dance.medley) {
          const titles = title.replace(/^Medley:\s*/i, '').split(',').map(s => s.trim())
          const authors = author.split(',').map(s => s.trim())

          titles.forEach((t, i) => {
            const a = authors[i] || authors[0]
            if (!danceMap.has(t) || danceMap.get(t).author === a) {
              danceMap.set(t, { author: a, count: (danceMap.get(t)?.count || 0) + 1 })
            }
          })
        } else {
          if (!danceMap.has(title) || danceMap.get(title).author === author) {
            danceMap.set(title, { author, count: (danceMap.get(title)?.count || 0) + 1 })
          }
        }
      })
    })
  })

  // Convert map to sorted array
  return Array.from(danceMap.entries())
    .map(([title, { author, count }]) => ({ title, author, count }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

program
  .name('dance')
  .description('Dance event manipulation tool')

program.command('extract-dances')
  .description('Extract all unique dances from event files to create a reference')
  .action(() => {
    const files = fs.readdirSync(DANCE_EVENTS_DIR)

    const programs = files
      .filter((file) => file.endsWith('.md'))
      .map((file) => {
        const content = fs.readFileSync(path.join(DANCE_EVENTS_DIR, file), 'utf-8')
        const { data } = matter(content)
        return data.program
      })

    const dances = extractDances(programs)

    // Ensure the data directory exists
    if (!fs.existsSync(SCRIPTS_DATA_DIR)) {
      fs.mkdirSync(SCRIPTS_DATA_DIR, { recursive: true })
    }

    // Write to JSON file
    const outputPath = path.join(SCRIPTS_DATA_DIR, 'dances.json')
    fs.writeFileSync(outputPath, JSON.stringify(dances, null, 2))

    console.log(`Extracted ${dances.length} unique dances to ${outputPath}`)
  })

// Only run the CLI when executed directly, so importing this module (e.g. from
// tests) doesn't trigger argument parsing.
if (process.argv[1] === __filename) {
  program.parse()
}
