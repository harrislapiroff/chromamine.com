import { md } from '../markdown.js'
import { errorBoundary } from './utils.js'

// Escape a value for use inside a double-quoted HTML attribute, in a
// single pass over the string.
const ATTR_ESCAPES = { '&': '&amp;', '"': '&quot;', '<': '&lt;' }
const attr = (value) => String(value).replace(/[&"<]/g, (char) => ATTR_ESCAPES[char])

// Rendering the caption's markdown is nearly all of this shortcode's cost, and
// the result depends on nothing but the caption text, so keep each one. A
// first build renders every caption once either way; the cache pays off on
// the rebuilds `npm run serve` does after each edit.
const captionCache = new Map()
const renderCaption = (caption) => {
    let html = captionCache.get(caption)
    if (html === undefined) {
        html = md.render(caption)
        captionCache.set(caption, html)
    }
    return html
}

const image = function (imgObj) {
    const fileSlug = this.page.fileSlug
    // We assume the image is located in the media directory
    // in a subdirectory with the same name as the page slug
    const src = `/media/${fileSlug}/${imgObj.src}`

    // Emitted as a plain <img>; the eleventy-img transform plugin registered in
    // eleventy.config.js rewrites it into a responsive <picture> after render.
    const imgTag = `<img src="${attr(src)}" alt="${attr(imgObj.alt)}" loading="${attr(imgObj.loading || 'lazy')}">`

    return `<figure>
        ${imgTag}
        ${imgObj.caption ? `<figcaption>${renderCaption(imgObj.caption)}</figcaption>` : ''}
    </figure>`
}

export default errorBoundary(image)
