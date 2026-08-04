import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  SORT_FUNCTIONS,
  assertSafeSlug,
  formatDate,
  parseLimit,
  readContentDir,
  serializeFrontmatter,
  slugifyFilename,
  toDateParts,
  writeNewFile
} from '../scripts/lib/content.js'

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'content-test-'))
}

test('slugifyFilename lowercases and joins words with dashes', () => {
  assert.equal(slugifyFilename('Hello World'), 'hello-world')
})

test('slugifyFilename drops apostrophes rather than keeping them in a filename', () => {
  assert.equal(slugifyFilename("Bluesky's Enshittification Risk"), 'blueskys-enshittification-risk')
  assert.equal(slugifyFilename('It’s Curly Too'), 'its-curly-too')
})

test('slugifyFilename strips punctuation that has no business in a path', () => {
  // The permissive slugify this replaces produced `will-ai-eat-everything?/`
  assert.equal(slugifyFilename('Will AI Eat Everything?'), 'will-ai-eat-everything')
  assert.equal(slugifyFilename('Test Post: A Trial'), 'test-post-a-trial')
  assert.equal(slugifyFilename('a/b'), 'a-b')
})

test('slugifyFilename collapses runs of whitespace and trims dashes', () => {
  assert.equal(slugifyFilename('  Too   Many   Spaces  '), 'too-many-spaces')
  assert.equal(slugifyFilename('!leading and trailing!'), 'leading-and-trailing')
})

test('assertSafeSlug rejects path traversal', () => {
  assert.throws(() => assertSafeSlug('../../etc/passwd'), /path separator/)
  assert.throws(() => assertSafeSlug('sub/post'), /path separator/)
  assert.throws(() => assertSafeSlug(''), /empty/)
  assert.equal(assertSafeSlug('fine-slug'), 'fine-slug')
})

test('toDateParts reads a Date in UTC, not local time', () => {
  // YAML parses `date: 2026-07-07` to UTC midnight. Local getters would give
  // the 6th anywhere west of UTC.
  assert.deepEqual(toDateParts(new Date('2026-07-07T00:00:00.000Z')), {
    year: 2026, month: 7, day: 7
  })
})

test('toDateParts reads a YYYY-MM-DD string', () => {
  assert.deepEqual(toDateParts('2024-01-09'), { year: 2024, month: 1, day: 9 })
})

test('toDateParts returns null for missing or unparseable values', () => {
  assert.equal(toDateParts(undefined), null)
  assert.equal(toDateParts('not a date'), null)
})

test('formatDate does not shift a date across a timezone boundary', () => {
  assert.equal(formatDate(new Date('2026-07-07T00:00:00.000Z')), '7/7/2026')
  assert.equal(formatDate('2026-04-26'), '4/26/2026')
})

test('formatDate returns an empty string rather than "Invalid Date"', () => {
  assert.equal(formatDate(undefined), '')
})

test('parseLimit accepts non-negative integers', () => {
  assert.equal(parseLimit('5'), 5)
  assert.equal(parseLimit('0'), 0)
  assert.equal(parseLimit(12), 12)
})

test('parseLimit rejects values that used to silently produce no output', () => {
  // `--limit abc` produced slice(0, NaN) -> [] and printed nothing at all.
  assert.throws(() => parseLimit('abc'), /non-negative integer/)
  assert.throws(() => parseLimit('-1'), /non-negative integer/)
  assert.throws(() => parseLimit('1.5'), /non-negative integer/)
})

test('SORT_FUNCTIONS sort by date without timezone drift', () => {
  const posts = [
    { title: 'B', date: '2024-01-02' },
    { title: 'A', date: '2024-01-03' },
    { title: 'C', date: '2024-01-01' }
  ]
  assert.deepEqual(posts.toSorted(SORT_FUNCTIONS['-date']).map((p) => p.title), ['A', 'B', 'C'])
  assert.deepEqual(posts.toSorted(SORT_FUNCTIONS['date']).map((p) => p.title), ['C', 'B', 'A'])
})

