import Image from "@11ty/eleventy-img"
import { md } from '../markdown.js'
import { errorBoundary } from './utils.js'

// Images render at most 768 CSS px wide (see the sizes attribute below), so
// 768 and 1536 cover 1x and 2x retina exactly; intermediate or larger variants
// are imperceptible overkill for this fixed column width.
const IMAGE_WIDTHS = [768, 1536]
const IMAGE_FORMATS = ['webp', 'jpeg', 'svg']
const IMAGE_OPTIONS = {
    widths: IMAGE_WIDTHS,
    formats: IMAGE_FORMATS,
    urlPath: '/media/img/',
    outputDir: './_site/media/img/',
    // Lower webp encoding effort: effort only controls the compression search,
    // not visual quality at a fixed quality value, so this speeds up the build
    // at the cost of marginally larger files.
    sharpWebpOptions: { effort: 2 }
}

const image = async function (imgObj) {
    const fileSlug = this.page.fileSlug
    // We assume the image is located in the media directory
    // in a subdirectory with the same name as the page slug
    const src = `./src/media/${fileSlug}/${imgObj.src}`

    const metadata = await Image(src, IMAGE_OPTIONS)

    const pictureTag = Image.generateHTML(metadata, {
        sizes: '(max-width: 768px) 100vw, 768px',
        alt: imgObj.alt,
        loading: imgObj.loading || 'lazy',
    })

    return `<figure>
        ${pictureTag}
        ${imgObj.caption ? `<figcaption>${md.render(imgObj.caption)}</figcaption>` : ''}
    </figure>`
}

export default errorBoundary(image)
