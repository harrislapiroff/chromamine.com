Chromamine
==========

Harris Lapiroff's [11ty][]-based blog.

[11ty]: https://www.11ty.dev/

```bash
# Setting up the environment, run once
npm install

# Run a server and build the site to _site/ (will live update)
npm run serve

# Build the site to _site/
npm run build

# Run the unit tests
npm test

# Lint the CLI scripts and tests
npm run lint

# Check content for broken media references and frontmatter problems
npm run validate
```

Pull requests automatically run the tests, the linter, the content validator,
and a production build via the [CI workflow](.github/workflows/ci.yml).

## Tests

Unit tests cover the project's custom code (template filters, shortcode
helpers, the dance extraction logic, and the content management scripts). They
use Node's built-in test runner, so no extra dependencies are required:

```bash
# Run the whole suite
npm test

# Run a single test file
node --test test/filters.test.js
```

Test files live in `test/` and are named `*.test.js`.

## Scripts

### Blog Management

```bash
# Create a new post with appropriate frontmatter and open in editor
npm run blog new <title> [slug] [--editor <editor>] [--no-open]

# List existing blog posts
npm run blog list [--limit <n>] [--sort <type>] [--drafts]

# Mark a draft as published and fill in its cross-post URLs
npm run blog publish <slug> [--mastodon <url>] [--facebook <url>]
```

Note that `npm run` needs `--` before flags, e.g.
`npm run blog list -- --limit 10`.

`blog new` writes the frontmatter, creates `src/media/<slug>/` for the post's
assets, and opens the post in your editor. The editor is taken from `$VISUAL`,
then `$EDITOR`, falling back to `code --wait`. It refuses to overwrite an
existing post.

`--sort` accepts `-date` (default, newest first), `date`, `title`, or `-title`.

`blog list --drafts` shows posts that are still excluded from collections or
still have unfilled cross-post URLs.

`blog publish` removes the `eleventyExcludeFromCollections` flag, uncomments the
`xposts` block, and fills in the URLs you provide, dropping any entry left as
`TBD`. It edits the frontmatter line by line so hand-written formatting and the
post body are preserved exactly.

### Dance Events

```bash
# Rebuild scripts/data/dances.json, the reference of every dance called
npm run dance extract-dances
```

The reference lists each unique dance with its choreographer and how often it
has been called. It's used when transcribing new event programs. Re-run it after
adding events.

### Content Validation

```bash
npm run validate [--errors-only] [--strict]
```

Checks that media references in posts resolve to files on disk, that `images`
frontmatter points at real files in `src/media/<slug>/`, that media directories
match a post, and that dance event frontmatter is well formed (including the
`note`/`notes` distinction, where only `notes` is rendered). Exits non-zero on
errors; `--strict` also fails on warnings.

### Flickr API Setup

```bash
# Generate OAuth tokens for Flickr API integration
npm run flickr-oauth [--key <api_key>] [--secret <api_secret>] [--no-interactive]
```

The site integrates with the Flickr API to display photos on the homepage with location data. Fetching location data requires OAuth authentication. This script walks you through the complete OAuth flow to generate the necessary tokens. You'll need to first [generate application credentials from Flickr](https://www.flickr.com/services/apps/create/apply/) to use the script. Store the application key and secret in your `.env` file:

```env
FLICKR_API_KEY=...
FLICKR_API_SECRET=...
```

When you get the oauth tokens through the setup script it will advise you to add them to your `.env` file:

```env
FLICKR_API_KEY=...
FLICKR_API_SECRET=...
FLICKR_OAUTH_TOKEN=...
FLICKR_OAUTH_SECRET=...
```

## Social Images

Every build draws two images per blog post, into `_site/media/social/`:

* `og/<slug>.png` — a 1200×630 Open Graph card, linked from the post's
  `og:image`. It is only generated for posts that have no image of their own; a
  post that leads with a photo advertises the photo instead.
* `story/<slug>.png` — a 1080×1920 frame sized for an Instagram story, carrying
  the title and the opening of the post. Generated for every post.

The two kinds sit in separate directories rather than being told apart by a
filename suffix, so a post slugged `foo-story` can't collide with the story
frame of a post slugged `foo`.

The story image isn't linked from the live site, but every post page carries a
link to it on `npm run serve` and on preview deploys, so you can open and save
it without working out the URL. `src/_data/env.js` decides which builds count as
previews; when a production build gives no signal either way it is treated as
production, so the link can't leak onto the live site.

The opening prose is cut at a paragraph boundary where it can be, and at the end
of a sentence otherwise — a card only ever ends mid-sentence, with an ellipsis,
when a single sentence is longer than the space available.

Both are drawn with [Satori][] and rasterized with [sharp][], and restate the
top of a post the way the site renders it in dark mode. The code lives in
`config/utils/social/`:

| | |
| --- | --- |
| `colors.js` | Resolves CSS `lch()` to sRGB, gamut-mapping per CSS Color 4 |
| `theme.js` | The dark-mode palette and type scale, mirroring `_variables.sass` |
| `fonts.js` | Loads IBM Plex Mono for Satori |
| `backdrop.js` | Rebuilds the faded peonies background |
| `text.js` | Line fitting and truncation, exploiting the fact that the site is monospaced |
| `cards.js` | The two layouts |
| `extract.js` | Reads a post back out of its own rendered HTML |
| `fingerprint.js` | Hashes the renderer, so design changes bust the cache |
| `index.js` | The build hook, and the on-disk cache |

Whether a post needs a generated card is decided in `src/_layouts/post.webc`,
which has to work it out anyway to fill in `og:image`; the build hook reads the
URL that tag ended up with rather than deciding again. The post's `seoImage`,
`seoDescription` and `excerpt` frontmatter all feed into that.

Renders are cached under `.cache/social-images/`, keyed by a hash of two things:
the fields a given card draws, and the renderer that drew them. So editing a
post's opening paragraph rebuilds its story image but not its link preview, and
editing a layout, a color or the peonies artwork rebuilds everything — no
version constant to remember to bump. The renderer hash covers every `.js` file
in `config/utils/social/` except `index.js`, which schedules renders but draws
nothing, so a new module needs no bookkeeping.

Superseded renders are pruned per card as each one is written, rather than by
sweeping the cache against everything a build produced — a watch, serve or
`--incremental` rebuild only reports the pages that changed, and a sweep would
take every other post's images with it.

[Satori]: https://github.com/vercel/satori
[sharp]: https://sharp.pixelplumbing.com/
