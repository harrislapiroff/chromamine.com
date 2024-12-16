import path from "node:path"

import { writeFile } from "fs/promises"

import { compileOmd } from "./compile.js"
import { rollupClient, resolveImport } from "@observablehq/framework/dist/rollup.js"
import { getClientPath, prepareOutput } from "@observablehq/framework/dist/files.js"

export default function (eleventyConfig, pluginOptions) {
    const {
        extension = "omd",
        clientLibDir = path.join(eleventyConfig.dir.output, 'static', 'omdclient'),
        clientLibPath = '/static/omdclient',
    } = pluginOptions


    // Bundle the client-side scripts
    eleventyConfig.on("eleventy.before", async () => {
        // TODO: Figure out how to roll up *all* dependencies!
        const clientBundles = [
            ['main.js', 'main.js'],
            ['stdlib.js', '_observablehq/stdlib.js'],
            ['runtime.js', '_observablehq/runtime.js'],
        ]

        clientBundles.forEach(async ([clientPath, outputFile]) => {
            const outputPath = path.join(clientLibDir, outputFile)
            const clientBundleContent = await rollupClient(
                getClientPath(clientPath),
                '/',
                'testPath',
                {
                    resolveImport: (string) => resolveImport('node_modules', string)
                },
            )

            await prepareOutput(outputPath)
            writeFile(outputPath, clientBundleContent)
        })
    })

    // Add template format
    eleventyConfig.addTemplateFormats(extension)
    eleventyConfig.addExtension(extension, {
        // see: https://github.com/11ty/eleventy/issues/2972#issuecomment-1607872439
        compileOptions: { permalink: () => (data) => data.permalink },
        // Compile the notebook to HTML
        compile: async (inputContent) => {
            // TODO: get this to use our markdown filter
            return async (data) => await compileOmd(
                inputContent,
                { clientPath: clientLibPath }
            )
        }
    })
};
