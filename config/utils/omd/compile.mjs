import markdownIt from 'markdown-it'

import { createMarkdownIt } from '@observablehq/framework/dist/markdown.js'
import { transpileJavaScript } from '@observablehq/framework/dist/javascript/transpile.js'
import { rewriteHtml } from '@observablehq/framework/dist/html.js'

import { getResolvers } from './resolvers.mjs'

// Loosely based on parseMarkdown from Observable Framework
// https://github.com/observablehq/framework/blob/05d70c58dc4639c586c5669d30901eadbe102213/src/markdown.ts#L238
async function parseOmd(omdSource, options) {
    const md = createMarkdownIt(markdownIt)
    const code = []
    const context = { code, startLine: 0, currentLine: 0, path: '' }
    const tokens = md.parse(omdSource, {})
    // Running this function will mutate `code` which we can use to generate
    // the live javascript portion of the code
    const body =  md.renderer.render(tokens, md.options, context)
    return {
        body, // The HTML contents of the body
        code, // The javascript code blocks with metadata to be rendered into a script

        // These are the remaining properties that Observable's parseMarkdown returns.
        // For the most part we don't need them because the function they serve in OF
        // doesn't apply when using it just as a template language. But we leave them
        // here as null in case any OF functions expect them.
        title: null,
        head: null,
        data: {},
        header: null,
        footer: null,
        style: null,
    }
}

// Bits and bobs borrowed from renderPage from Observable Framework
// https://github.com/observablehq/framework/blob/05d70c58dc4639c586c5669d30901eadbe102213/src/render.ts#L27
async function generateClientScript(page, clientPath, resolvers) {
    return `
        import { define } from '${clientPath}main.js'

        ${page.code.map(
            ({node, id, mode}) => transpileJavaScript(
                node,
                {
                    id,
                    path: clientPath,
                    mode,
                    resolveImport: resolvers.resolveImport
                }
            )
        ).join('\n\n')}
    `
}

export async function compileObservableMD(omdSource, data, options) {
    const { clientPath, clientDir } = options

    const page = await parseOmd(omdSource)

    const resolvers = await getResolvers(page, { root: clientDir })

    const clientScript = await generateClientScript(
        page,
        clientPath,
        resolvers,
    )
    return `
        <script type="module">
            ${clientScript}
        </script>
        ${rewriteHtml(page.body, resolvers)}
    `
}
