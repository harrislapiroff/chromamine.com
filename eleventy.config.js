import path from "node:path"
import pluginRss from "@11ty/eleventy-plugin-rss"
import pugPlugin from "@11ty/eleventy-plugin-pug"
import fs from "fs/promises"

// Note: For the upgrade to 11ty 3.x we will want to replace this
// with 11ty's built-in glob util seen here:
// https://github.com/11ty/eleventy/blob/main/src/Util/GlobMatcher.js#L4
import multimatch from "multimatch"
import pluginRev from "eleventy-plugin-rev"
import eleventySass from "eleventy-sass"
import yaml from "js-yaml"

import { compileObservable } from "./config/utils/ojs/compile.js"
import { md } from './config/markdown.js'
import shortcodes from './config/shortcodes/index.js'

import {
    numFormat,
    humaneNumFormat,
    dateFormat,
    slugify,
    markdown as markdownFilter,
    pluralize,
    getSEOExcerpt,
    getSEOImage,
} from "./config/filters.js"

const blogPostFormats = ['md', 'ojs', 'html']
// Any file in the posts directory with a blog post format extension
const blogPostGlobs = blogPostFormats.map((format) => `./src/posts/*.${format}`)

export default function(eleventyConfig) {

    /* Copy raw source files to site
     * -------------------------------------*/
    eleventyConfig.on('eleventy.after', async ({ dir, results, runMode, outputMode }) => {
        // Match only blog post pages
        const blogPosts = results.filter(r => multimatch([r.inputPath], blogPostGlobs).length > 0)

        // Calculate a map from input source file to appropriate output locations
        const sourceFileInputOutputMap = blogPosts.map(({ inputPath, outputPath }) => {
            const extension = inputPath.split('.').pop()

            // Pop the trailing /index.html off the output path and add the extension
            const sourceOutputPath = outputPath.replace('/index.html', `.${extension}`)

            // We additionally copy the source with just a .txt extension so there's a
            // predictable URL it can be found at.
            // TODO: It would be nicer, at some point, to add this to the _redirects file
            // instead so the server can smoothly handle a redirect to the correct extension
            const txtSourceOutputPath = sourceOutputPath.replace(`.${extension}`, '.txt')

            return [
                [ inputPath, sourceOutputPath ],
                [ inputPath, txtSourceOutputPath ],
            ]
        }).flat()

        // Make copies from each source file to the output path
        console.log("[11ty] Copying source files to output directory...")
        await Promise.all(sourceFileInputOutputMap.map(
            ([ src, dest ]) => {
                console.log(`[11ty] Copying ${src} to ${dest}`)
                return fs.copyFile(src, dest)
            }
        ))
        console.log("[11ty] Finished copying source files to output directory")
    })

    /* Run ESBuild after building site
     *-------------------------------------*/
    eleventyConfig.on('eleventy.after', async ({ dir, results, runMode, outputMode }) => {
        const esbuild = await import("esbuild")
        const entryPoints = [
            {
                in: path.join(dir.input, 'dance', 'static', 'scripts', 'all.js'),
                out: path.join('dance', 'static', 'scripts', 'all'),
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
    eleventyConfig.addWatchTarget('./src/dance/static/scripts/')

    /* Pass media directory through
     *-------------------------------------*/
    eleventyConfig.addPassthroughCopy("src/media")
    eleventyConfig.addPassthroughCopy("src/dance/media")

    /* Other files through
     *-------------------------------------*/
    eleventyConfig.addPassthroughCopy("src/.well-known")
    eleventyConfig.addPassthroughCopy("src/robots.txt")
    eleventyConfig.addPassthroughCopy("src/_headers")
    eleventyConfig.addPassthroughCopy("src/_redirects")
    eleventyConfig.addPassthroughCopy("src/static/monotheme/images")

    /* Add RSS
     *-------------------------------------*/
    eleventyConfig.addPlugin(pluginRss);

    /* Put posts in a collection
     *-------------------------------------*/
    eleventyConfig.addCollection("posts", function(collection) {
        // Add all files whose path matches a blog post glob
        const arrs = blogPostGlobs.map(g => collection.getFilteredByGlob(g)).flat()
        return arrs
    })

    /* Put dance events in a collection
     *-------------------------------------*/
    eleventyConfig.addCollection(
        "danceEvents",
        collection => collection.getFilteredByGlob(`src/dance/events/*.md`)
    )

    /* Markdown features
     *-------------------------------------*/
    eleventyConfig.setLibrary("md", md)

    /* Shortcodes
     *-------------------------------------*/
    shortcodes.forEach(([type, name, fn]) => {
        if (type === 'paired') {
            eleventyConfig.addPairedShortcode(name, fn)
        } else if (type === 'single') {
            eleventyConfig.addShortcode(name, fn)
        }
    })

    /* Add sass support
     *-------------------------------------*/
    eleventyConfig.addPlugin(pluginRev)
    eleventyConfig.addFilter("rev", pluginRev.revvedFilePathFromOutputPath)
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
    eleventyConfig.addDataExtension("yaml", contents => yaml.safeLoad(contents))

    /* Pug support
    *-------------------------------------*/
    eleventyConfig.addPlugin(pugPlugin, {
        filters: eleventyConfig.getFilters()
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

    const runtimeOutputPath = "static/scripts/observable-runtime/"
    const inspectorOutputPath = "static/scripts/observable-inspector.js"
    const globalOutputPath = "static/scripts/observable-global.js"

    // Pass through the runtime and inspector to be loaded and run on the client-side
    eleventyConfig.addPassthroughCopy({
        // Use the official Observable runtime
        "node_modules/@observablehq/runtime/src/": runtimeOutputPath,
        // Use our own custom Inspector
        "config/utils/ojs/client/inspector.js": inspectorOutputPath,
        // And our own custom global
        "config/utils/ojs/client/global.js": globalOutputPath,
    })

    // Add the OJS format
    eleventyConfig.addTemplateFormats("ojs")
    eleventyConfig.addExtension("ojs", {
        // see: https://github.com/11ty/eleventy/issues/2972#issuecomment-1607872439
        compileOptions: { permalink: () => (data) => data.permalink },
        // Compile the notebook to HTML
        compile: async (inputContent) => {
            return async (data) => await compileObservable(inputContent, {
                runtimePath: '/' + runtimeOutputPath + 'index.js',
                inspectorPath: '/' + inspectorOutputPath,
                globalPath: '/' + globalOutputPath,
            })
        }
    })

    return {
        'dir': {
            'input': 'src',
            'layouts': '_layouts',
        }
    }
}
