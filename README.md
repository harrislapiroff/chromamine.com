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
