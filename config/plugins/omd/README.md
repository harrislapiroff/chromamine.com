# Observable Markdown (`.omd`) Plugin

An Eleventy plugin that adds support for **Observable Markdown** — a format that combines regular Markdown prose with reactive JavaScript cells and inline expressions, powered by the [Observable Runtime](https://github.com/observablehq/runtime).

This format is inspired by [Observable Framework](https://observablehq.com/framework/), but is designed to work within an Eleventy static site generator rather than as a standalone tool.

## Usage

### Registering the Plugin

```js
import omdPlugin from './config/plugins/omd/index.js'
import { md } from './config/markdown.js'

eleventyConfig.addPlugin(omdPlugin, { markdownIt: md })
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `markdownIt` | object | *(required)* | A configured markdown-it instance for rendering prose |
| `outputPrefix` | string | `'_omd'` | URL prefix for runtime asset files |

### Writing `.omd` Files

`.omd` files use standard Eleventy frontmatter and then Markdown with three special extensions:

**1. JavaScript code blocks (executed, output shown)**

````md
```js
Plot.plot({
  marks: [Plot.barY(data, {x: "category", y: "value"})]
})
```
````

**2. JavaScript code blocks with source displayed (`echo`)**

````md
```js echo
colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 10])
```
````

**3. Inline reactive expressions**

```md
The current value is **${radius}**.
```

Non-OMD code blocks use `javascript` (not `js`) to display highlighted code without executing it:

````md
```javascript
// This is shown but NOT executed
const x = 42
```
````

## Cell Types

The Observable Runtime uses a reactive dataflow model. Each cell is a node in a dependency graph; when a cell's value changes, all dependent cells automatically re-run.

### Named cells

Assign a value to a name. Other cells and inline expressions can reference it. Declaration keywords (`const`, `let`, `var`) are accepted and stripped at parse time, so cells can look like regular JavaScript declarations:

```js
data = [
  {category: "A", value: 28},
  {category: "B", value: 55}
]
```

```js
const data = [
  {category: "A", value: 28},
  {category: "B", value: 55}
]
```

Both forms define a cell named `data` — the `const` is syntax sugar.

### Anonymous cells

Executed for their side effects (typically rendering something). Not referenceable by name.

```js
htl.html`<p>Hello, world!</p>`
```

### `viewof` cells

Creates a reactive input control. The bare name (without `viewof`) gives the current value of the input, which updates reactively when the user interacts.

```js
viewof radius = Inputs.range([0, 100], {value: 50, label: "Radius"})
```

After defining this, `radius` holds the current numeric value. Prose like `${radius}` and cells that reference `radius` re-run whenever the slider moves.

### `mutable` cells

Creates a value that can be changed imperatively (e.g. from a button click).

```js
mutable count = 0
```

Use `mutable count` to write: `mutable count = mutable count + 1`.

### Block statements

Use curly braces for multi-statement logic:

```js
total = {
  let sum = 0
  for (const d of data) sum += d.value
  return sum
}
```

### Async cells

Cells can be `async`. The Observable Runtime automatically awaits them.

```js
response = await fetch("https://api.example.com/data").then(r => r.json())
```

### Generator cells

Cells can be generators, producing a stream of values over time.

```js
tick = {
  while (true) {
    yield Promises.delay(1000)
  }
}
```

### Multi-statement blocks

A single code block can contain multiple top-level statements — declarations, imports, and expressions:

```js
import { format } from "d3-format"
const x = format(".2f")(3.14)
const y = x + 1
```

All `const`/`let`/`var`/`function`/`class` declarations become named cells that other cells can reference. Import statements are hoisted and bundled at build time.

Multi-statement blocks are parsed with a different code path (Observable Framework's acorn-based parser) than single-statement cells. Observable-specific syntax (`viewof`, `mutable`, bare `name = expr` assignment, generators) must still be written as single-statement cells.

## Standard Library

The following names are available in every cell without any import statement, provided by the [Observable stdlib](https://github.com/observablehq/stdlib) via lazy CDN loading:

| Name | Description |
|------|-------------|
| `d3` | [D3.js](https://d3js.org/) — the full library |
| `Plot` | [Observable Plot](https://observablehq.com/plot/) — declarative charts |
| `Inputs` | [Observable Inputs](https://observablehq.com/@observablehq/inputs) — UI controls |
| `htl` | [Hypertext Literal](https://github.com/observablehq/htl) — safe HTML/SVG templating |
| `Generators` | Reactive generator utilities (`input`, `observe`, `queue`, etc.) |
| `Mutable` | Mutable value container (used internally by `mutable` cells) |
| `FileAttachment` | File attachment accessor (see below) |
| `md` | Tagged template for Markdown rendering |
| `tex` | Tagged template for LaTeX rendering |
| `svg` | Tagged template for SVG rendering |
| `width` | Reactive page width in pixels |
| `now` | Current timestamp (updates ~60fps) |
| `topojson` | [TopoJSON](https://github.com/topojson/topojson) |
| `mermaid` | [Mermaid](https://mermaid.js.org/) diagram renderer |

These are loaded from CDN on first use, so only packages actually referenced in a page are loaded.

## Explicit npm Imports

Packages can be imported using standard `import` syntax. These are resolved at build time by ESBuild and bundled into the page's JavaScript.

**Bare specifiers** resolve from local `node_modules/` — the package must be installed:

```js
import { format } from "d3-format"
```

**`npm:` specifiers** are fetched from [esm.sh](https://esm.sh) at build time and cached locally — no installation needed:

```js
import { schemeTableau10 } from "npm:d3-scale-chromatic"
```

Only named imports are supported (`import { name } from "pkg"`). Default imports and namespace imports (`import * as foo`) are not supported by the Observable parser.

Multiple names from the same package can be imported in separate cells — duplicate `import * as` hoisting is automatically deduplicated.

## File Attachments

Data files stored alongside the `.omd` source file can be loaded using `FileAttachment`:

```js
data = await FileAttachment("results.csv").csv({typed: true})
```

Referenced files are automatically copied to the output directory at build time. The `FileAttachment(name)` function returns an object with methods for loading file contents:

| Method | Returns | Use for |
|--------|---------|---------|
| `.json()` | Promise\<object\> | JSON data |
| `.csv({typed})` | Promise\<array\> | CSV data |
| `.tsv({typed})` | Promise\<array\> | TSV data |
| `.text()` | Promise\<string\> | Raw text |
| `.arrayBuffer()` | Promise\<ArrayBuffer\> | Binary data |
| `.stream()` | Promise\<ReadableStream\> | Streaming data |

File paths must be **literal strings** — dynamic paths (computed at runtime) are not supported because the build step needs to statically analyze which files to copy.

## Data Flow

```
.omd source
    │
    ▼ parse.js
    ├─ ${expr} in prose → inline cells (with <span> placeholders)
    ├─ ```js blocks → block cells (with <div> placeholders)
    ├─ ```js echo blocks → block cells + syntax-highlighted source
    └─ ```javascript blocks → syntax-highlighted source only
    │
    ▼ index.js (file attachments)
    ├─ Static analysis of FileAttachment("...") references
    └─ Copy referenced files to output directory
    │
    ▼ transpile.js
    ├─ Parse each cell with @observablehq/parser
    ├─ Hoist import statements as ES imports
    └─ Generate Observable Runtime module:
        ├─ import { Library } from '@observablehq/stdlib'
        ├─ Explicit ESBuild imports
        └─ boot() { Runtime(new Library()) + cell defines }
    │
    ▼ bundle.js (ESBuild)
    ├─ Bundle npm imports from node_modules/
    └─ Keep /_omd/runtime/ and /_omd/inspector.js external
    │
    ▼ output
    ├─ page/index.html  (with data-cell placeholders)
    └─ page/slug.omd.js (bundled runtime module)
```

