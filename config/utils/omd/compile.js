import { randomUUID } from "node:crypto"

import markdownIt from "markdown-it"
import { parseJavaScript } from "@observablehq/framework/dist/javascript/parse.js"
import { transpileJavaScript } from "@observablehq/framework/dist/javascript/transpile.js"

const defaultMd = markdownIt({ html: true, })

/* Processes a string formatted like:
 *
 *     js run=false echo
 *
 * into an object like:
 *
 *     { run: false, echo: true }
 */
function processTokenInfo (string) {
    const [ lang, ...directivesTokens ] = string.split(" ")
    // Parse the directives into an object
    const directives = directivesTokens?.map(t => t.split("="))
        .reduce((acc, [ key, value ]) => {
            if (value === 'false') value = false
            if (value === 'true') value = true
            if (typeof value === 'undefined') value = true
            acc[key] = value
            return acc
        }, {}) || {} // If there are no directives, empty object
    return [lang, directives]
}

/* Returns true if the token is a fenced javascript block */
const isObservableBlock = (token) => {
    return token.type === 'fence' && token.info.startsWith("js")
}

export function compileOmd (content, options) {
    const opts = {
        md: defaultMd,
        prefix: "omd",
        ...options,
    }

    const unprocessedTokens = opts.md.parse(content)

    const code_blocks = []
    const tokens = unprocessedTokens.map((token) => {
        // If it is not an Observable block
        if (!isObservableBlock(token)) return token

        // Extract directives from the token info
        const [_, directives] = processTokenInfo(token.info)

        // If run=false, return the token unchanged
        if (directives.run) return token

        // Store the code in code blocks for transpiling into javascript later
        const uuid = randomUUID()
        code_blocks.push([uuid, parseJavaScript(token.content, { path: '' })])

        // Prep an array for our output blocks
        const outputBlocks = []

        // Add an empty div with a UID to the output
        outputBlocks.push({
            ...token,
            type: "html_block",
            content: `<${opts.prefix}-cell id="${opts.prefix}-${uuid}"></${opts.prefix}-cell>`,
        })

        // If echo=true, add the code block back to the output
        if (directives.echo) {
            outputBlocks.push(token)
        }

        return outputBlocks
    }).flat().filter(Boolean)

    // TODO: Compile the code blocks into observable cells
    const jsHtml = code_blocks.map(([uuid, node]) => transpileJavaScript(node, { id: uuid })).join("\n\n")

    // Render our token stream to HTML
    const mdHtml = opts.md.renderer.render(tokens, opts.md.options, {})

    return `
        <script type="module">
            ${jsHtml}
        </script>
        ${mdHtml}
    `
}
