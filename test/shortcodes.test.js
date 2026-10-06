import { test } from 'node:test'
import assert from 'node:assert/strict'

import { errorBoundary } from '../config/shortcodes/utils.js'
import button from '../config/shortcodes/button.js'
import imageGrid from '../config/shortcodes/imageGrid.js'

test('errorBoundary passes through the wrapped function result', async () => {
  const wrapped = errorBoundary((a, b) => a + b)
  assert.equal(await wrapped(2, 3), 5)
})

test('errorBoundary awaits async wrapped functions', async () => {
  const wrapped = errorBoundary(async (x) => x * 2)
  assert.equal(await wrapped(21), 42)
})

test('errorBoundary preserves `this` binding', async () => {
  const obj = {
    factor: 10,
    multiply: errorBoundary(function (x) { return x * this.factor })
  }
  assert.equal(await obj.multiply(4), 40)
})

test('errorBoundary renders an error message when the wrapped function throws', async () => {
  const wrapped = errorBoundary(() => { throw new Error('boom') })
  const output = await wrapped()
  assert.match(output, /Error processing template tag/)
  assert.match(output, /boom/)
  assert.match(output, /color: red/)
})

test('errorBoundary uses a custom error message when provided', async () => {
  const wrapped = errorBoundary(() => { throw new Error('boom') }, 'Custom failure')
  const output = await wrapped()
  assert.match(output, /Custom failure/)
  assert.match(output, /boom/)
})

test('button renders an anchor with the base button class', () => {
  const html = button('Click me', 'https://example.com')
  assert.match(html, /href="https:\/\/example\.com"/)
  assert.match(html, />Click me</)
  assert.match(html, /class="button "/)
})

test('button appends a modifier class when one is given', () => {
  const html = button('Go', '/somewhere', 'primary')
  assert.match(html, /class="button button-primary"/)
})

const gridContext = { eleventy: { env: {} }, page: { url: '/post/' } }
const renderGrid = (content) => imageGrid.call(gridContext, content)

test('imageGrid wraps each line in a grid item', () => {
  const html = renderGrid('\n![One](/a.jpg)\n![Two](/b.jpg)\n')
  assert.equal(
    html,
    '<div class="image-grid">' +
      '<div class="image-grid__item"><img src="/a.jpg" alt="One"></div>' +
      '<div class="image-grid__item"><img src="/b.jpg" alt="Two"></div>' +
      '</div>'
  )
})

test('imageGrid ignores indentation and blank lines', () => {
  const plain = renderGrid('![One](/a.jpg)\n![Two](/b.jpg)')
  assert.equal(renderGrid('\n\n    ![One](/a.jpg)\n\n\n    ![Two](/b.jpg)\n\n'), plain)
})

test('imageGrid renders inline markdown without paragraph tags', () => {
  const html = renderGrid('A *caption*')
  assert.equal(html, '<div class="image-grid"><div class="image-grid__item">A <em>caption</em></div></div>')
})
