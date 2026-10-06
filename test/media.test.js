import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  insertBlocks,
  isSupportedImage,
  markdownImage,
  needsConversion,
  targetFilename,
  uniqueFilename
} from '../scripts/lib/media.js'

const POST = `---
title: A Post
date: 2026-10-05
---

First paragraph.

Second paragraph.
`

const IMG = '![](/media/a-post/photo.jpg)'

test('needsConversion picks out formats a browser cannot show', () => {
  assert.equal(needsConversion('IMG_0042.HEIC'), true)
  assert.equal(needsConversion('scan.tiff'), true)
  assert.equal(needsConversion('photo.jpg'), false)
  assert.equal(needsConversion('diagram.svg'), false)
})

test('isSupportedImage rejects non-images', () => {
  assert.equal(isSupportedImage('photo.heic'), true)
  assert.equal(isSupportedImage('photo.png'), true)
  assert.equal(isSupportedImage('notes.txt'), false)
  assert.equal(isSupportedImage('clip.mov'), false)
})

test('targetFilename slugifies and gives converted files a .jpg extension', () => {
  assert.equal(targetFilename('/Users/me/Desktop/IMG 0042.HEIC'), 'img-0042.jpg')
  assert.equal(targetFilename('Photo.JPEG'), 'photo.jpg')
  assert.equal(targetFilename('Screenshot 2026-10-05 at 9.41.12 PM.png'), 'screenshot-2026-10-05-at-9-41-12-pm.png')
  assert.equal(targetFilename('???.png'), 'image.png')
})

test('uniqueFilename never returns a name that is taken', () => {
  const taken = new Set(['/m/photo.jpg', '/m/photo-2.jpg'])
  const exists = (p) => taken.has(p)
  assert.equal(uniqueFilename('/m', 'other.jpg', exists), 'other.jpg')
  assert.equal(uniqueFilename('/m', 'photo.jpg', exists), 'photo-3.jpg')
})

test('markdownImage uses the site-root media path', () => {
  assert.equal(markdownImage('a-post', 'photo.jpg'), IMG)
  assert.equal(markdownImage('a-post', 'photo.jpg', 'A cat'), '![A cat](/media/a-post/photo.jpg)')
})

test('insertBlocks replaces a blank cursor line', () => {
  // Line 7 is the blank line between the two paragraphs.
  const out = insertBlocks(POST, 7, [IMG])
  assert.equal(out, POST.replace('First paragraph.\n\n', `First paragraph.\n\n${IMG}\n\n`))
})

test('insertBlocks goes after a text line rather than splitting it', () => {
  const out = insertBlocks(POST, 6, [IMG])
  assert.equal(out, POST.replace('First paragraph.\n', `First paragraph.\n\n${IMG}\n`))
})

test('insertBlocks sets multiple images apart as separate paragraphs', () => {
  const second = '![](/media/a-post/other.jpg)'
  const out = insertBlocks(POST, 7, [IMG, second])
  assert.match(out, new RegExp(`First paragraph.\\n\\n${escape(IMG)}\\n\\n${escape(second)}\\n\\nSecond`))
})

test('insertBlocks appends at end of file, keeping the trailing newline', () => {
  const out = insertBlocks(POST, Infinity, [IMG])
  assert.equal(out, `${POST}\n${IMG}\n`)
})

test('insertBlocks refuses to write into the frontmatter', () => {
  assert.throws(() => insertBlocks(POST, 2, [IMG]), /frontmatter/)
})

test('insertBlocks works on a file with no frontmatter', () => {
  assert.equal(insertBlocks('Text.', 1, [IMG]), `Text.\n\n${IMG}\n`)
})

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
