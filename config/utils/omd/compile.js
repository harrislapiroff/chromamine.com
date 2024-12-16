import { createHash } from "node:crypto"

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

/* A variation on
 * https://github.com/observablehq/framework/blob/6d455ac4aa3c3832e7694e58d91a33f7ca74ee00/src/markdown.ts#L55
 */
function uniqueCodeId(code_blocks, content) {
    const hash = createHash("sha256").update(content).digest("hex").slice(0, 8)
    let id = hash
    // Prevent collisions by checking earlier in the doc for the same hash
    let counter = 1
    // Add a counter suffix until there are no collisions
    while (code_blocks.some(([uid]) => uid === id)) id = `${hash}-${counter++}`
    return id
}

export function compileOmd (content, options) {
    const {
        md = defaultMd,
        prefix = "omd",
        clientPath,
    } = options

    const unprocessedTokens = md.parse(content)

    const code_blocks = []
    const tokens = unprocessedTokens.map((token) => {
        // If it is not an Observable block
        if (!isObservableBlock(token)) return token

        // Extract directives from the token info
        const [_, directives] = processTokenInfo(token.info)

        // If run=false, return the token unchanged
        if (directives.run) return token

        // Store the code in code blocks for transpiling into javascript later
        const uid = uniqueCodeId(code_blocks, token.content)
        code_blocks.push([uid, parseJavaScript(token.content, { path: '' })])

        // Prep an array for our output blocks
        const outputBlocks = []

        // Add an empty div with a UID to the output
        outputBlocks.push({
            ...token,
            type: "html_block",
            content: `<observablehq-loading></observablehq-loading><!--:${uid}:-->`,
        })

        // If echo=true, add the code block back to the output
        if (directives.echo) {
            outputBlocks.push(token)
        }

        return outputBlocks
    }).flat().filter(Boolean)

    // TODO: Compile the code blocks into observable cells
    const jsHtml = code_blocks.map(([uid, node]) => transpileJavaScript(node, { id: uid })).join("\n\n")

    // Render our token stream to HTML
    const mdHtml = md.renderer.render(tokens, md.options, {})

    return `
        <script type="module">
            import { define } from "${clientPath}/main.js"
            ${jsHtml}
        </script>
        ${mdHtml}
    `
}
