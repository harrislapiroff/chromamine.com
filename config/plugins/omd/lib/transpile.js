import { parseCell } from '@observablehq/parser'

/**
 * Get the name string for a cell's id node.
 */
function getCellName(id) {
  if (!id) return null
  if (id.type === 'ViewExpression') return `viewof ${id.id.name}`
  if (id.type === 'MutableExpression') return `mutable ${id.id.name}`
  return id.name
}

/**
 * Get the reference name string from a reference node.
 */
function getRefName(ref) {
  if (ref.type === 'ViewExpression') return `viewof ${ref.id.name}`
  if (ref.type === 'MutableExpression') return `mutable ${ref.id.name}`
  return ref.name
}

/**
 * Escape a string for use in a JavaScript string literal.
 */
function escapeString(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}

/**
 * Generate the function wrapper for a cell body.
 * The cell's source code is wrapped in a function whose parameters
 * are the cell's dependencies (references).
 */
function generateCellFunction(bodySource, refs, cell) {
  const params = refs.join(', ')
  const prefix = cell.async ? 'async ' : ''
  const star = cell.generator ? '*' : ''

  if (cell.body.type === 'BlockStatement') {
    // Block body — wrap in function, the block IS the function body
    return `${prefix}function${star}(${params}) ${bodySource}`
  } else {
    // Expression body — wrap in function that returns the expression
    return `${prefix}function${star}(${params}) {\nreturn (\n${bodySource}\n)\n}`
  }
}

/**
 * Strip a leading const/let/var declaration keyword from a cell source string.
 * Observable Framework allows these keywords as syntactic sugar; the underlying
 * parser only accepts bare assignment syntax (x = 42).
 */
function stripDeclaration(source) {
  return source.replace(/^(const|let|var)\s+/, '')
}

/**
 * Extract all FileAttachment references from an array of cells.
 * Uses @observablehq/parser to statically analyze each cell.
 *
 * @param {Array} cells - Array of cell objects from parseOmd
 * @returns {Set<string>} Set of referenced file attachment names
 */
export function extractFileAttachmentNames(cells) {
  const names = new Set()
  for (const cell of cells) {
    try {
      const parsed = parseCell(stripDeclaration(cell.source))
      if (parsed.fileAttachments) {
        for (const [name] of parsed.fileAttachments) {
          names.add(name)
        }
      }
    } catch (e) {
      // Skip cells that fail to parse
    }
  }
  return names
}

/**
 * Transpile an array of cells into an Observable runtime module source string.
 *
 * Standard library names (d3, Plot, Inputs, htl, etc.) are provided
 * automatically by the Observable stdlib via the Runtime's builtins.
 * Explicit `import { name } from "pkg"` statements are hoisted as
 * ES imports and bundled by ESBuild.
 *
 * @param {Array} cells - Array of cell objects from parseOmd
 * @param {object} options - Configuration options
 * @param {string} options.runtimePath - URL path to Observable runtime
 * @param {string} options.inspectorPath - URL path to Inspector module
 * @param {object} [options.fileAttachmentMap={}] - Map of filename to output URL
 * @returns {{ moduleSource: string }} The full ES module code string
 */
