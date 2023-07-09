const path = require("node:path")

module.exports = function(eleventyConfig) {
    /* Put posts in a collection
     *-------------------------------------*/
    eleventyConfig.addCollection("posts", function(collection) {
        return collection.getFilteredByGlob("src/posts/*.md")
    })

    /* Add sass support
     * see: https://www.11ty.dev/docs/languages/custom/#example-add-sass-support-to-eleventy
     *-------------------------------------*/
    const sass = require("sass")
    eleventyConfig.addTemplateFormats("sass");
    // Creates the extension for use
    eleventyConfig.addExtension("sass", {
        outputFileExtension: "css",
        compile: async function(inputContent, inputPath) {
            const parsed = path.parse(inputPath)
            let result = sass.compileString(
                inputContent,
                {
                    syntax: 'indented',
                    loadPaths: [
                        parsed.dir || '.',
                        'static'
                    ]
                }
            );
            return async () => result.css
        }
    })

    /* Custom filters
     *-------------------------------------*/

    // Number formatting
    const d3format = import("d3-format")
    const numSpellings = [
        "zero","one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
        "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
    ]
    eleventyConfig.addFilter("numFormat", function (value, format) {
        return d3format.format(format)(Number(value))
    })
    eleventyConfig.addFilter("humaneNumFormat", function (value) {
        const num = Number(value)
        if (num < numSpellings.length - 1) return numSpellings[num]
        return d3format.format(".2s")(Number(value))
    })

    /* Allow YAML configuration files
     *-------------------------------------*/
    const yaml = require("js-yaml")
    eleventyConfig.addDataExtension("yaml", contents => yaml.safeLoad(contents))

    /* Pug caching
     * see: https://github.com/11ty/eleventy/issues/1926#issuecomment-1282394830
     *------------------------------------*/
    let pugCache = {}
    // Reset the cache
    const pug = require("pug")
    eleventyConfig.on("eleventy.after", () => {
      pugCache = {}
    });
    eleventyConfig.setLibrary("pug", {
      compile: (str, options) => {
        if (pugCache[str]) return pugCache[str]
        pugCache[str] = pug.compile(str, options)
        return pugCache[str]
      },
    })

    /* Pug filter support
     * see: https://github.com/11ty/eleventy/issues/1523#issuecomment-733419587
     *------------------------------------*/
    global.filters = eleventyConfig.javascriptFunctions
    eleventyConfig.setPugOptions({
        globals: ['filters']
    })

    return {
        'dir': {
            'input': 'src',
        }
    }
}
