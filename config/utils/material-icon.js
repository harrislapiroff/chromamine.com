// Fetch icons from Google's Material Design Symbols as inline SVG. Shared by
// the <material-icon> WebC component (via filters registered in
// eleventy.config.js) and the code block titles in config/markdown.js.
import Fetch from "@11ty/eleventy-fetch"

const MATERIAL_GITHUB_ROOT = "https://raw.githubusercontent.com/google/material-design-icons"
const MATERIAL_GIT_REF = "941fa95d7f6084a599a54ca71bc565f48e7c6d9e"
const OPTIONS = {
    opticalSize: [20, 24, 40, 48],
    weight: [100, 200, 300, 400, 500, 600, 700],
    grade: [-25, 0, 200],
    fill: [true, false],
    style: ['outlined', 'rounded', 'sharp'],
}
// These are the default values for these options and should not be included in URLs
const NULLISH = {
    weight: 400,
    grade: 0,
}
// Simple function that, when provided a value returns:
// 1. the value interpolated into tpl is the value is not nullish
// 2. an empty string if the value is nullish or matches the provided nullish value
const val = (v, nullish, tpl) => (!!v && v !== nullish) ? tpl.replace("%s", v) : ""

// Generates a URL like:
// https://raw.githubusercontent.com/google/material-design-icons/941fa95d7f6084a599a54ca71bc565f48e7c6d9e/symbols/web/10k/materialsymbolsoutlined/10k_wght700gradN25fill1_48px.svg
export const generateMaterialIconURL = (name, {
    opticalSize = 24,
    weight = 400,
    grade = 0,
    fill = false,
    style = 'outlined',
} = {}) => {
    if (!OPTIONS.opticalSize.includes(+opticalSize)) throw new Error(`Optical size must be one of ${OPTIONS.opticalSize.join(", ")}`)
    if (!OPTIONS.weight.includes(+weight)) throw new Error(`Weight must be one of ${OPTIONS.weight.join(", ")}`)
    if (!OPTIONS.grade.includes(+grade)) throw new Error(`Grade must be one of ${OPTIONS.grade.join(", ")}`)
    if (!OPTIONS.style.includes(style)) throw new Error(`Style must be one of ${OPTIONS.style.join(", ")}`)
    if (typeof fill !== 'boolean') throw new Error(`Fill must be a boolean`)
    return [
        MATERIAL_GITHUB_ROOT,
        '/',
        MATERIAL_GIT_REF,
        '/symbols/web/',
        name,
        '/materialsymbols',
        style,
        '/',
        name,
        '_',
        val(+weight, NULLISH.weight, "wght%s"),
        val(+grade, NULLISH.grade, "grad%s"),
        val(+fill, NULLISH.fill, "fill1"),
        '_',
        +opticalSize,
        'px.svg',
    ].join("")
}

export const getMaterialIconSVG = async (name, {
    opticalSize = 24,
    weight = undefined,
    grade = undefined,
    fill = undefined,
    style = undefined,
    // These variables are used by us, not for URL derivation
    size = undefined,
    color = 'currentColor',
} = {}) => {
    const url = generateMaterialIconURL(name, { opticalSize, weight, grade, fill, style })
    const svg = await Fetch(url, { duration: '*', type: 'text' })

    // Add fill, width, and height attributes to the outer <svg> tag
    // Note: for some reason Eleventy Fetch sometimes returns SVG as a buffer instead of a string, so we convert it defensively
    const processedSvg = new String(svg).replace(
        /<svg([^>]*)>/,
        `<svg$1 fill="${color}" width="${size || opticalSize}" height="${size || opticalSize}">`
    )

    return processedSvg
}
