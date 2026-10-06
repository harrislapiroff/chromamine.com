import { test } from 'node:test'
import assert from 'node:assert/strict'

import { md, parseFenceMeta } from '../config/markdown.js'

const preTag = (html) => html.match(/<pre[^>]*>/)[0]
// A code block body of n lines
const lines = (n) => Array.from({ length: n }, (_, i) => `a${i}: ${i}`).join('\n')
const fence = (meta, body = 'a') => md.render(`\`\`\`${meta}\n${body}\n\`\`\``)

test('parseFenceMeta reads scroll, scroll=N and quoted titles', () => {
  assert.deepEqual(parseFenceMeta(''), { title: undefined, scroll: undefined })
  assert.deepEqual(parseFenceMeta('scroll'), { title: undefined, scroll: 15 })
  assert.deepEqual(parseFenceMeta('scroll=8'), { title: undefined, scroll: 8 })
  assert.deepEqual(parseFenceMeta('title="a.js" scroll=5'), { title: 'a.js', scroll: 5 })
  assert.deepEqual(parseFenceMeta('scroll title=\'my file.js\''), { title: 'my file.js', scroll: 15 })
})

test('parseFenceMeta ignores the word scroll inside a title', () => {
  assert.deepEqual(parseFenceMeta('title="how to scroll fast"'), { title: 'how to scroll fast', scroll: undefined })
  assert.deepEqual(parseFenceMeta('title="x scroll=3"'), { title: 'x scroll=3', scroll: undefined })
})

test('parseFenceMeta treats scroll=0 as the default and an empty title as none', () => {
  assert.equal(parseFenceMeta('scroll=0').scroll, 15)
  assert.equal(parseFenceMeta('title=""').title, undefined)
  assert.equal(parseFenceMeta('title="  "').title, undefined)
})

test('scroll in the fence meta caps a long block at 15 lines', () => {
  const pre = preTag(fence('yaml scroll', lines(20)))
  assert.match(pre, /class="[^"]*\bscroll\b/)
  assert.match(pre, /--scroll-lines:15/)
  // Shiki's own theme colours survive alongside the custom property
  assert.match(pre, /--shiki-dark-bg/)
})

test('scroll=N sets the number of visible lines', () => {
  assert.match(preTag(fence('yaml scroll=8', lines(9))), /--scroll-lines:8/)
})

test('scroll leaves a block that already fits alone', () => {
  for (const meta of ['yaml scroll=8', 'yaml scroll']) {
    assert.doesNotMatch(preTag(fence(meta, lines(8))), /\bscroll\b|--scroll-lines/)
  }
})

test('code blocks without scroll are left alone', () => {
  for (const meta of ['yaml', 'yaml scrolling', 'yaml noscroll', 'js title="how to scroll fast"']) {
    assert.doesNotMatch(preTag(fence(meta, lines(20))), /\bscroll\b|--scroll-lines/)
  }
})

test('title wraps the block in a figure captioned with the filename', () => {
  const html = fence('js title="eleventy.config.js"')
  assert.match(html, /^<figure class="code-block"[^>]*><figcaption>.*eleventy\.config\.js<\/figcaption><pre class="shiki/)
  assert.match(html, /<\/pre><\/figure>\n$/)
})

test('the title caption leads with an inline file icon', () => {
  assert.match(fence('js title="a.js"'), /<figcaption><span class="code-block-icon" aria-hidden="true"><svg [^>]*fill="currentColor"[^>]*>.*<\/svg><\/span>a\.js</)
})

test('the title figure carries the dark theme background for the caption', () => {
  assert.match(fence('js title="a.js"'), /^<figure class="code-block" style="--shiki-dark-bg:#[0-9a-f]+">/)
})

test('title accepts single quotes and spaces, and escapes HTML', () => {
  assert.match(fence('js title=\'my file.js\''), /<\/span>my file\.js<\/figcaption>/)
  assert.doesNotMatch(fence('js title="<b>.js"'), /<b>/)
})

test('an empty title adds no caption', () => {
  assert.match(fence('js title=""'), /^<pre class="shiki/)
})

test('title and scroll combine', () => {
  const html = fence('js title="a.js" scroll=5', lines(6))
  assert.match(html, /<\/span>a\.js<\/figcaption><pre class="[^"]*\bscroll\b[^>]*--scroll-lines:5/)
})

test('code blocks without a title are a bare pre', () => {
  assert.match(fence('js'), /^<pre class="shiki/)
  assert.match(fence(''), /^<pre class="shiki/)
})
