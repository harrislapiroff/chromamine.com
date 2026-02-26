# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server (serves site with live updates)
npm run serve

# Production build
npm run build

# Create new blog post with frontmatter and media directory
npm run blog new "<title>" [slug] [--editor <editor>]

# List blog posts
npm run blog list [--limit <n>] [--sort <type>]

# Extract all unique dances from events to create a reference file
npm run dance extract-dances
```

## Architecture

This is an [Eleventy](https://www.11ty.dev/) static site generator project for Harris Lapiroff's personal blog.

### Key Technologies
- **Eleventy 3.0** - Static site generator
- **WebC** - Component system for templating (`src/_components/`)
- **Sass** - CSS preprocessing with automatic asset revisioning
- **ESBuild** - JavaScript bundling for client-side scripts
- **Observable JS** - Data visualization notebooks (`.ojs` files)
- **Markdown-it** - Enhanced markdown processing with plugins

### Directory Structure
- `src/` - Source files
  - `posts/` - Blog posts (`.md`, `.ojs`, `.html`)
  - `_components/` - WebC components
  - `_layouts/` - Page layouts
  - `_data/` - Global data files
  - `media/` - Static media assets
  - `dance/` - Contra dance calling event data and pages
- `_site/` - Generated site output
- `config/` - Eleventy configuration modules

### Content Types
- **Blog posts** - Support multiple formats: Markdown (`.md`), Observable notebooks (`.ojs`), HTML
- **Dance events** - YAML-based event management with calendar generation
- **Media** - Automatic image optimization and multiple format generation

### Build Process
1. WebC components are processed for templating
2. Sass files are compiled with asset revisioning
3. JavaScript is bundled with ESBuild
4. Observable notebooks are compiled to interactive HTML
5. Source files are copied alongside generated pages for transparency
6. Font files from `@ibm/plex` are copied to output

### Notable Features
- **Source file transparency** - Original `.md`/`.ojs` files are copied to output as `.txt` for viewing
- **Asset revisioning** - CSS/JS files get content-based hashes for cache busting
- **Observable notebook support** - `.ojs` files compile to interactive data visualizations
- **Dance event calendar** - Generates ICS calendar files from YAML data
- **Multi-format blog posts** - Supports Markdown, Observable, and HTML formats

### Data Flow
- Posts collection automatically includes all supported formats from `src/posts/`
- Dance events collection built from `src/dance/events/*.md`
- Global configuration in `src/_data/config.yaml`
- Dynamic data fetching (e.g., Flickr API) in `src/_data/flickr.js`

## Code Style

### JavaScript Style Guide
- **No semicolons**: This codebase follows a no-semicolon style
- **Single quotes**: Use single quotes for strings
- **2-space indentation**: Use 2 spaces for indentation
- **No trailing commas**: Avoid trailing commas in objects and arrays

### ESLint Configuration
An `.eslintrc.js` file is configured to enforce these style rules:
- `semi: ['error', 'never']` - No semicolons
- `quotes: ['error', 'single']` - Single quotes
- `indent: ['error', 2]` - 2-space indentation
- `comma-dangle: ['error', 'never']` - No trailing commas

### Date Handling
- Use `date-fns` for date manipulation and formatting
- Use `d3-array` for data processing and grouping
- Prefer semantic functions like `startOfDay()`, `endOfDay()` over manual calculations

## Dance Event Workflows

### Adding Dance Programs from Photos

When the user provides a photo of physical index cards laid out on a surface:

1. **Load the dance reference** - First read `scripts/data/dances.json` for quick dance/author lookup
2. **Check the event file structure** - Look at the currently open event file or similar files to understand the YAML structure
3. **Transcribe the program** - Read the dance titles from the cards, cross-referencing unclear titles with the reference file
   - **Card arrangement**: Multiple cards in a vertical stack are separate dances in the same set
   - **Medley identification**: Cards arranged horizontally (side-by-side in a row) indicate a medley
   - **Set boundaries**: Different physical stacks or groups of cards represent different sets
4. **Format properly**:
   - Sets are indicated by nested arrays (each `- -` starts a new set)
   - Medleys use the format: `title: "Medley: Dance 1, Dance 2, Dance 3"`
   - Medleys must have `medley: true` and comma-separated authors matching the order of dances
   - Optional fields: `notes`, `type` (e.g., `mixer`)
5. **Ask for help** - If titles are unclear, ask the user to clarify rather than guessing

**Example structure:**
```yaml
program:
- - title: Dance Title One
    author: Author Name
  - title: Dance Title Two
    author: Author Name
- - title: "Medley: Dance A, Dance B, Dance C"
    author: Author A, Author B, Author C
    medley: true
  - title: Dance Title Three
    author: Author Name
    notes: No walkthrough
```

**Reference file maintenance:**
- Run `npm run dance extract-dances` after adding new events to keep the reference up to date
- The reference includes a `count` field showing how often each dance has been called
