import markdownIt from "markdown-it"

// Footnotes and Highlighting are configured via
// instantiation options
import markdownFootnotes from "markdown-it-footnote"
import markdownContainer from "markdown-it-container"
import markdownAbbr from "markdown-it-abbr"
import markdownItAttrs from "markdown-it-attrs"

import ShikiPlugin from "@shikijs/markdown-it"
import { getMaterialIconSVG } from "./utils/material-icon.js"
import {
    transformerNotationHighlight,
    transformerNotationWordHighlight,
} from "@shikijs/transformers"

export const mdOptions = {
    typographer: true,
    html: true,
}

// Read the options after the language on a fence line, e.g.
// ```js title="eleventy.config.js" scroll=8. The quoted title comes out first,
// so a title containing the word "scroll" doesn't switch scrolling on.
const DEFAULT_SCROLL_LINES = 15
export function parseFenceMeta(raw = '') {
    const titleMatch = /(?:^|\s)title=(?:"([^"]*)"|'([^']*)')/.exec(raw)
    const title = (titleMatch?.[1] ?? titleMatch?.[2] ?? '').trim() || undefined
    const rest = titleMatch ? raw.replace(titleMatch[0], ' ') : raw
    const scrollMatch = /(?:^|\s)scroll(?:=(\d+))?(?=\s|$)/.exec(rest)
    // scroll=0 would hide the block entirely; treat it like a bare `scroll`
    const scroll = scrollMatch ? (Number(scrollMatch[1]) || DEFAULT_SCROLL_LINES) : undefined
    return { title, scroll }
}

// Cap a long code block's height and let it scroll: ```yaml scroll shows 15
// lines, ```yaml scroll=8 shows 8. rich-text.webc turns --scroll-lines into a
// max-height. A block that already fits is left alone, so it never becomes a
// scroll container (a horizontal scrollbar would otherwise eat into the
// height and force a needless vertical scroll).
export function transformerScroll() {
    return {
        name: 'scroll',
        pre(node) {
            const { scroll } = parseFenceMeta(this.options.meta?.__raw)
            if (!scroll) return
            const lineCount = this.source.replace(/\n$/, '').split('\n').length
            if (lineCount <= scroll) return
            this.addClassToHast(node, 'scroll')
            const style = node.properties.style ? `${node.properties.style};` : ''
            node.properties.style = `${style}--scroll-lines:${scroll}`
        }
    }
}

// Label a code block with a filename: ```js title="eleventy.config.js" wraps
// the <pre> in a <figure> captioned with a file icon and the title. The icon
// comes from the same code as the <material-icon> component; markdown-it
// renders synchronously, so it is fetched once here. Without a network or a
// cached copy, titles go without an icon rather than breaking every build and
// test that loads this file.
const fileIconSvg = await getMaterialIconSVG('description', { weight: 300, style: 'sharp' })
    .catch((error) => {
        console.warn(`[markdown] Code block titles will have no icon: ${error.message}`)
        return ''
    })
const EMPTY_ICON_SLOT = /(<span class="code-block-icon" aria-hidden="true">)(<\/span>)/
export function transformerTitle() {
    return {
        name: 'title',
        root(node) {
            const { title } = parseFenceMeta(this.options.meta?.__raw)
            if (!title) return
            // Shiki sets the dark theme's background inline on the <pre>; copy
            // it up so the caption can be shaded relative to it.
            const pre = node.children.find((child) => child.tagName === 'pre')
            const darkBg = /--shiki-dark-bg:[^;]+/.exec(pre?.properties.style ?? '')
            node.children = [{
                type: 'element',
                tagName: 'figure',
                properties: { class: 'code-block', style: darkBg?.[0] },
                children: [
                    {
                        type: 'element',
                        tagName: 'figcaption',
                        properties: {},
                        children: [
                            ...(fileIconSvg ? [{
                                type: 'element',
                                tagName: 'span',
                                properties: { class: 'code-block-icon', ariaHidden: 'true' },
                                children: []
                            }] : []),
                            { type: 'text', value: title }
                        ]
                    },
                    ...node.children
                ]
            }]
        },
        // Shiki escapes raw HTML in the tree, so the icon goes in after
        // serialization
        postprocess(html) {
            return html.replace(EMPTY_ICON_SLOT, `$1${fileIconSvg}$2`)
        }
    }
}

const shikiPlugin = await ShikiPlugin({
    themes: {
        light: 'github-light',
        dark: 'github-dark-default',
    },
    defaultTheme: 'dark',
    // Add language aliases
    langAlias: {
        'sass': 'scss',
        'openscad': 'c', // Map openscad to C for basic syntax highlighting
        'scad': 'c' // Map scad to C for basic syntax highlighting
    },
    // Fallback to text highlighting for unsupported languages
    defaultLanguage: 'text',
    transformers: [
        // Add notation highlight transformer
        // https://shiki.style/packages/transformers#transformernotationhighlight
        transformerNotationHighlight(),
        // Add the notation word highlight transformer
        // https://shiki.style/packages/transformers#transformernotationwordhighlight
        transformerNotationWordHighlight(),
        transformerScroll(),
        transformerTitle(),
    ]
})

// Create markdown instance first without shiki
export const md = markdownIt(mdOptions)
    .use(markdownFootnotes)
    .use(markdownAbbr)
    .use(markdownContainer, 'update')
    .use(markdownContainer, 'note')
    .use(markdownItAttrs, {
        allowedAttributes: ['rel'],
    })
    .use(shikiPlugin)

// markdown-it only passes highlighter output through untouched when it starts
// with <pre>, and wraps anything else in another <pre><code>. Let the <figure>
// from transformerTitle through as well.
const defaultFenceRenderer = md.renderer.rules.fence
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
    const [lang, , ...attrs] = info.split(/(\s+)/g)
    const highlighted = options.highlight(token.content, lang, attrs.join(''))
    if (/^<(pre|figure)\b/.test(highlighted)) return highlighted + '\n'
    return defaultFenceRenderer(tokens, idx, options, env, self)
}

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

// Responsive images
//
// The default renderer's plain <img src alt> output is enough: @11ty/eleventy-img's
// transform plugin (registered in eleventy.config.js) rewrites every <img> in the
// built HTML into a responsive <picture>, resolving the src the same way this used
// to — absolute paths from `src/`, relative ones from the page's directory.
