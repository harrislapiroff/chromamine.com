import { md } from '../markdown.js'

const isLineBreak = (token) => token.type === 'softbreak' || token.type === 'hardbreak'

// Should be registered as a paired shortcode. Each non-blank line of the
// content becomes one item in the grid.
export default function (content) {
    // Add page data to the env to match the env that gets
    // passed to markdown during normal rendering
    const env = {
        ...this.eleventy.env,
        page: this.page
    }
    // Parse the whole block in a single inline pass (inline, so there are no
    // paragraph tags), then split the resulting tokens into items at each line
    // break. Indentation and blank lines fall away on their own: the parser
    // drops whitespace around a newline, and a blank line just leaves an empty
    // item to skip.
    const [{ children }] = md.parseInline(content.trim(), env)
    const items = [[]]
    for (const token of children) {
        if (isLineBreak(token)) {
            items.push([])
        } else {
            items.at(-1).push(token)
        }
    }
    return [
        '<div class="image-grid">',
        ...items
            .filter((tokens) => tokens.length > 0)
            .map((tokens) => `<div class="image-grid__item">${md.renderer.renderInline(tokens, md.options, env)}</div>`),
        '</div>'
    ].join('')
}
