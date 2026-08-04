import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'

import { extractMediaRefs, resolveMediaRef } from '../scripts/validate.mjs'

test('extractMediaRefs finds markdown image and link targets', () => {
  const body = '![Alt text](/media/my-post/photo.jpg)\n\n[a link](/media/my-post/file.pdf)\n'
  assert.deepEqual(extractMediaRefs(body).sort(), [
    '/media/my-post/file.pdf',
    '/media/my-post/photo.jpg'
  ])
})

test('extractMediaRefs finds targets inside shortcode arguments, spaces and all', () => {
  // The real case: {% button "Download ↓" "/media/slug/Clean Copy Link.shortcut" %}
  const body = '{% button "Download &darr;" "/media/my-post/Clean Copy Link.shortcut" %}'
  assert.deepEqual(extractMediaRefs(body), ['/media/my-post/Clean Copy Link.shortcut'])
})

test('extractMediaRefs does not run past the end of a line', () => {
  // Prose is full of apostrophes; a quote class allowing \n swallowed whole
  // paragraphs and reported nonsense paths.
  const body = [
    "It wasn't the best day.",
    '![Alt](/media/my-post/a.jpg)',
    "I'm sure it'll be fine; that's what they said."
  ].join('\n')
  assert.deepEqual(extractMediaRefs(body), ['/media/my-post/a.jpg'])
})

test('extractMediaRefs ignores external URLs', () => {
  const body = '![x](https://example.com/media/foo.jpg)\n![y](/media/mine/ok.jpg)\n'
  assert.deepEqual(extractMediaRefs(body), ['/media/mine/ok.jpg'])
})

test('extractMediaRefs strips markdown titles, fragments and query strings', () => {
  const body = '![x](/media/a/b.jpg "A title")\n[y](/media/a/c.pdf#page=2)\n[z](/media/a/d.jpg?v=2)\n'
  assert.deepEqual(extractMediaRefs(body).sort(), [
    '/media/a/b.jpg',
    '/media/a/c.pdf',
    '/media/a/d.jpg'
  ])
})

test('extractMediaRefs ignores non-media links', () => {
  assert.deepEqual(extractMediaRefs('[a](https://example.com) and [b](/about/)'), [])
})

test('extractMediaRefs deduplicates repeated references', () => {
  const body = '![a](/media/p/x.jpg)\n![b](/media/p/x.jpg)\n'
  assert.deepEqual(extractMediaRefs(body), ['/media/p/x.jpg'])
})

test('resolveMediaRef roots absolute paths at src/, as the build does', () => {
  const resolved = resolveMediaRef('/media/my-post/a.jpg', '/repo/src/posts')
  assert.ok(resolved.endsWith(path.join('src', 'media', 'my-post', 'a.jpg')))
})

test('resolveMediaRef resolves relative paths against the post directory', () => {
  const resolved = resolveMediaRef('../media/my-post/a.jpg', path.join('/repo', 'src', 'posts'))
  assert.equal(resolved, path.join('/repo', 'src', 'media', 'my-post', 'a.jpg'))
})

test('resolveMediaRef decodes percent-encoded filenames', () => {
  const resolved = resolveMediaRef('/media/p/Clean%20Copy.shortcut', '/repo/src/posts')
  assert.ok(resolved.endsWith('Clean Copy.shortcut'))
})
