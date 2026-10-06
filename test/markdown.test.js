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

test('title wraps the block in a figure captioned with the filename', () => {
  const html = md.render('```js title="eleventy.config.js"\na = 1\n```')
  assert.match(html, /^<figure class="code-block"[^>]*><figcaption>.*eleventy\.config\.js<\/figcaption><pre class="shiki/)
  assert.match(html, /<\/pre><\/figure>\n$/)
})

test('the title caption leads with an inline file icon', () => {
  const html = md.render('```js title="a.js"\na\n```')
  assert.match(html, /<figcaption><span class="code-block-icon" aria-hidden="true"><svg [^>]*fill="currentColor"[^>]*>.*<\/svg><\/span>a\.js</)
})

test('the title figure carries the dark theme background for the caption', () => {
  const html = md.render('```js title="a.js"\na\n```')
  assert.match(html, /^<figure class="code-block" style="--shiki-dark-bg:#[0-9a-f]+">/)
})

test('title accepts single quotes and spaces, and escapes HTML', () => {
  assert.match(md.render('```js title=\'my file.js\'\na\n```'), /<\/span>my file\.js<\/figcaption>/)
  assert.doesNotMatch(md.render('```js title="<b>.js"\na\n```'), /<b>/)
})

test('title and scroll combine', () => {
  const html = md.render('```js title="a.js" scroll=5\na\n```')
  assert.match(html, /<\/span>a\.js<\/figcaption><pre class="[^"]*\bscroll\b[^>]*--scroll-lines:5/)
})

test('code blocks without a title are a bare pre', () => {
  assert.match(md.render('```js\na\n```'), /^<pre class="shiki/)
  assert.match(md.render('```\na\n```'), /^<pre class="shiki/)
})