test('SORT_FUNCTIONS sort by title', () => {
  const posts = [{ title: 'Zebra' }, { title: 'Apple' }, { title: 'Mango' }]
  assert.deepEqual(posts.toSorted(SORT_FUNCTIONS['title']).map((p) => p.title), ['Apple', 'Mango', 'Zebra'])
  assert.deepEqual(posts.toSorted(SORT_FUNCTIONS['-title']).map((p) => p.title), ['Zebra', 'Mango', 'Apple'])
})

test('SORT_FUNCTIONS put undated posts last rather than throwing', () => {
  const posts = [{ title: 'No date' }, { title: 'Dated', date: '2024-01-01' }]
  assert.deepEqual(posts.toSorted(SORT_FUNCTIONS['-date']).map((p) => p.title), ['Dated', 'No date'])
})

test('serializeFrontmatter leaves the date unquoted, matching the corpus', () => {
  const out = serializeFrontmatter({ title: 'T', date: '2026-08-04' })
  assert.match(out, /^date: 2026-08-04$/m)
})

test('writeNewFile refuses to overwrite an existing file', () => {
  const dir = tempDir()
  const file = path.join(dir, 'post.md')
  writeNewFile(file, 'original')
  assert.throws(() => writeNewFile(file, 'replacement'), /Refusing to overwrite/)
  // The critical assertion: the original content survived.
  assert.equal(fs.readFileSync(file, 'utf-8'), 'original')
  fs.rmSync(dir, { recursive: true, force: true })
})

test('readContentDir skips subdirectories instead of throwing EISDIR', () => {
  const dir = tempDir()
  fs.writeFileSync(path.join(dir, 'a.md'), '---\ntitle: A\n---\n')
  fs.mkdirSync(path.join(dir, 'assets'))
  const results = readContentDir(dir, { extensions: ['md'] })
  assert.deepEqual(results.map((r) => r.file), ['a.md'])
  fs.rmSync(dir, { recursive: true, force: true })
})

test('readContentDir filters by extension', () => {
  const dir = tempDir()
  fs.writeFileSync(path.join(dir, 'a.md'), '---\ntitle: A\n---\n')
  fs.writeFileSync(path.join(dir, 'b.txt'), 'not a post')
  const results = readContentDir(dir, { extensions: ['md'] })
  assert.deepEqual(results.map((r) => r.file), ['a.md'])
  fs.rmSync(dir, { recursive: true, force: true })
})

test('readContentDir reports the offending file and keeps going on bad frontmatter', () => {
  const dir = tempDir()
  fs.writeFileSync(path.join(dir, 'good.md'), '---\ntitle: Good\n---\n')
  fs.writeFileSync(path.join(dir, 'bad.md'), '---\ntitle: "unterminated\n  bad: [\n---\n')
  const errors = []
  const results = readContentDir(dir, { extensions: ['md'], onError: (m) => errors.push(m) })

  assert.deepEqual(results.map((r) => r.file), ['good.md'])
  assert.equal(errors.length, 1)
  assert.match(errors[0], /^bad\.md: /)
  fs.rmSync(dir, { recursive: true, force: true })
})

test('readContentDir gives a clear error for a missing directory', () => {
  assert.throws(
    () => readContentDir(path.join(os.tmpdir(), 'definitely-not-here-xyz'), { extensions: ['md'] }),
    /Content directory not found/
  )
})

test('readContentDir exposes the slug without its extension', () => {
  const dir = tempDir()
  fs.writeFileSync(path.join(dir, 'my-post.md'), '---\ntitle: T\n---\nbody\n')
  const [entry] = readContentDir(dir, { extensions: ['md'] })
  assert.equal(entry.slug, 'my-post')
  assert.equal(entry.content.trim(), 'body')
  fs.rmSync(dir, { recursive: true, force: true })
})
