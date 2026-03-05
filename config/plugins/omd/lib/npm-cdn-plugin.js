import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'

const CDN_BASE = 'https://esm.sh'

/**
 * Convert a URL to a safe filesystem cache key.
 * e.g. "https://esm.sh/d3-format@7.0.1" → "esm.sh_d3-format_7.0.1"
 */
function urlToCacheKey(url) {
  return url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * Create an ESBuild plugin that resolves `npm:package` specifiers by
 * fetching from esm.sh at build time and caching results to disk.
 *
 * Usage: import { format } from "npm:d3-format"
 *
 * @param {object} options
 * @param {string} options.cacheDir - Directory to cache fetched modules
 */
export function createNpmCdnPlugin({ cacheDir }) {
  return {
    name: 'npm-cdn',
    setup(build) {
      // Redirect npm: specifiers to esm.sh
      build.onResolve({ filter: /^npm:/ }, args => ({
        path: `${CDN_BASE}/${args.path.slice(4)}`,
        namespace: 'npm-cdn'
      }))

      // Keep transitive https:// imports (from esm.sh modules) in the same
      // namespace so they are also fetched rather than resolved from disk
      build.onResolve({ filter: /^https?:\/\//, namespace: 'npm-cdn' }, args => ({
        path: args.path,
        namespace: 'npm-cdn'
      }))

      // Resolve root-relative imports (e.g. /d3-color@^3.1.0) against CDN base
      build.onResolve({ filter: /^\//, namespace: 'npm-cdn' }, args => ({
        path: `${CDN_BASE}${args.path}`,
        namespace: 'npm-cdn'
      }))

      // Resolve relative imports inside CDN modules against the importer URL
      build.onResolve({ filter: /^\./, namespace: 'npm-cdn' }, args => ({
        path: new URL(args.path, args.importer).href,
        namespace: 'npm-cdn'
      }))

      // Fetch and cache all npm-cdn modules
      build.onLoad({ filter: /.*/, namespace: 'npm-cdn' }, async args => {
        const cacheFile = path.join(cacheDir, urlToCacheKey(args.path))

        if (existsSync(cacheFile)) {
          const contents = await fs.readFile(cacheFile, 'utf8')
          return { contents, loader: 'js' }
        }

        let response
        try {
          response = await fetch(args.path)
        } catch (e) {
          return { errors: [{ text: `Failed to fetch ${args.path}: ${e.message}` }] }
        }

        if (!response.ok) {
          return { errors: [{ text: `${args.path} returned HTTP ${response.status}` }] }
        }

        const contents = await response.text()
        await fs.mkdir(path.dirname(cacheFile), { recursive: true })
        await fs.writeFile(cacheFile, contents)

        return { contents, loader: 'js' }
      })
    }
  }
}