At runtime in the browser, the Observable Runtime executes cells in dependency order and uses the custom `Inspector` to render their values into the placeholder elements.

## Differences from Observable Framework

This section documents behavioral differences for people who work in both environments. The cell syntax, reactive model, and standard library are largely shared — these are the places where they diverge.

**npm imports**

In Observable Framework, `import` statements resolve packages from jsDelivr at build time using bare specifiers — no local installation required. In this plugin, bare specifiers are resolved from the local `node_modules/` directory via ESBuild, so packages must be installed first. Both environments support the `npm:` prefix (e.g. `import { format } from "npm:d3-format"`), but the CDN differs: Observable Framework uses jsDelivr, this plugin uses esm.sh.

**Local module imports**

Observable Framework supports importing from local JavaScript files (`import { foo } from "./helpers.js"`). This plugin does not — imports must reference npm packages only.

**Import syntax**

Both environments use `@observablehq/parser` to parse cells, which only accepts named imports:

```js
import { format } from "d3-format"   // works in both
import foo from "d3"                  // not supported in either
import * as d3 from "d3"             // not supported in either
```

Use implicit stdlib names (e.g. `d3`, `Plot`) or named imports for everything else.

**Standard library loading**

Observable Framework downloads stdlib packages from jsDelivr at build time and serves them as static assets. This plugin uses the stdlib's built-in CDN loader (`d3-require`), which fetches packages in the browser at runtime on first use.

**Inspector and cell output**

Observable Framework uses [`@observablehq/inspector`](https://github.com/observablehq/inspector), which renders rich interactive views of arrays, objects, and DOM nodes, and displays every named cell's output automatically. This plugin uses a minimal Inspector that only renders DOM nodes (charts, HTML elements, inputs); non-DOM values are serialized to text. Output only appears where you placed the cell's `<div>` placeholder in the source — there is no automatic inspector panel for named cells.

**Echo syntax**

Observable Framework displays cell source code using the `echo` fenced code attribute. This plugin uses the `js echo` info string (i.e. `` ```js echo ``). Cells without `echo` behave the same way in both: executed, output shown, source hidden.

**Special fenced block types**

Observable Framework has built-in handling for `sql` and `tex` fenced blocks. This plugin treats them as ordinary non-executable code blocks.

**Page system**

Observable Framework is a standalone static site generator with its own frontmatter, layout, and routing system. This plugin adds `.omd` as a template format within Eleventy — frontmatter, layouts, collections, permalinks, and all other Eleventy features work the same as they do for `.md` files.

## File Structure

```
config/plugins/omd/
├── index.js           # Eleventy plugin entry point
├── client/
│   └── inspector.js   # Browser-side Inspector class (copied to /_omd/)
├── lib/
│   ├── parse.js           # .omd → { html, cells }
│   ├── transpile.js       # cells → ES module source
│   ├── bundle.js          # ES module source → bundled JS (via ESBuild)
│   └── npm-cdn-plugin.js  # ESBuild plugin for npm: specifier resolution
└── test/
    ├── parse.test.js
    └── transpile.test.js
```
