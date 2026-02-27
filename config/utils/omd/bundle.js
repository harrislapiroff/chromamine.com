import path from 'node:path'

const projectRoot = path.resolve(import.meta.dirname, '..', '..', '..')

/**
 * Bundle a generated Observable module source string using ESBuild.
 *
 * Resolves npm imports from node_modules and outputs a single bundled
 * ES module string. The @observablehq/runtime is kept as an external
 * (loaded as a passthrough copy at runtime).
 */
export async function bundleModule(moduleSource) {
  const esbuild = await import('esbuild')

  const result = await esbuild.build({
    stdin: {
      contents: moduleSource,
      resolveDir: projectRoot,
      loader: 'js'
    },
    bundle: true,
    format: 'esm',
    minify: !!+process.env.PROD,
    sourcemap: false,
    write: false,
    // Keep the runtime as external — it's loaded from /_omd/runtime/
    external: ['/_omd/*']
  })

  if (result.errors.length > 0) {
    throw new Error(`ESBuild errors:\n${result.errors.map(e => e.text).join('\n')}`)
  }

  return result.outputFiles[0].text
}
