const fs = require('node:fs')

const clientOutputPath = "static/scripts/observable-client/"

function pluginObservable(eleventyConfig, pluginOptions) {
    eleventyConfig.on("eleventy.before", async () => {
        // As of 11ty 2.x we have to do some machinations to get module imports
        // by importing them on the eleventy.before event
        const { compileObservableMD } = await import("./compile.mjs")
        global.compileObservableMD = compileObservableMD

        // Copy client side libraries over to the output
        const { rollupClient } = await import('@observablehq/framework/dist/rollup.js')
        const observableFiles = ['index.js']
        observableFiles.forEach(async file => {
            const contents = await rollupClient(
                `node_modules/@observablehq/framework/dist/client/${file}`,
                clientOutputPath,
                clientOutputPath,
                {
                    minify: true,
                    keepNames: true,
                    define: {}
                },
            )
            fs.writeFileSync(`_site/${clientOutputPath}${file}`, contents)
        })
    })

    eleventyConfig.addTemplateFormats("omd")
    eleventyConfig.addExtension("omd", {
        // see: https://github.com/11ty/eleventy/issues/2972#issuecomment-1607872439
        compileOptions: { permalink: () => (data) => data.permalink },
        compile: async (inputContent) => {
            return async (data) => await compileObservableMD(inputContent, data, {
                // TODO: don't hard code this
                clientDir: '_site/' + clientOutputPath, // Location where client-side code should be output to (this is a path for a node script to write to)
                clientPath: '/' + clientOutputPath, // Location where the client-side code is served from (this is a path for a browser to fetch)
            })
        }
    })
}

module.exports = pluginObservable
