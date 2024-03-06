const path = require("node:path")
const pluginRss = require("@11ty/eleventy-plugin-rss")

const blogPostFormats = ['md', 'ojs', 'html']

module.exports = function(eleventyConfig) {
    /* Load CommonJS modules before config
     * see: https://github.com/11ty/eleventy/issues/2675#issuecomment-1338240707
     * ------------------------------------*/
    eleventyConfig.on('eleventy.before', async () => {
        const d3time = await import("d3-time-format")
        const d3format = await import("d3-format")
        const pagefind = await import("pagefind")
        global.d3time = d3time
        global.d3format = d3format
        global.pagefind = pagefind

        const { compileObservable } = await import("./utils/ojs/compile.mjs")
        global.compileObservable = compileObservable
    })

    /* Index site using PageFind
     *-------------------------------------*/
    eleventyConfig.on('eleventy.after', async () => {
        const { index } = await pagefind.createIndex()
        await index.addDirectory({ path: '_site' })
        const { files } = await index.getFiles()
        await index.writeFiles({
            outputPath: '_site/pagefind',
        })
    })

    /* Run ESBuild after building site
     *-------------------------------------*/
    eleventyConfig.on('eleventy.after', async ({ dir, results, runMode, outputMode }) => {
        const esbuild = await import("esbuild")
        const entryPoints = [
            {
                in: path.join(dir.input, 'contra', 'static', 'scripts', 'all.js'),
                out: path.join('contra', 'static', 'scripts', 'all'),
            },
            {
                in: path.join(dir.input, 'static', 'scripts', 'index.js'),
                out: path.join('static', 'scripts', 'index'),
            },
            {
                in: path.join(dir.input, 'static', 'scripts', 'search.js'),
                out: path.join('static', 'scripts', 'search'),
            },
        ]
        await esbuild.build({
            entryPoints,
            outdir: dir.output,
            bundle: true,
            minify: +process.env.PROD ? true : false,
            sourcemap: true,
        })
    })
    eleventyConfig.addWatchTarget('./src/static/scripts/')
    eleventyConfig.addWatchTarget('./src/contra/static/scripts/')

    /* Pass media directory through
     *-------------------------------------*/
    eleventyConfig.addPassthroughCopy("src/media")
    eleventyConfig.addPassthroughCopy("src/contra/media")

    /* Other files through
     *-------------------------------------*/
    eleventyConfig.addPassthroughCopy("src/.well-known")
    eleventyConfig.addPassthroughCopy("src/robots.txt")
    eleventyConfig.addPassthroughCopy("src/_headers")

    /* Add RSS
     *-------------------------------------*/
    eleventyConfig.addPlugin(pluginRss);

    /* Put posts in a collection
     *-------------------------------------*/
    eleventyConfig.addCollection("posts", function(collection) {
        // Add all files in the post directory with a matching file extension
        // to the posts collection
        const arrs = blogPostFormats.map(
            (format) => collection.getFilteredByGlob(`src/posts/*.${format}`)
        ).flat()
        return arrs
    })

    /* Put dance events in a collection
     *-------------------------------------*/
    eleventyConfig.addCollection(
        "danceEvents",
        collection => collection.getFilteredByGlob(`src/contra/events/*.md`)
    )

    /* Add markdown features
     *-------------------------------------*/
    const markdownIt = require("markdown-it")

    // Footnotes and Highlighting are configured via
    // instantiation options
    const markdownFootnotes = require("markdown-it-footnote")
    const markdownContainer = require("markdown-it-container")
    var hljs = require('highlight.js')
    let mdOptions = {
        typographer: true,
        html: true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return (
                        '<pre class="hljs"><code>' +
                        hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                        '</code></pre>'
                    )
                } catch (__) {}
            }

            return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        }
    }
    const md = markdownIt(mdOptions)
        .use(markdownFootnotes)
        .use(markdownContainer, 'update')
        .use(markdownContainer, 'note')

    // Render footnotes simply in an ordered list
    md.renderer.rules.footnote_block_open = () => '<ol class="footnotes">'
    md.renderer.rules.footnote_block_close = () => '</ol>'
    // Use unicode superscript numbers for footnote refs instead of the default
    // behavior of using <sup> tags
    const supNumbers = ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹']
    md.renderer.rules.footnote_caption = (tokens, idx) => {
        let n = Number(tokens[idx].meta.id + 1).toString()
        if (tokens[idx].meta.subId > 0) {
            n += ':' + tokens[idx].meta.subId
        }
        let nStr = n.toString()
        return nStr.split('').map((c) => supNumbers[c]).join('')
    }
    md.renderer.rules.footnote_ref = (tokens, idx, options, env, slf) => {
        const id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
        const caption = slf.rules.footnote_caption(tokens, idx, options, env, slf);
        let refid = id;

        if (tokens[idx].meta.subId > 0) {
            refid += ':' + tokens[idx].meta.subId;
        }

        return '<a href="#fn' + id + '" class="footnote-ref" id="fnref' + refid + '">' + caption + '</a>';
    }

    // Increase h1s to h3 and so forth
    // see: https://github.com/markdown-it/markdown-it/issues/871#issuecomment-1752196424
    const proxy = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options)
    const BASE_HEADING_LEVEL = 3;
    const defaultHeadingOpenRenderer = md.renderer.rules.heading_open || proxy;
    const defaultHeadingCloseRenderer = md.renderer.rules.heading_close || proxy;
    const increase = (tokens, idx) => {
        const tokens_ = {...tokens}
        const level = Number(tokens_[idx].tag[1])
        // Don't go smaller than h6
        if (level < 6) {
            tokens_[idx].tag = tokens_[idx].tag[0] + (level + BASE_HEADING_LEVEL - 1)
        }
        return tokens_
    }
    md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
        increase(tokens, idx);
        return defaultHeadingOpenRenderer(tokens, idx, options, env, self)
    }
    md.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
        increase(tokens, idx);
        return defaultHeadingCloseRenderer(tokens, idx, options, env, self)
    }

    // Responsive Images
    // see: https://tomichen.com/blog/posts/20220416-responsive-images-in-markdown-with-eleventy-image/
    const Image = require("@11ty/eleventy-img")
    const IMAGE_WIDTHS = [640, 1280, 1920]
    md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const naiveSrc = token.attrGet('src')
        // if it's an absolute path, specify the file from the `/src` directory
        // otherwise intelligently concatenate it with the parent dir of the page
        const src = naiveSrc[0] === '/' ? './src' + naiveSrc : path.join(path.dirname(env.page.inputPath), naiveSrc)
        const alt = token.content
        const htmlAttributes = { alt, loading: 'lazy', decoding: 'async' }
        const imgOpts = {
            widths: IMAGE_WIDTHS,
            formats: ['jpeg', 'png', 'webp', 'svg'],
            urlPath: '/media/img/',
            outputDir: './_site/media/img/',
        }
        Image(src, imgOpts)
        const metadata = Image.statsSync(src, imgOpts)
        const generated = Image.generateHTML(
            metadata,
            {
                sizes: '(max-width: 768px) 100vw, 768px',
                ...htmlAttributes
            }
        )
        return generated
    }

    eleventyConfig.setLibrary("md", md)

    /* Image grids
     *-------------------------------------*/
    eleventyConfig.addPairedShortcode("imagegrid", function (content) {
        // Add page data to the env to match the env that gets
        // passed to markdown during normal rendering
        const env = {
            ...this.eleventy.env,
            page: this.page
        }
        const images = content.split('\n')
            // Remove indentation whitespace
            .map((line) => line.trim())
            // Remove blank lines
            .filter(l => l !== '')
            // Then render remaining lines inline to avoid erroneous paragraph tags
            .map((line) => md.renderInline(line, env))
        return [
            `<div class="image-grid">`,
            ...images.map((img) => `<div class="image-grid__item">${img}</div>`),
            `</div>`
        ].join('')
    })

    /* Add sass support
     *-------------------------------------*/
    const pluginRev = require("eleventy-plugin-rev")
    const eleventySass = require("eleventy-sass")
    eleventyConfig.addPlugin(pluginRev)
    eleventyConfig.addPlugin(
        eleventySass,
        {
            rev: true,
            sass: {
                // Allow importing of CSS files from node_modules
                loadPaths: ['./node_modules'],
            },
        }
    )
    // Copy font files from node_modules since they won't be automatically
    // imported with their corresponding CSS
    eleventyConfig.addPassthroughCopy({
        'node_modules/@ibm/plex/IBM-Plex-Mono/fonts/split/woff2/*.woff2': 'static/monotheme'
    })

    /* Custom filters
     *-------------------------------------*/

    // Number formatting
    const numSpellings = [
        "zero","one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
        "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
    ]
    eleventyConfig.addFilter("numFormat", function (value, format) {
        return d3format.format(format)(Number(value))
    })
    eleventyConfig.addFilter("humaneNumFormat", function (value) {
        const num = Number(value)
        if (num < numSpellings.length - 1) return numSpellings[num]
        return d3format.format(".2s")(Number(value))
    })

    // Date formatting
    eleventyConfig.addFilter("dateFormat", function (value, format) {
        const value_ = value instanceof Date ? value : new Date(value)
        return d3time.timeFormat(format)(value_)
    })

    // Slugify
    eleventyConfig.addFilter("slugify", function (value) {
        return value.toLowerCase().replace(/\s/g, '-')
    })

    // Markdown
    eleventyConfig.addFilter("markdown", function (value) {
        return markdownIt(mdOptions).render(value)
    })

    eleventyConfig.addFilter(
        "pluralize",
        (value, singular = '', plural = 's') => value === 1 ? singular : plural
    )

    // getSEOExcerpt and getSEOImage
    const JSDOM = require("jsdom").JSDOM
    eleventyConfig.addFilter("getSEOExcerpt", function (content, override) {
        return override ||
            new JSDOM(content).window.document.querySelector("body > p")?.textContent
    })
    eleventyConfig.addFilter("getSEOImage", function (content, override) {
        // TODO: get this to find higher resolution images from srcsets
        return override ||
            new JSDOM(content).window.document.querySelector("img")?.src
    })

    /* Allow YAML configuration files
     *-------------------------------------*/
    const yaml = require("js-yaml")
    eleventyConfig.addDataExtension("yaml", contents => yaml.safeLoad(contents))

    /* Pug caching
     * see: https://github.com/11ty/eleventy/issues/1926#issuecomment-1282394830
     *------------------------------------*/
    let pugCache = {}
    // Reset the cache
    const pug = require("pug")
    eleventyConfig.on("eleventy.after", () => {
      pugCache = {}
    });
    eleventyConfig.setLibrary("pug", {
      compile: (str, options) => {
        if (pugCache[str]) return pugCache[str]
        pugCache[str] = pug.compile(str, options)
        return pugCache[str]
      },
    })

    /* Pug filter support
     * see: https://github.com/11ty/eleventy/issues/1523#issuecomment-733419587
     *------------------------------------*/
    global.filters = eleventyConfig.javascriptFunctions
    eleventyConfig.setPugOptions({
        globals: ['filters'],
    })

    /* OJS templates
     * I.e., rendering Observable Notebooks as blog posts
     *------------------------------------*/

    const runtimeOutputPath = "static/scripts/observable-runtime.js"
    const inspectorOutputPath = "static/scripts/observable-inspector.js"

    // Pass through the runtime and inspector to be loaded and run on the client-side
    eleventyConfig.addPassthroughCopy({
        // Use the official Observable runtime
        "node_modules/@observablehq/runtime/dist/runtime.js": runtimeOutputPath,
        // Use our own custom Inspector
        "utils/ojs/client/inspector.mjs": inspectorOutputPath,
    })

    // Add the OJS format
    eleventyConfig.addTemplateFormats("ojs")
    eleventyConfig.addExtension("ojs", {
        // see: https://github.com/11ty/eleventy/issues/2972#issuecomment-1607872439
        compileOptions: { permalink: () => (data) => data.permalink },
        // Compile the notebook to HTML
        compile: async (inputContent) => {
            return async (data) => await compileObservable(inputContent, {
                runtimePath: '/' + runtimeOutputPath,
                inspectorPath: '/' + inspectorOutputPath,
            })
        }
    })

    return {
        'dir': {
            'input': 'src',
        }
    }
}
