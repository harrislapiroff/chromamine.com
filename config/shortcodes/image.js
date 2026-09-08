import { md } from '../markdown.js'
import { errorBoundary } from './utils.js'

// Escape a value for use inside a double-quoted HTML attribute.
const attr = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')

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
        ${imgObj.caption ? `<figcaption>${md.render(imgObj.caption)}</figcaption>` : ''}
    </figure>`
}

export default errorBoundary(image)
