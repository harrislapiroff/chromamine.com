import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { transpileCells } from '../lib/transpile.js'

const defaultPaths = {
  runtimePath: '/_omd/runtime/index.js',
  inspectorPath: '/_omd/inspector.js'
}

describe('transpileCells', () => {
  it('returns a module source string', () => {
    const cells = [
      { id: 'cell-0', source: 'x = 42\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.equal(typeof moduleSource, 'string')
    assert.ok(moduleSource.length > 0)
  })

  it('includes the runtime and inspector paths in output', () => {
    const cells = [
      { id: 'cell-0', source: 'x = 1\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes('/_omd/runtime/index.js'))
    assert.ok(moduleSource.includes('/_omd/inspector.js'))
  })

  it('uses custom paths when provided', () => {
    const cells = [
      { id: 'cell-0', source: 'x = 1\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, {
      runtimePath: '/custom/runtime.js',
      inspectorPath: '/custom/inspector.js'
    })

    assert.ok(moduleSource.includes('/custom/runtime.js'))
    assert.ok(moduleSource.includes('/custom/inspector.js'))
  })

  it('generates a named cell definition', () => {
    const cells = [
      { id: 'cell-0', source: 'x = 42\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes(".define('x',"))
    assert.ok(moduleSource.includes("observer('cell-0'"))
  })

  it('generates an anonymous cell definition', () => {
    const cells = [
      { id: 'cell-0', source: 'console.log("hi")\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes("observer('cell-0')"))
    assert.ok(moduleSource.includes('.define('))
  })

  it('generates an inline cell definition', () => {
    const cells = [
      { id: 'inline-0', source: 'x + 1', type: 'inline' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes('data-cell="inline-0"'))
    assert.ok(moduleSource.includes('fulfilled'))
  })

  it('handles viewof expressions', () => {
    const cells = [
      { id: 'cell-0', source: 'viewof radius = Inputs.range([0, 100])\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes("'viewof radius'"))
    assert.ok(moduleSource.includes("'radius'"))
    assert.ok(moduleSource.includes('G.input'))
  })

  it('handles mutable expressions', () => {
    const cells = [
      { id: 'cell-0', source: 'mutable count = 0\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes("'mutable count'"))
    assert.ok(moduleSource.includes("'initial count'"))
    assert.ok(moduleSource.includes("'count'"))
    assert.ok(moduleSource.includes('new M(_)'))
  })

  it('handles import declarations', () => {
    const cells = [
      { id: 'cell-0', source: 'import { format } from "d3-format"\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes("import * as _pkg_d3_format from 'd3-format'"))
    assert.ok(moduleSource.includes("main.define('format'"))
  })

  it('deduplicates imports from the same package', () => {
    const cells = [
      { id: 'cell-0', source: 'import { format } from "d3-format"\n', type: 'block' },
      { id: 'cell-1', source: 'import { precisionFixed } from "d3-format"\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    // Should only have one import line
    const importCount = (moduleSource.match(/import \* as _pkg_d3_format/g) || []).length
    assert.equal(importCount, 1)
  })

  it('resolves cell dependencies', () => {
    const cells = [
      { id: 'cell-0', source: 'x = 42\n', type: 'block' },
      { id: 'cell-1', source: 'y = x + 1\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    // y should depend on x
    assert.ok(moduleSource.includes("'x'"))
  })

  it('includes boot function and runtime setup', () => {
    const cells = [
      { id: 'cell-0', source: 'x = 1\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes('async function boot()'))
    assert.ok(moduleSource.includes('new Runtime'))
    assert.ok(moduleSource.includes('runtime.module()'))
    assert.ok(moduleSource.includes('boot()'))
  })

  it('imports @observablehq/stdlib', () => {
    const cells = [
      { id: 'cell-0', source: 'x = 1\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes("from '@observablehq/stdlib'"))
  })

  it('handles cells with syntax errors gracefully', () => {
    const cells = [
      { id: 'cell-0', source: 'const = ;\n', type: 'block' }
    ]
    // Should not throw
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes('Error parsing cell'))
  })

  it('handles inline cells with syntax errors gracefully', () => {
    const cells = [
      { id: 'inline-0', source: 'const = ;', type: 'inline' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes('Error parsing inline expression'))
  })

  it('handles block statements', () => {
    const cells = [
      { id: 'cell-0', source: 'total = {\n  let sum = 0\n  for (let i = 0; i < 10; i++) sum += i\n  return sum\n}\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes("'total'"))
  })

  it('strips const before a named cell', () => {
    const cells = [
      { id: 'cell-0', source: 'const x = 42\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes(".define('x',"))
    assert.ok(moduleSource.includes('42'))
  })

  it('strips let before a named cell', () => {
    const cells = [
      { id: 'cell-0', source: 'let data = [1, 2, 3]\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes(".define('data',"))
  })

  it('strips var before a named cell', () => {
    const cells = [
      { id: 'cell-0', source: 'var count = 0\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes(".define('count',"))
  })

  it('strips const before a viewof cell', () => {
    const cells = [
      { id: 'cell-0', source: 'const viewof radius = Inputs.range([0, 100])\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes("'viewof radius'"))
    assert.ok(moduleSource.includes("'radius'"))
  })

  it('strips const before a block-body cell', () => {
    const cells = [
      { id: 'cell-0', source: 'const total = {\n  let sum = 0\n  for (const n of [1,2,3]) sum += n\n  return sum\n}\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes(".define('total',"))
    assert.ok(moduleSource.includes('return sum'))
  })

  it('handles async cells', () => {
    const cells = [
      { id: 'cell-0', source: 'data = await fetch("/api").then(r => r.json())\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes('async function'))
    assert.ok(moduleSource.includes("'data'"))
  })

  it('handles generator cells', () => {
    const cells = [
      { id: 'cell-0', source: 'counter = {\n  let i = 0\n  while (true) {\n    yield i++\n  }\n}\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes('function*'))
    assert.ok(moduleSource.includes("'counter'"))
  })

  it('registers all named imports from the same package', () => {
    const cells = [
      { id: 'cell-0', source: 'import { format } from "d3-format"\n', type: 'block' },
      { id: 'cell-1', source: 'import { precisionFixed } from "d3-format"\n', type: 'block' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    assert.ok(moduleSource.includes("main.define('format'"))
    assert.ok(moduleSource.includes("main.define('precisionFixed'"))
  })

  it('includes inline cell dependencies in the define call', () => {
    const cells = [
      { id: 'inline-0', source: 'x + 1', type: 'inline' }
    ]
    const { moduleSource } = transpileCells(cells, defaultPaths)

    // The inline cell references 'x', so it should appear in the dep list
    assert.ok(moduleSource.includes("['x']"))
  })
})
