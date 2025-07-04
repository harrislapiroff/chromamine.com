import path from "path"
import { fileURLToPath } from "url"
import { program } from "commander"
import yaml from "yaml"
import fs from "fs"
import child_process from "child_process"

import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_POST_DIR = path.join(__dirname, '..', 'src', 'posts')
const MEDIA_DIR = path.join(__dirname, '..', 'src', 'media')
const EDITOR = process.env.EDITOR || 'code'

const slugify = (value) => value.toLowerCase().replace(/\s/g, '-')

const linked = (text, link) => `\u001b]8;;${link}\u001b\\${text}\u001b]8;;\u001b\\`
const bold = (text) => `\u001b[1m${text}\u001b[22m`

program
    .name('blog')
    .description('Blog post manipulation tool')

program.command('new <title> [slug]')
    .description('Create a new blog post')
    .option('-e, --editor <editor>', 'Editor to open blog post in', EDITOR)
    .action((title, slug, { editor }) => {
        const frontmatter = {
            title,
            date: new Date().toISOString().split('T')[0],
            categories: [],
            tags: [],
            eleventyExcludeFromCollections: true,
            xposts: [{
                label: 'Mastodon',
                url: 'TBD'
            }, {
                label: 'Facebook',
                url: 'TBD'
            }]
        }
        // Write frontmatter to file in posts directory
        const filename = (slug || slugify(title)) + '.md'
        const filepath = path.join(BLOG_POST_DIR, filename)
        fs.writeFileSync(
            filepath,
            '---\n' + yaml.stringify(frontmatter) + '---\n\n'
        )
        console.log(`Created ${filepath}`)

        // Create a media directory for the post with the same slug
        const mediaDir = path.join(MEDIA_DIR, slug || slugify(title))
        fs.mkdirSync(mediaDir)
        console.log(`Created ${mediaDir}`)

        // Open blog post in editor
        console.log(editor, filepath)
        child_process.spawn(editor, [filepath], {
            stdio: 'inherit'
        })
    })

const SORT_FUNCTIONS = {
    '-date': (a, b) => new Date(b.date) - new Date(a.date),
    'date': (a, b) => new Date(a.date) - new Date(b.date),
    '-title': (a, b) => b.title.localeCompare(a.title),
    'title': (a, b) => a.title.localeCompare(b.title)
}

program.command('list')
    .description('List all blog posts')
    .option('-l, --limit <limit>', 'Limit the number of posts to display (set to 0 to list all)', 5)
    .option('-s, --sort <type>', 'Type of sorting to use', '-date')
    .action(({ limit, sort }) => {
        const sortFn = SORT_FUNCTIONS[sort]

        // Read all files in the blog post directory
        const files = fs.readdirSync(BLOG_POST_DIR)

        // Loop through each file
        const posts = files.map((file) => {
            // Read the file content
            const content = fs.readFileSync(path.join(BLOG_POST_DIR, file), 'utf-8')

            // Parse the front matter using gray-matter
            const { data } = matter(content)

            return {
                ...data,
                path: `file://${BLOG_POST_DIR}/${file}`
            }
        })
        // Filter out files that don't have a title--those aren't posts
        .filter((post) => post.title)
        // Sort the posts as specified
        .toSorted(sortFn)

        // Limit the number of posts (unless limit is 0)
        const outputPosts = +limit === 0 ? posts : posts.slice(0, limit)

        // Print the list of posts
        outputPosts.forEach((post) => {
            console.log(`${bold(linked(post.title, post.path))} ${(new Date(post.date).toLocaleDateString())}`)
        })

        if (+limit !== 0 && posts.length > limit) console.log(`... and ${posts.length - limit} more (run with --limit 0 to see all)`)
    })


program.parse()
