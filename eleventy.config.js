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

    /* Pass media directory through
     *-------------------------------------*/
    eleventyConfig.addPassthroughCopy("src/media")
    eleventyConfig.addPassthroughCopy("src/contra/media")

    /* Pass javascript through
     * TODO: replace this with an eslint pipeline that will bundle imports
     *-------------------------------------*/
    eleventyConfig.addPassthroughCopy("src/**/*.js");

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

    /* Add typographer and footnotes to markdown
     *-------------------------------------*/
    const markdownIt = require("markdown-it")
    const markdownFootnotes = require("markdown-it-footnote")
    let mdOptions = {
        typographer: true,
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

    eleventyConfig.setLibrary("md", md)

    /* Add sass support
     * see: https://www.11ty.dev/docs/languages/custom/#example-add-sass-support-to-eleventy
     *-------------------------------------*/
    const sass = require("sass")
    eleventyConfig.addTemplateFormats("sass");
    // Creates the extension for use
    eleventyConfig.addExtension("sass", {
        outputFileExtension: "css",
        compile: async function(inputContent, inputPath) {
            const parsed = path.parse(inputPath)
            let result = sass.compileString(
                inputContent,
                {
                    syntax: 'indented',
                    loadPaths: [
                        parsed.dir || '.',
                        'static'
                    ]
                }
            );
            return async () => result.css
        }
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
