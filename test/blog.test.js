import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  XPOSTS_STUB,
  dropTbdXposts,
  newPostFrontmatter,
  removeFrontmatterLine,
  setXpostUrl,
  uncommentXposts
} from '../scripts/blog.mjs'

const DRAFT = `---
title: My Post
date: 2024-04-22
categories: []
tags: []
eleventyExcludeFromCollections: true
# xposts:
#   - label: Mastodon
#     url: TBD
#   - label: Facebook
#     url: TBD
---

Body text that must not change.
`

test('newPostFrontmatter builds the expected template', () => {
  const fm = newPostFrontmatter('My Title', '2026-08-04')
  assert.deepEqual(fm, {
    title: 'My Title',
    date: '2026-08-04',
    categories: [],
    tags: [],
    eleventyExcludeFromCollections: true
  })
})

test('newPostFrontmatter omits xposts, which ships commented out instead', () => {
  // A live `url: TBD` would render a link pointing at the string "TBD".
  assert.ok(!('xposts' in newPostFrontmatter('T', '2026-08-04')))
  assert.match(XPOSTS_STUB, /^# xposts:/)
})

test('newPostFrontmatter defaults the date to today in local time', () => {
  const fm = newPostFrontmatter('T')
  assert.match(fm.date, /^\d{4}-\d{2}-\d{2}$/)
})

test('removeFrontmatterLine drops the draft flag and nothing else', () => {
  const out = removeFrontmatterLine(DRAFT, 'eleventyExcludeFromCollections')
  assert.ok(!out.includes('eleventyExcludeFromCollections'))
  assert.ok(out.includes('title: My Post'))
  assert.ok(out.endsWith('Body text that must not change.\n'))
})

test('removeFrontmatterLine leaves a file without frontmatter alone', () => {
  const raw = 'no frontmatter here\n'
  assert.equal(removeFrontmatterLine(raw, 'anything'), raw)
})

test('uncommentXposts revives a commented block', () => {
  const out = uncommentXposts(DRAFT)
  assert.match(out, /^xposts:$/m)
  assert.match(out, /^ {2}- label: Mastodon$/m)
  assert.match(out, /^ {4}url: TBD$/m)
})

test('uncommentXposts is a no-op when there is no commented block', () => {
  const live = '---\ntitle: T\nxposts:\n  - label: Mastodon\n    url: https://x\n---\n\nbody\n'
  assert.equal(uncommentXposts(live), live)
})

test('setXpostUrl fills in the url for the matching label only', () => {
  const out = setXpostUrl(uncommentXposts(DRAFT), 'Mastodon', 'https://social.coop/@harris/1')
  assert.match(out, /- label: Mastodon\n {4}url: https:\/\/social\.coop\/@harris\/1/)
  // Facebook is untouched
  assert.match(out, /- label: Facebook\n {4}url: TBD/)
})

test('setXpostUrl returns the input unchanged for an unknown label', () => {
  const live = uncommentXposts(DRAFT)
  assert.equal(setXpostUrl(live, 'Bluesky', 'https://bsky.app/x'), live)
})

test('dropTbdXposts removes only the entries still reading TBD', () => {
  const filled = setXpostUrl(uncommentXposts(DRAFT), 'Mastodon', 'https://social.coop/@harris/1')
  const out = dropTbdXposts(filled)
  assert.match(out, /- label: Mastodon/)
  assert.ok(!out.includes('Facebook'))
  assert.ok(!out.includes('TBD'))
})

test('dropTbdXposts removes the whole key when nothing was filled in', () => {
  const out = dropTbdXposts(uncommentXposts(DRAFT))
  assert.ok(!out.includes('xposts'))
  assert.ok(!out.includes('TBD'))
  assert.ok(out.includes('title: My Post'))
})

test('dropTbdXposts leaves a fully filled block alone', () => {
  const live = '---\ntitle: T\nxposts:\n  - label: Mastodon\n    url: https://x\n---\n\nbody\n'
  assert.equal(dropTbdXposts(live), live)
})

test('the publish edits never touch the body', () => {
  let out = removeFrontmatterLine(DRAFT, 'eleventyExcludeFromCollections')
  out = uncommentXposts(out)
  out = setXpostUrl(out, 'Mastodon', 'https://social.coop/@harris/1')
  out = dropTbdXposts(out)

  const body = (raw) => raw.split(/\n---\n/)[1]
  assert.equal(body(out), body(DRAFT))
})
