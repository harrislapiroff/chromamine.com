const numFormat = function (value, format) {
    return d3format.format(format)(Number(value))
}

const numSpellings = [
    "zero","one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
]

const humaneNumFormat = function (value) {
    const num = Number(value)
    if (num < numSpellings.length - 1) return numSpellings[num]
    return d3format.format(".2s")(Number(value))
}

const dateFormat = function (value, format) {
    const value_ = value instanceof Date ? value : new Date(value)
    return d3time.utcFormat(format)(value_)
}

const slugify = function (value) {
    return value.toLowerCase().replace(/\s/g, '-')
}

const { mdOptions } = require("./markdown")
const markdownIt = require("markdown-it")
const markdown = function (value) {
    return markdownIt(mdOptions).render(value)
}

const pluralize = (value, singular = '', plural = 's') => value === 1 ? singular : plural

const JSDOM = require("jsdom").JSDOM

const getSEOExcerpt = function (content, override) {
    return override ||
        new JSDOM(content).window.document.querySelector("body > p")?.textContent
}

const getSEOImage = function (content, override) {
    // TODO: get this to find higher resolution images from srcsets
    return override ||
        new JSDOM(content).window.document.querySelector("img")?.src
}

module.exports = {
    numFormat,
    humaneNumFormat,
    dateFormat,
    slugify,
    markdown,
    pluralize,
    getSEOExcerpt,
    getSEOImage,
}
