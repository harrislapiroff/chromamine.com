/* Which kind of build this is.
 *
 * Used to show authoring aids — the link to a post's story image — everywhere
 * except the live site. `npm run serve` and `npm run build` set PROD, and the
 * two hosts that build a site from a repo like this one each name the deploy
 * they are producing: Netlify through CONTEXT, Cloudflare Pages through
 * CF_PAGES_BRANCH.
 *
 * When a production build tells us nothing, it is treated as production. The
 * cost of guessing wrong that way is a missing convenience link on a preview;
 * guessing the other way puts it on the live site.
 */

const PRODUCTION_BRANCH = 'main'

export default function () {
  // Any value but unset/empty/"0" means a built site — `PROD=true` must not
  // read as development, or the fail-safe below runs the wrong way.
  const built = process.env.PROD && process.env.PROD !== '0'
  if (!built) return { preview: true, name: 'development' }

  const branch = process.env.CF_PAGES_BRANCH ?? process.env.BRANCH
  const preview = process.env.CONTEXT
    ? process.env.CONTEXT !== 'production'
    : branch
      ? branch !== PRODUCTION_BRANCH
      : false

  return { preview, name: preview ? 'preview' : 'production' }
}
