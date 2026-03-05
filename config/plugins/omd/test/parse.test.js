import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import markdownIt from 'markdown-it'

import { parseOmd } from '../lib/parse.js'

// Use a basic markdown-it instance for tests (no shiki or other plugins)
const md = markdownIt({ html: true })

describe('parseOmd', () => {
  it('renders plain markdown with no cells', () => {
    const source = '# Hello\n\nThis is a paragraph.\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 0)
    assert.ok(html.includes('<h1>Hello</h1>'))
    assert.ok(html.includes('<p>This is a paragraph.</p>'))
  })

  it('extracts inline ${} expressions as inline cells', () => {
    const source = 'The value is ${x + 1}.\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 1)
    assert.equal(cells[0].type, 'inline')
    assert.equal(cells[0].source, 'x + 1')
    assert.equal(cells[0].id, 'inline-0')
    assert.ok(html.includes('data-cell="inline-0"'))
  })

  it('extracts multiple inline expressions', () => {
    const source = 'A is ${a} and B is ${b}.\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 2)
    assert.equal(cells[0].source, 'a')
    assert.equal(cells[1].source, 'b')
  })

  it('extracts ```js blocks as executable cells (hidden)', () => {
    const source = '```js\nx = 42\n```\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 1)
    assert.equal(cells[0].type, 'block')
    assert.equal(cells[0].source, 'x = 42\n')
    assert.ok(html.includes('data-cell="cell-0"'))
    // Should NOT contain <code> (hidden, not displayed)
    assert.ok(!html.includes('<code'))
  })

  it('extracts ```js echo blocks as executable AND displayed', () => {
    const source = '```js echo\ny = 99\n```\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 1)
    assert.equal(cells[0].type, 'block')
    assert.equal(cells[0].source, 'y = 99\n')
    // Should contain both the code display and the placeholder
    assert.ok(html.includes('data-cell="cell-0"'))
    assert.ok(html.includes('<code'))
  })

  it('does NOT extract ```javascript blocks as cells (display-only)', () => {
    const source = '```javascript\nconst z = 1\n```\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 0)
    assert.ok(html.includes('<code'))
  })

  it('skips empty ```js blocks', () => {
    const source = '```js\n   \n```\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 0)
  })

  it('does not extract ${} from inside fenced code blocks', () => {
    const source = '```js\nfoo = `${bar}`\n```\n\nOutside: ${baz}.\n'
    const { html, cells } = parseOmd(source, md)

    // Inline expressions are extracted from prose first, then code blocks
    // are processed from the token stream, so inline cells come first
    assert.equal(cells.length, 2)
    assert.equal(cells[0].type, 'inline')
    assert.equal(cells[0].source, 'baz')
    assert.equal(cells[1].type, 'block')
    assert.equal(cells[1].source, 'foo = `${bar}`\n')
  })

  it('handles nested braces in inline expressions', () => {
    const source = 'Result: ${({a: 1}).a}.\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 1)
    assert.equal(cells[0].source, '({a: 1}).a')
  })

  it('handles string literals with braces in inline expressions', () => {
    const source = 'Value: ${"hello {world}"}.\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 1)
    assert.equal(cells[0].source, '"hello {world}"')
  })

  it('treats unclosed ${ as literal text', () => {
    const source = 'Unclosed ${hello and more text.\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 0)
    assert.ok(html.includes('${hello'))
  })

  it('handles mixed content: prose, cells, and code blocks', () => {
    const source = [
      'Intro text with ${name}.',
      '',
      '```js',
      'name = "World"',
      '```',
      '',
      '```js echo',
      'greeting = `Hello ${name}!`',
      '```',
      '',
      '```javascript',
      '// display only',
      '```',
      '',
      'Final: ${greeting}.',
      ''
    ].join('\n')

    const { html, cells } = parseOmd(source, md)

    // Inline expressions are extracted from prose first (before code blocks),
    // then code blocks are processed from the token stream
    assert.equal(cells.length, 4)
    assert.equal(cells[0].type, 'inline')
    assert.equal(cells[0].source, 'name')
    assert.equal(cells[1].type, 'inline')
    assert.equal(cells[1].source, 'greeting')
    assert.equal(cells[2].type, 'block')
    assert.equal(cells[3].type, 'block')
  })

  it('handles template literals in inline expressions', () => {
    const source = 'Value: ${`count: ${n}`}.\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 1)
    assert.equal(cells[0].source, '`count: ${n}`')
  })

  it('does not extract ${} from tilde-fenced code blocks', () => {
    const source = '~~~js\nx = ${y}\n~~~\n\nOutside: ${z}.\n'
    const { html, cells } = parseOmd(source, md)

    // Inline ${z} extracted from prose, then ~~~js block from tokens
    assert.equal(cells.length, 2)
    assert.equal(cells[0].type, 'inline')
    assert.equal(cells[0].source, 'z')
    assert.equal(cells[1].type, 'block')
  })

  it('skips empty ```js echo blocks', () => {
    const source = '```js echo\n   \n```\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 0)
  })

  it('handles single-quoted strings with braces in inline expressions', () => {
    const source = "Value: ${'hello {world}'}.\n"
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 1)
    assert.equal(cells[0].source, "'hello {world}'")
  })

  it('handles escaped quotes inside inline expressions', () => {
    const source = 'Value: ${"she said \\"hi\\""}.\n'
    const { html, cells } = parseOmd(source, md)

    assert.equal(cells.length, 1)
    assert.equal(cells[0].source, '"she said \\"hi\\""')
  })
})
