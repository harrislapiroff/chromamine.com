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
        global.d3time = d3time
        global.d3format = d3format

        // Old OJS support
        const { compileObservable } = await import("./config/utils/ojs/compile.mjs")
        global.compileObservable = compileObservable
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

    /* Markdown features
     *-------------------------------------*/
    const { md } = require('./config/markdown')
    eleventyConfig.setLibrary("md", md)

    /* Shortcodes
     *-------------------------------------*/
    const shortcodes = require('./config/shortcodes')
    shortcodes.forEach(([type, name, fn]) => {
        if (type === 'paired') {
            eleventyConfig.addPairedShortcode(name, fn)
        } else if (type === 'single') {
            eleventyConfig.addShortcode(name, fn)
        }
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

    const {
        numFormat,
        humaneNumFormat,
        dateFormat,
        slugify,
        markdown: markdownFilter,
        pluralize,
        getSEOExcerpt,
        getSEOImage,
    } = require("./config/filters")

    eleventyConfig.addFilter("numFormat", numFormat)
    eleventyConfig.addFilter("humaneNumFormat", humaneNumFormat)
    eleventyConfig.addFilter("dateFormat", dateFormat)
    eleventyConfig.addFilter("slugify", slugify)
    eleventyConfig.addFilter("markdown", markdownFilter)
    eleventyConfig.addFilter("pluralize", pluralize)
    eleventyConfig.addFilter("getSEOExcerpt", getSEOExcerpt)
    eleventyConfig.addFilter("getSEOImage", getSEOImage)

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
    const clientOutputPath = "static/scripts/observable-client/"
    const inspectorOutputPath = "static/scripts/observable-inspector.js"

    // Pass through the runtime and inspector to be loaded and run on the client-side
    eleventyConfig.addPassthroughCopy({
        // Use the official Observable runtime
        // TODO: remove (currently used for OJS implementation to be succeeded by OMD)
        "node_modules/@observablehq/runtime/dist/runtime.js": runtimeOutputPath,
        // Use our own custom Inspector
        "config/utils/ojs/client/inspector.mjs": inspectorOutputPath,
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

    // Add the OMD plugin
    pluginObservable = require('./config/utils/omd/plugin.js')
    eleventyConfig.addPlugin(pluginObservable)

    return {
        'dir': {
            'input': 'src',
            'layouts': '_layouts',
        }
    }
}
