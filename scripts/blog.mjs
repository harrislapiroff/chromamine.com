import path from "path"
import { fileURLToPath } from "url"
import { program } from "commander"
import yaml from "yaml"
import fs from "fs"
import child_process from "child_process"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_POST_DIR = path.join(__dirname, '..', 'src', 'posts')
const EDITOR = 'code'

const slugify = (value) => value.toLowerCase().replace(/\s/g, '-')

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
        // Open blog post in editor
        console.log(editor, filepath)
        child_process.spawn(editor, [filepath], {
            stdio: 'inherit'
        })
    })

program.parse()
