function pluginObservable(eleventyConfig, pluginOptions) {
    const clientOutputPath = "static/scripts/observable-client/"

    // As of 11ty 2.x we have to do some machinations to get module imports
    // by importing them on the eleventy.before event
    eleventyConfig.on("eleventy.before", async () => {
        const { compileObservableMD } = await import("./compile.mjs")
        global.compileObservableMD = compileObservableMD
    });

    // Copy client side libraries over to the output
    eleventyConfig.addPassthroughCopy({
        // TODO: We should make sure we're always looking in the right place for input
        // and that the output location can be customized through pluginOptions
        "node_modules/@observablehq/framework/dist/client/": clientOutputPath,
    });

    eleventyConfig.addTemplateFormats("omd")
    eleventyConfig.addExtension("omd", {
        // see: https://github.com/11ty/eleventy/issues/2972#issuecomment-1607872439
        compileOptions: { permalink: () => (data) => data.permalink },
        compile: async (inputContent) => {
            return async (data) => await compileObservableMD(inputContent, {
                clientDir: '/' + clientOutputPath,
            })
        }
    });
}

module.exports = pluginObservable
