/**
 * Bundle a generated Observable module source string using ESBuild.
 *
 * Resolves npm imports from node_modules and outputs a single bundled
 * ES module string. The @observablehq/runtime is kept as an external
 * (loaded as a passthrough copy at runtime).
 *
 * @param {string} moduleSource - The ES module source code to bundle
 * @param {object} options - Configuration options
 * @param {string} options.resolveDir - Directory to resolve npm imports from
 * @param {string[]} options.external - External module patterns to exclude from bundle
 * @returns {Promise<string>} The bundled module source
 */
export async function bundleModule(moduleSource, { resolveDir, external }) {
  const esbuild = await import('esbuild')

  const result = await esbuild.build({
    stdin: {
      contents: moduleSource,
      resolveDir,
      loader: 'js'
    },
    bundle: true,
    format: 'esm',
    minify: !!+process.env.PROD,
    sourcemap: false,
    write: false,
    external
  })

  if (result.errors.length > 0) {
    throw new Error(`ESBuild errors:\n${result.errors.map(e => e.text).join('\n')}`)
  }

  if (!result.outputFiles || result.outputFiles.length === 0) {
    throw new Error('ESBuild produced no output files')
  }

  return result.outputFiles[0].text
}
