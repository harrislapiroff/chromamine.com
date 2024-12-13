import { randomUUID } from "node:crypto"

import markdownIt from "markdown-it"

const defaultMd = markdownIt({ html: true, })

export function compileOmd (content, options) {
    const md = options?.md || defaultMd
    const prefix = options?.prefix || "omd"

    const unprocessedTokens = md.parse(content)

    const code_blocks = []
    const tokens = unprocessedTokens.map((token) => {
        // If it is not a fenced javascript block, return the token unchanged
        if (
            token.type !== 'fence' ||
            !token.info.startsWith("js")
        ) return token

        // Get any directives, e.g.
        // ```js run=false
        // [code]
        // ```
        // will have directives { run: "false" }
        // TODO: Separate this parsing code into a utility function
        const [ lang, ...directivesTokens ] = token.info.split(" ")
        // Parse the directives into an object
        const directives = directivesTokens?.map(t => t.split("="))
            .reduce((acc, [ key, value ]) => {
                if (value === 'false') value = false
                if (value === 'true') value = true
                if (typeof value === 'undefined') value = true
                acc[key] = value
                return acc
            }, {}) || {} // If there are no directives, empty object

        // If run=false, return the token unchanged
        if (directives.run) return token

        // Store the code in code blocks for transpiling into javascript later
        const uuid = randomUUID()
        code_blocks.push([uuid, token.content])

        // Prep an array for our output blocks
        const outputBlocks = []

        // Add an empty div with a UID to the output
        outputBlocks.push({
            ...token,
            type: "html_block",
            content: `<${prefix}-cell id="${prefix}-${uuid}"></${prefix}-cell>`,
        })

        // If echo=true, add the code block back to the output
        if (directives.echo) {
            outputBlocks.push(token)
        }

        return outputBlocks
    }).flat().filter(Boolean)

    console.log(tokens)

    // TODO: Compile the code blocks into observable cells

    // Render our token stream to HTML
    const mdHtml =  md.renderer.render(tokens, md.options, {})

    return mdHtml
}
