/* A hash of everything that decides what a card looks like.
 *
 * It goes into the cache key alongside the post's own content, so changing a
 * layout, a color or the backdrop art invalidates the cached renders by itself.
 * The alternative — a version constant to bump by hand — is a step that is only
 * ever noticed by forgetting it, and a stale card looks like a caching bug
 * rather than a missed edit.
 *
 * Every .js file in this directory is included except index.js, which schedules
 * and caches renders but draws nothing; that way a new module added to the
 * renderer is covered without anyone remembering to list it here. This file
 * hashes itself along with the rest, so narrowing what counts as a renderer
 * module is itself a cache-invalidating change.
 */

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

// Not a .js file, but the backdrop is drawn from it.
const ARTWORK = ['./src/static/styles/images/peonies.svg']

const isRendererModule = (file) => file.endsWith('.js') && file !== 'index.js'

let cached = null

async function compute () {
  const modules = (await fs.readdir(HERE))
    .filter(isRendererModule)
    .sort()
    .map((file) => path.join(HERE, file))

  const hash = crypto.createHash('sha256')
  for (const file of [...modules, ...ARTWORK]) {
    // Hash the name too, so moving code between files still shows up.
    hash.update(path.basename(file))
    hash.update(await fs.readFile(file))
  }

  return hash.digest('hex').slice(0, 12)
}

/* The current renderer's fingerprint. Computed once per build. */
export function rendererFingerprint () {
  cached ??= compute()
  return cached
}
