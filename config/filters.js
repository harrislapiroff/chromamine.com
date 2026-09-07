import {
    format as d3Format,
    utcFormat as d3UtcFormat,
} from 'd3'
import markdownIt from "markdown-it"
import { JSDOM } from "jsdom"

import { mdOptions } from "./markdown.js"

export const numFormat = function (value, format) {
    return d3Format(format)(Number(value))
}

const numSpellings = [
    "zero","one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
]

export const humaneNumFormat = function (value) {
    const num = Number(value)
    if (num < numSpellings.length - 1) return numSpellings[num]
    return d3Format(".2s")(Number(value))
}

export const dateFormat = function (value, format) {
    const value_ = value instanceof Date ? value : new Date(value)
    return d3UtcFormat(format)(value_)
}

export const slugify = function (value) {
    return value.toLowerCase().replace(/\s/g, '-')
}

export const markdown = function (value) {
    return markdownIt(mdOptions).render(value)
}

export const pluralize = (value, singular = '', plural = 's') => value === 1 ? singular : plural

/* Parse rendered page content, remembering the last document parsed.
 *
 * The post layout asks for a post's excerpt and its lead image from the same
 * string, one after the other, and each JSDOM construction is a full document
 * parse. Holding on to the most recent one turns three parses per post into
 * one. Parsing is pure, so a miss only costs the work it saves.
 */
let lastParsed = { content: null, document: null }

const parseContent = function (content) {
    if (content !== lastParsed.content) {
        lastParsed = { content, document: new JSDOM(content).window.document }
    }
    return lastParsed.document
}

/* A one-paragraph description of a post, for `og:description`.
 *
 * Paragraphs that only carry an image are skipped: a post opening with a photo
 * and its caption would otherwise be described by the empty string. The social
 * card renderer applies the same rule — see
 * config/utils/social/extract.js:readParagraphs.
 */
export const getSEOExcerpt = function (content, override) {
    if (override) return override

    const paragraphs = parseContent(content).querySelectorAll("body > p")
    for (const paragraph of paragraphs) {
        if (paragraph.querySelector("img, picture, svg")) continue
        const text = paragraph.textContent.trim()
        if (text) return text
    }

    return ''
}

/* Resolve a site-relative path against the site's origin.
 *
 * eleventy-plugin-rss ships an `absoluteUrl` filter, but it isn't reachable
 * from WebC templates, and Open Graph consumers won't resolve a relative image
 * path — so the layouts need their own way to spell an absolute URL.
 */
export const toAbsoluteUrl = function (url, base) {
    return new URL(url, base).href
}

export const getSEOImage = function (content, override) {
    // TODO: get this to find higher resolution images from srcsets
    return override || parseContent(content).querySelector("img")?.src
}
