const path = require("node:path")

module.exports = function(eleventyConfig) {
    /* Put posts in a collection
     *-------------------------------------*/
    eleventyConfig.addCollection("posts", function(collection) {
        return collection.getFilteredByGlob("posts/*.md")
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

}
