import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  numFormat,
  humaneNumFormat,
  dateFormat,
  slugify,
  markdown,
  pluralize,
  getSEOExcerpt,
  getSEOImage,
} from '../config/filters.js'

test('numFormat formats numbers with a d3 format specifier', () => {
  assert.equal(numFormat(1234.4, ',.0f'), '1,234')
  assert.equal(numFormat('0.25', '.0%'), '25%')
})

test('humaneNumFormat spells out small numbers', () => {
  assert.equal(humaneNumFormat(0), 'zero')
  assert.equal(humaneNumFormat(1), 'one')
  assert.equal(humaneNumFormat(19), 'nineteen')
})

test('humaneNumFormat falls back to a compact format for large numbers', () => {
  // 20 is the boundary: it is no longer spelled out
  assert.equal(humaneNumFormat(20), '20')
  assert.equal(humaneNumFormat(1500), '1.5k')
})

test('humaneNumFormat accepts numeric strings', () => {
  assert.equal(humaneNumFormat('3'), 'three')
})

test('dateFormat formats Date instances in UTC', () => {
  const date = new Date('2024-05-04T15:30:00Z')
  assert.equal(dateFormat(date, '%Y-%m-%d'), '2024-05-04')
})

test('dateFormat accepts date strings', () => {
  assert.equal(dateFormat('2024-12-25T00:00:00Z', '%B %d, %Y'), 'December 25, 2024')
})

test('slugify lowercases and replaces whitespace with hyphens', () => {
  assert.equal(slugify('Hello World'), 'hello-world')
  assert.equal(slugify('Multiple   Words Here'), 'multiple---words-here')
  assert.equal(slugify('AlreadyOneWord'), 'alreadyoneword')
})

test('markdown renders markdown to HTML', () => {
  const html = markdown('# Heading\n\nSome **bold** text.')
  assert.match(html, /<h1>Heading<\/h1>/)
  assert.match(html, /<strong>bold<\/strong>/)
})

test('markdown applies typographic replacements', () => {
  // mdOptions enables the typographer, so straight quotes become curly
  const html = markdown('"quoted"')
  assert.match(html, /“quoted”/)
})

test('pluralize returns the singular form only for a count of one', () => {
  assert.equal(pluralize(1), '')
  assert.equal(pluralize(0), 's')
  assert.equal(pluralize(2), 's')
})

test('pluralize supports custom singular and plural forms', () => {
  assert.equal(pluralize(1, 'is', 'are'), 'is')
  assert.equal(pluralize(3, 'is', 'are'), 'are')
})

test('getSEOExcerpt extracts the first paragraph text', () => {
  const content = '<body><p>First paragraph.</p><p>Second paragraph.</p></body>'
  assert.equal(getSEOExcerpt(content), 'First paragraph.')
})

test('getSEOExcerpt prefers an explicit override', () => {
  const content = '<body><p>First paragraph.</p></body>'
  assert.equal(getSEOExcerpt(content, 'Custom excerpt'), 'Custom excerpt')
})

test('getSEOExcerpt returns undefined when there is no paragraph', () => {
  assert.equal(getSEOExcerpt('<body><div>No paragraphs here</div></body>'), undefined)
})

test('getSEOImage extracts the first image src', () => {
  const content = '<body><p>Text</p><img src="/media/first.jpg"><img src="/media/second.jpg"></body>'
  assert.equal(getSEOImage(content), '/media/first.jpg')
})

test('getSEOImage prefers an explicit override', () => {
  const content = '<body><img src="/media/first.jpg"></body>'
  assert.equal(getSEOImage(content, '/media/override.jpg'), '/media/override.jpg')
})

test('getSEOImage returns undefined when there is no image', () => {
  assert.equal(getSEOImage('<body><p>No images here</p></body>'), undefined)
})
