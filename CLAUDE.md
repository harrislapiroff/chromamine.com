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