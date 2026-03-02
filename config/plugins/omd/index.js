import path from 'node:path'
import fs from 'fs/promises'

import { parseOmd } from './lib/parse.js'
import { transpileCells } from './lib/transpile.js'
import { bundleModule } from './lib/bundle.js'

const pluginRoot = path.resolve(import.meta.dirname)

/**
 * Eleventy plugin for Observable Markdown (.omd) support.
 *
 * Adds the .omd template format which combines markdown prose with
 * executable JavaScript code blocks and ${} inline expression interpolation,
 * powered by the Observable runtime.
 *
 * @param {object} eleventyConfig - Eleventy configuration object
 * @param {object} [options] - Plugin options
 * @param {object} options.markdownIt - A configured markdown-it instance for rendering
 * @param {string} [options.outputPrefix='_omd'] - URL prefix for runtime assets
 */
export default function omdPlugin(eleventyConfig, options = {}) {
  const {
    markdownIt: md,
    outputPrefix = '_omd'
  } = options

  if (!md) {
    throw new Error(
      'eleventy-plugin-omd requires a markdownIt instance. ' +
      'Pass it as options.markdownIt when adding the plugin.'
    )
  }

  const runtimeOutputPath = `${outputPrefix}/runtime/`
  const inspectorOutputPath = `${outputPrefix}/inspector.js`

  // Pass through the Observable runtime and custom Inspector
  eleventyConfig.addPassthroughCopy({
    'node_modules/@observablehq/runtime/src/': runtimeOutputPath,
    [path.join(pluginRoot, 'client', 'inspector.js')]: inspectorOutputPath
  })

  // Watch the plugin's lib directory for changes during development
  eleventyConfig.addWatchTarget(path.join(pluginRoot, 'lib'))

  // Register the .omd template format and extension
  eleventyConfig.addTemplateFormats('omd')
  eleventyConfig.addExtension('omd', {
    compileOptions: { permalink: () => (data) => data.permalink },
    compile: async (inputContent) => {
      return async (data) => {
        // 1. Parse markdown and extract cells
        const { html, cells } = parseOmd(inputContent, md)

        // If there are no cells, just return the HTML
        if (cells.length === 0) return html

        // 2. Transpile cells to Observable runtime module
        const { moduleSource } = transpileCells(cells, {
          runtimePath: '/' + runtimeOutputPath + 'index.js',
          inspectorPath: '/' + inspectorOutputPath
        })

        // 3. Bundle with ESBuild (resolves npm imports)
        const bundled = await bundleModule(moduleSource, {
          resolveDir: path.resolve(pluginRoot, '..', '..', '..'),
          external: [`/${outputPrefix}/*`]
        })

        // 4. Write bundle to a JS file alongside the output
        const scriptFilename = `${data.page.fileSlug}.omd.js`
        const outputDir = path.dirname(data.page.outputPath)
        await fs.mkdir(outputDir, { recursive: true })
        await fs.writeFile(path.join(outputDir, scriptFilename), bundled)

        // 5. Return HTML with script tag referencing the bundle
        // Use page.url (normalized with leading slash) for reliable URL construction
        const pageUrl = data.page.url.endsWith('/') ? data.page.url : data.page.url + '/'
        const scriptUrl = `${pageUrl}${scriptFilename}`
        return html + `\n<script type="module" src="${scriptUrl}"></script>`
      }
    }
  })
}
