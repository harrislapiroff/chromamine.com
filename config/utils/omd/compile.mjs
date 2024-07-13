import markdownIt from 'markdown-it'

import { createMarkdownIt } from '@observablehq/framework/dist/markdown.js'
import { transpileJavaScript } from '@observablehq/framework/dist/javascript/transpile.js'
import { getResolvers } from '@observablehq/framework/dist/resolvers.js'
import { rewriteHtml } from '@observablehq/framework/dist/html.js'

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
    return { body, code }
}

// Bits and bobs borrowed from renderPage from Observable Framework
// https://github.com/observablehq/framework/blob/05d70c58dc4639c586c5669d30901eadbe102213/src/render.ts#L27
async function generateClientScript(page, clientDir, resolvers) {
    return `
        import { define } from '${clientDir}main.js'

        ${page.code.map(
            ({node, id, mode}) => transpileJavaScript(
                node,
                {
                    id,
                    path: clientDir,
                    mode,
                    resolveImport: resolvers.resolveImport
                }
            )
        ).join('\n\n')}
    `
}

export async function compileObservableMD(omdSource, options) {
    const { clientDir } = options

    const page = {...await parseOmd(omdSource), data: {}}

    const resolvers = await getResolvers(page, {
        root: '',
    })

    const clientScript = await generateClientScript(
        page,
        clientDir,
        resolvers,
    )
    return `
        <script type="module">
            ${clientScript}
        </script>
        ${rewriteHtml(page.body, resolvers)}
    `
}
