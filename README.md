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
```

Pull requests automatically run the tests and a production build via the
[CI workflow](.github/workflows/ci.yml).

## Tests

Unit tests cover the project's custom code (template filters, shortcode
helpers, and the dance extraction logic). They use Node's built-in test
runner, so no extra dependencies are required:

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
npm run blog new <title> [slug] [--editor <editor>]

# List existing blog posts
npm run blog list [--limit <n>] [--sort <type>]
```

The blog script creates new posts with proper frontmatter, a media directory for assets, and will open the new post in your preferred editor (as defined in your `EDITOR` environment variable, defaulting to `code`).

### Flickr API Setup

```bash
# Generate OAuth tokens for Flickr API integration
npm run flickr-oauth [--key <api_key>] [--secret <api_secret>]
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
