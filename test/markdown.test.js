import { test } from 'node:test'
import assert from 'node:assert/strict'

import { md } from '../config/markdown.js'

const preTag = (html) => html.match(/<pre[^>]*>/)[0]

test('scroll in the fence meta caps the block at 15 lines', () => {
  const pre = preTag(md.render('```yaml scroll\na: 1\n```'))
  assert.match(pre, /class="[^"]*\bscroll\b/)
  assert.match(pre, /--scroll-lines:15/)
  // Shiki's own theme colours survive alongside the custom property
  assert.match(pre, /--shiki-dark-bg/)
})

test('scroll=N sets the number of visible lines', () => {
  const pre = preTag(md.render('```yaml scroll=8\na: 1\n```'))
  assert.match(pre, /--scroll-lines:8/)
})

test('code blocks without scroll are left alone', () => {
  for (const fence of ['```yaml', '```yaml scrolling', '```yaml noscroll']) {
    const pre = preTag(md.render(`${fence}\na: 1\n\`\`\``))
    assert.doesNotMatch(pre, /\bscroll\b|--scroll-lines/)
  }
})
