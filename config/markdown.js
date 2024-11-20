import path from "node:path"
import markdownIt from "markdown-it"

// Footnotes and Highlighting are configured via
// instantiation options
import markdownFootnotes from "markdown-it-footnote"
import markdownContainer from "markdown-it-container"
import markdownAbbr from "markdown-it-abbr"

import hljs from "highlight.js"
import Image from "@11ty/eleventy-img"

export const mdOptions = {
    typographer: true,
    html: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return (
                    '<pre class="hljs"><code>' +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    '</code></pre>'
                )
            } catch (__) {}
        }

        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
}

export const md = markdownIt(mdOptions)
    .use(markdownFootnotes)
    .use(markdownAbbr)
    .use(markdownContainer, 'update')
    .use(markdownContainer, 'note')

// Render footnotes simply in an ordered list
md.renderer.rules.footnote_block_open = () => '<ol class="footnotes">'
md.renderer.rules.footnote_block_close = () => '</ol>'
// Use unicode superscript numbers for footnote refs instead of the default
// behavior of using <sup> tags
const supNumbers = ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹']
md.renderer.rules.footnote_caption = (tokens, idx) => {
    let n = Number(tokens[idx].meta.id + 1).toString()
    if (tokens[idx].meta.subId > 0) {
        n += ':' + tokens[idx].meta.subId
    }
    let nStr = n.toString()
    return nStr.split('').map((c) => supNumbers[c]).join('')
}
md.renderer.rules.footnote_ref = (tokens, idx, options, env, slf) => {
    const id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
    const caption = slf.rules.footnote_caption(tokens, idx, options, env, slf);
    let refid = id;

    if (tokens[idx].meta.subId > 0) {
        refid += ':' + tokens[idx].meta.subId;
    }

    return '<a href="#fn' + id + '" class="footnote-ref" id="fnref' + refid + '">' + caption + '</a>';
}

// Increase h1s to h3 and so forth
// see: https://github.com/markdown-it/markdown-it/issues/871#issuecomment-1752196424
const proxy = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options)
const BASE_HEADING_LEVEL = 3;
const defaultHeadingOpenRenderer = md.renderer.rules.heading_open || proxy;
const defaultHeadingCloseRenderer = md.renderer.rules.heading_close || proxy;
const increase = (tokens, idx) => {
    const tokens_ = {...tokens}
    const level = Number(tokens_[idx].tag[1])
    // Don't go smaller than h6
    if (level < 6) {
        tokens_[idx].tag = tokens_[idx].tag[0] + (level + BASE_HEADING_LEVEL - 1)
    }
    return tokens_
}
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    increase(tokens, idx);
    return defaultHeadingOpenRenderer(tokens, idx, options, env, self)
}
md.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
    increase(tokens, idx);
    return defaultHeadingCloseRenderer(tokens, idx, options, env, self)
}

// Responsive Images
// see: https://tomichen.com/blog/posts/20220416-responsive-images-in-markdown-with-eleventy-image/
const IMAGE_WIDTHS = [640, 1280, 1920]
md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const naiveSrc = token.attrGet('src')
    // if it's an absolute path, specify the file from the `/src` directory
    // otherwise intelligently concatenate it with the parent dir of the page
    const src = naiveSrc[0] === '/' ? './src' + naiveSrc : path.join(path.dirname(env.page.inputPath), naiveSrc)
    const alt = token.content
    const htmlAttributes = { alt, loading: 'lazy', decoding: 'async' }
    const imgOpts = {
        widths: IMAGE_WIDTHS,
        formats: ['webp', 'jpeg', 'png', 'svg'],
        urlPath: '/media/img/',
        outputDir: './_site/media/img/',
    }
    Image(src, imgOpts)
    const metadata = Image.statsSync(src, imgOpts)
    const generated = Image.generateHTML(
        metadata,
        {
            sizes: '(max-width: 768px) 100vw, 768px',
            ...htmlAttributes
        }
    )
    return generated
}
