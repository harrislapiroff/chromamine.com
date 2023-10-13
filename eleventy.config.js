const path = require("node:path")
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function(eleventyConfig) {
    /* Load CommonJS modules before config
     * see: https://github.com/11ty/eleventy/issues/2675#issuecomment-1338240707
     * ------------------------------------*/
    eleventyConfig.on('eleventy.before', async () => {
        const d3time = await import("d3-time-format")
        const d3format = await import("d3-format")
        global.d3time = d3time
        global.d3format = d3format
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
        ]
        await esbuild.build({
            entryPoints,
            outdir: dir.output,
            bundle: true,
            minify: true,
            sourcemap: true,
        })
    })
    eleventyConfig.addWatchTarget('./src/static/scripts/')
    eleventyConfig.addWatchTarget('./src/contra/static/scripts/')

    /* Pass media directory through
     *-------------------------------------*/
    eleventyConfig.addPassthroughCopy("src/media")
    eleventyConfig.addPassthroughCopy("src/contra/media")

    /* Pass .well-known through
     *-------------------------------------*/
    eleventyConfig.addPassthroughCopy("src/.well-known")

    /* Add RSS
     *-------------------------------------*/
    eleventyConfig.addPlugin(pluginRss);

    /* Put posts in a collection
     *-------------------------------------*/
    eleventyConfig.addCollection("posts", function(collection) {
        return collection.getFilteredByGlob("src/posts/*.md")
    })

    /* Add syntax highlighting
     *-------------------------------------*/
    const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight")
    eleventyConfig.addPlugin(syntaxHighlight)

    /* Add typographer and footnotes to markdown
     *-------------------------------------*/
    const markdownIt = require("markdown-it")
    const markdownFootnotes = require("markdown-it-footnote")
    let mdOptions = {
        typographer: true,
        html: true,
    }
    const md = markdownIt(mdOptions).use(markdownFootnotes)
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

    /* Add sass support
     *-------------------------------------*/
    const pluginRev = require("eleventy-plugin-rev")
    const eleventySass = require("eleventy-sass")
    eleventyConfig.addPlugin(pluginRev)
    eleventyConfig.addPlugin(eleventySass, { rev: true })

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
        return d3time.utcFormat(format)(value)
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

    return {
        'dir': {
            'input': 'src',
        }
    }
}
