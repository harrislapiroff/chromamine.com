import Image from "@11ty/eleventy-img"
import { md } from '../markdown.js'
import { errorBoundary } from './utils.js'

const IMAGE_WIDTHS = [640, 1280, 1920]
const IMAGE_FORMATS = ['webp', 'jpeg', 'svg']
const IMAGE_OPTIONS = {
    widths: IMAGE_WIDTHS,
    formats: IMAGE_FORMATS,
    urlPath: '/media/img/',
    outputDir: './_site/media/img/',
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