export function transpileCells(cells, { runtimePath, inspectorPath, fileAttachmentMap = {} }) {
  const defines = []
  const explicitImportLines = []
  const explicitImportDefines = []
  const explicitImportAliases = new Map() // package specifier -> safe alias

  for (const cell of cells) {
    if (cell.type === 'inline') {
      // Inline expressions: parse as a cell expression
      let parsed
      try {
        parsed = parseCell(cell.source)
      } catch (e) {
        console.error(`Error parsing inline expression \${${cell.source}}:`, e.message)
        defines.push(`// Error parsing inline expression: ${escapeString(cell.source)}`)
        continue
      }

      const refs = [...new Set(parsed.references.map(getRefName))]
      const depList = refs.map(r => `'${r}'`).join(', ')
      const bodySource = cell.source.trim()
      const fn = generateCellFunction(bodySource, refs, parsed)

      defines.push(
        `main.variable({fulfilled(value) {\n` +
        `  const el = document.querySelector('[data-cell="${cell.id}"]')\n` +
        `  if (el) el.textContent = typeof value === 'object' ? JSON.stringify(value) : String(value)\n` +
        `}}).define([${depList}], ${fn})`
      )
      continue
    }

    // Block cells: parse with @observablehq/parser.
    // Strip leading const/let/var so Observable Framework-style declarations work.
    const cellSource = stripDeclaration(cell.source)
    let parsed
    try {
      parsed = parseCell(cellSource)
    } catch (e) {
      console.error(`Error parsing cell ${cell.id}:`, e.message)
      defines.push(`// Error parsing cell ${cell.id}: ${escapeString(e.message)}`)
      continue
    }

    // Handle import declarations: hoist as ES imports and register
    // each imported name as an Observable runtime variable
    if (parsed.body && parsed.body.type === 'ImportDeclaration') {
      const source = parsed.body.source.value
      const specifiers = parsed.body.specifiers || []

      // Generate a namespace import (deduplicated per package)
      let safeAlias = explicitImportAliases.get(source)
      if (!safeAlias) {
        safeAlias = '_pkg_' + source.replace(/[^a-zA-Z0-9]/g, '_')
        explicitImportAliases.set(source, safeAlias)
        explicitImportLines.push(`import * as ${safeAlias} from '${source}'`)
      }

      // Register each imported name as an Observable variable
      for (const spec of specifiers) {
        const importedName = spec.imported.name
        const localName = spec.local.name
        explicitImportDefines.push(
          `main.define('${escapeString(localName)}', [], () => ${safeAlias}.${importedName})`
        )
      }
      continue
    }

    // Empty cell — skip
    if (!parsed.body) continue

    const cellName = getCellName(parsed.id)
    const refs = [...new Set(parsed.references.map(getRefName))]
    const depList = refs.map(r => `'${r}'`).join(', ')

    // Extract the body portion from the cell source.
    // Use cellSource (declaration-stripped) since AST positions are relative to it.
    // For named cells, skip past "name = " to get just the expression/block.
    let bodySource
    if (parsed.id && parsed.body.type !== 'BlockStatement') {
      const eqIndex = cellSource.indexOf('=', parsed.id.end)
      bodySource = cellSource.substring(eqIndex + 1).trim()
    } else if (parsed.id && parsed.body.type === 'BlockStatement') {
      bodySource = cellSource.substring(parsed.body.start)
    } else {
      bodySource = cellSource.trim()
    }

    const fn = generateCellFunction(bodySource, refs, parsed)

    if (parsed.id && parsed.id.type === 'ViewExpression') {
      // viewof — define both the view cell and the value cell
      const viewName = `viewof ${parsed.id.id.name}`
      const valueName = parsed.id.id.name

      defines.push(
        `main.variable(observer('${cell.id}', '${escapeString(viewName)}')).define('${escapeString(viewName)}', [${depList}], ${fn})`
      )
      defines.push(
        `main.variable().define('${escapeString(valueName)}', ['Generators', '${escapeString(viewName)}'], (G, _) => G.input(_))`
      )
    } else if (parsed.id && parsed.id.type === 'MutableExpression') {
      // mutable — define the mutable wrapper and value accessor
      const mutableName = `mutable ${parsed.id.id.name}`
      const valueName = parsed.id.id.name
      const initialName = `initial ${parsed.id.id.name}`

      defines.push(
        `main.define('${escapeString(initialName)}', [${depList}], ${fn})`
      )
      defines.push(
        `main.variable(observer('${cell.id}', '${escapeString(mutableName)}')).define('${escapeString(mutableName)}', ['Mutable', '${escapeString(initialName)}'], (M, _) => new M(_))`
      )
      defines.push(
        `main.variable().define('${escapeString(valueName)}', ['${escapeString(mutableName)}'], _ => _.generator)`
      )
    } else if (cellName) {
      // Named cell
      defines.push(
        `main.variable(observer('${cell.id}', '${escapeString(cellName)}')).define('${escapeString(cellName)}', [${depList}], ${fn})`
      )
    } else {
      // Anonymous cell
      defines.push(
        `main.variable(observer('${cell.id}')).define([${depList}], ${fn})`
      )
    }
  }

  // Build FileAttachment support if any cells reference file attachments
  const hasFileAttachments = Object.keys(fileAttachmentMap).length > 0
  const stdlibImports = hasFileAttachments
    ? '{Library as _Library, FileAttachments as _FileAttachments}'
    : '{Library as _Library}'
  const fileAttachmentDefine = hasFileAttachments
    ? `main.define('FileAttachment', [], () => _FileAttachments(name => (${JSON.stringify(fileAttachmentMap)})[name] || null))`
    : ''

  // Build the full module source
  const moduleSource = `
${explicitImportLines.join('\n')}
import ${stdlibImports} from '@observablehq/stdlib'

const runtimePath = '${runtimePath}'
const inspectorPath = '${inspectorPath}'

async function boot() {
  const [{Runtime}, {Inspector}] = await Promise.all([
    import(runtimePath),
    import(inspectorPath)
  ])

  function observer(cellId, name) {
    const el = document.querySelector('[data-cell="' + cellId + '"]')
    if (!el) return undefined
    return new Inspector(el)
  }

  // Pass the Observable stdlib as builtins so all standard library names
  // (d3, Plot, Inputs, htl, Generators, Mutable, etc.) are automatically
  // available via lazy CDN loading.
  const runtime = new Runtime(new _Library())
  const main = runtime.module()

  ${[fileAttachmentDefine, ...explicitImportDefines].filter(Boolean).join('\n  ')}

  ${defines.join('\n\n  ')}
}

boot()
`.trim()

  return { moduleSource }
}
