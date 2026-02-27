import { parseCell } from '@observablehq/parser'

// Map from Observable variable names to npm package specifiers.
// When a cell references one of these, it becomes a static ES import.
const NPM_PACKAGES = {
  d3: 'd3',
  Plot: '@observablehq/plot',
  Inputs: '@observablehq/inputs',
  htl: 'htl'
}

// Observable standard library names provided by the runtime
const STDLIB_NAMES = new Set([
  'now',
  'width',
  'Generators',
  'Promises',
  'DOM',
  'Files',
  'require',
  'html',
  'svg',
  'md',
  'tex',
  'FileAttachment',
  'Mutable',
  'invalidation',
  'visibility'
])

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
 * Get the short (value) name for a cell's id node.
 */
function getShortName(id) {
  if (!id) return null
  if (id.type === 'ViewExpression') return id.id.name
  if (id.type === 'MutableExpression') return id.id.name
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
function generateCellFunction(cellSource, bodySource, refs, cell) {
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
 * Transpile an array of cells into an Observable runtime module source string.
 *
 * Returns { moduleSource, npmImports } where:
 *   - moduleSource is the full ES module code string
 *   - npmImports is a Set of npm package specifiers to bundle
 */
export function transpileCells(cells) {
  const npmImports = new Set()
  const defines = []
  const importCells = []

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

      // Check refs for npm packages
      for (const ref of refs) {
        if (NPM_PACKAGES[ref]) npmImports.add(ref)
      }

      const depList = refs.map(r => `'${r}'`).join(', ')
      const bodySource = cell.source.trim()
      const fn = generateCellFunction(cell.source, bodySource, refs, parsed)

      defines.push(
        `main.variable({fulfilled(value) {\n` +
        `  const el = document.querySelector('[data-cell="${cell.id}"]')\n` +
        `  if (el) el.textContent = typeof value === 'object' ? JSON.stringify(value) : String(value)\n` +
        `}}).define([${depList}], ${fn})`
      )
      continue
    }

    // Block cells: parse with @observablehq/parser
    let parsed
    try {
      parsed = parseCell(cell.source)
    } catch (e) {
      console.error(`Error parsing cell ${cell.id}:`, e.message)
      defines.push(`// Error parsing cell ${cell.id}: ${escapeString(e.message)}`)
      continue
    }

    // Handle import declarations
    if (parsed.body && parsed.body.type === 'ImportDeclaration') {
      importCells.push({ cell, parsed })
      continue
    }

    // Empty cell — skip
    if (!parsed.body) continue

    const cellName = getCellName(parsed.id)
    const refs = [...new Set(parsed.references.map(getRefName))]

    // Check refs for npm packages
    for (const ref of refs) {
      if (NPM_PACKAGES[ref]) npmImports.add(ref)
    }

    const depList = refs.map(r => `'${r}'`).join(', ')
    const bodySource = cell.source.substring(
      parsed.body.start - (parsed.id ? 0 : 0),
      parsed.body.end
    )
    // For named cells, the body starts after "name = ", so we need to
    // extract just the body portion from the original source
    let actualBody
    if (parsed.id && parsed.body.type !== 'BlockStatement') {
      // The body is everything after the "= "
      const eqIndex = cell.source.indexOf('=', parsed.id.end)
      actualBody = cell.source.substring(eqIndex + 1).trim()
    } else if (parsed.id && parsed.body.type === 'BlockStatement') {
      const braceIndex = cell.source.indexOf('{', parsed.id.end)
      actualBody = cell.source.substring(braceIndex)
    } else {
      actualBody = cell.source.trim()
    }

    const fn = generateCellFunction(cell.source, actualBody, refs, parsed)

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

  // Build the import lines for npm packages
  const npmImportLines = Array.from(npmImports).map(name => {
    const pkg = NPM_PACKAGES[name]
    return `import * as _npm_${name} from '${pkg}'`
  })

  // Build the npm package registration lines
  const npmRegisterLines = Array.from(npmImports).map(name => {
    return `main.define('${name}', [], () => _npm_${name})`
  })

  // Build Observable import cell handling
  const obsImportLines = importCells.map(({ cell, parsed }) => {
    const source = parsed.body.source.value
    const specifiers = parsed.body.specifiers || []
    const injections = parsed.body.injections || []

    // Generate the import using runtime.module and import()
    const specDefs = specifiers.map(s => {
      const imported = s.imported.name
      const local = s.local.name
      const viewPrefix = s.view ? 'viewof ' : ''
      const mutablePrefix = s.mutable ? 'mutable ' : ''
      return `child.import('${viewPrefix}${mutablePrefix}${imported}', '${viewPrefix}${mutablePrefix}${local}', main)`
    }).join('\n    ')

    const injectionDefs = injections.length
      ? `, ${JSON.stringify(injections.map(i => ({ name: i.imported.name, alias: i.local.name })))}`
      : ''

    return `{\n  const child = runtime.module(define_${source.replace(/[^a-zA-Z0-9]/g, '_')})${injectionDefs}\n  ${specDefs}\n}`
  })

  // Build the full module source
  const moduleSource = `
${npmImportLines.join('\n')}
import {Library as _Library} from '@observablehq/stdlib'

const runtimePath = '/_omd/runtime/index.js'
const inspectorPath = '/_omd/inspector.js'

async function boot() {
  const [{Runtime}, {Inspector}] = await Promise.all([
    import(runtimePath),
    import(inspectorPath)
  ])

  function observer(cellId, name) {
    const el = document.querySelector('[data-cell="' + cellId + '"]')
    if (!el) return true
    return new Inspector(el)
  }

  // Create stdlib and pass a global resolver so Generators, Mutable, etc. are available
  const stdlib = new _Library()
  function resolveGlobal(name) {
    if (name in stdlib) return stdlib[name]
    return globalThis[name]
  }
  const runtime = new Runtime({}, resolveGlobal)
  const main = runtime.module()

  ${npmRegisterLines.join('\n  ')}

  ${defines.join('\n\n  ')}
}

boot()
`.trim()

  return { moduleSource, npmImports }
}
