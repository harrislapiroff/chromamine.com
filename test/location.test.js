import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  exiftoolVersion,
  findLocation,
  isMediaPath,
  isUnwritablePath,
  parseLocationReport
} from '../scripts/lib/location.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const STRIPPER = path.join(ROOT, 'scripts', 'strip-location.mjs')

// exiftool is a system dependency, not an npm one. Skip the tests that need it
// rather than failing the suite on a machine that does not have it.
const hasExiftool = Boolean(exiftoolVersion())

describe('path classification', () => {
  test('recognises photo extensions regardless of case', () => {
    assert.equal(isMediaPath('a/b/photo.jpg'), true)
    assert.equal(isMediaPath('a/b/PHOTO.JPEG'), true)
    assert.equal(isMediaPath('a/b/photo.HEIC'), true)
    assert.equal(isMediaPath('a/b/notes.md'), false)
    assert.equal(isMediaPath('a/b/photo.jpg.txt'), false)
  })

  test('flags the formats exiftool cannot rewrite', () => {
    assert.equal(isUnwritablePath('clip.mov'), true)
    assert.equal(isUnwritablePath('clip.mp4'), true)
    assert.equal(isUnwritablePath('photo.jpg'), false)
  })
})

describe('parseLocationReport', () => {
  test('treats a SourceFile-only entry as clean', () => {
    assert.deepEqual(parseLocationReport('[{"SourceFile":"a.jpg"}]'), [])
  })

  test('collects tag names for files that carry location data', () => {
    const json = '[{"SourceFile":"a.jpg","GPSLongitude":1,"GPSLatitude":2},{"SourceFile":"b.jpg"}]'
    assert.deepEqual(parseLocationReport(json), [
      { file: 'a.jpg', tags: ['GPSLatitude', 'GPSLongitude'] }
    ])
  })

  test('handles empty output', () => {
    assert.deepEqual(parseLocationReport(''), [])
    assert.deepEqual(parseLocationReport('   '), [])
  })

  // -gps:all pulls the whole group, so a file with only a bearing left on it
  // still counts. An earlier pass at this repo deleted tags one by one and left
  // exactly this behind on two files.
  test('counts residual GPS tags with no coordinates', () => {
    const json = '[{"SourceFile":"a.jpg","GPSImgDirection":90,"GPSVersionID":"2.2.0.0"}]'
    assert.deepEqual(parseLocationReport(json), [
      { file: 'a.jpg', tags: ['GPSImgDirection', 'GPSVersionID'] }
    ])
  })
})

// Build a small real JPEG and give it coordinates, so the round-trip tests run
// against a file exiftool actually parses rather than a stub.
function makeGeotaggedJpeg(dir, name = 'photo.jpg', colour = { r: 200, g: 120, b: 60 }) {
  const file = path.join(dir, name)
  execFileSync('node', [
    '-e',
    "require('sharp')({create:{width:32,height:32,channels:3,background:JSON.parse(process.argv[2])}})" +
    '.jpeg().toFile(process.argv[1])',
    file,
    JSON.stringify(colour)
  ], { cwd: ROOT })
  execFileSync('exiftool', [
    '-q', '-overwrite_original',
    '-GPSLatitude=42.397', '-GPSLatitudeRef=N',
    '-GPSLongitude=-71.112', '-GPSLongitudeRef=W',
    '-GPSImgDirection=90',
    '-Model=Test Camera',
    file
  ])
  return file
}

describe('stripping', { skip: hasExiftool ? false : 'exiftool not installed' }, () => {
  test('removes every GPS tag but leaves other EXIF alone', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-test-'))
    try {
      const file = makeGeotaggedJpeg(dir)
      assert.equal(findLocation([file]).length, 1)

      execFileSync('node', [STRIPPER, file], { cwd: ROOT })

      assert.deepEqual(findLocation([file]), [])
      const model = execFileSync('exiftool', ['-s3', '-Model', file], { encoding: 'utf8' })
      assert.equal(model.trim(), 'Test Camera')
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  test('--check reports without modifying, and exits non-zero', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-test-'))
    try {
      const file = makeGeotaggedJpeg(dir)
      const before = fs.readFileSync(file)

      const result = spawnSync('node', [STRIPPER, '--check', file], { cwd: ROOT, encoding: 'utf8' })

      assert.equal(result.status, 1)
      assert.match(result.stdout, /GPSLatitude/)
      assert.deepEqual(fs.readFileSync(file), before)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

// The guarantee the whole system rests on: a photo with coordinates goes
// through a normal `git commit` and the committed blob comes out clean.
describe('pre-commit hook', { skip: hasExiftool ? false : 'exiftool not installed' }, () => {
  function makeRepo() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-repo-'))
    const run = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' })
    run('init', '-q', '-b', 'main')
    run('config', 'user.email', 'test@example.com')
    run('config', 'user.name', 'Test')
    // The author's global config signs every commit. Left on, `git commit`
    // here blocks forever waiting for a GPG passphrase.
    run('config', 'commit.gpgsign', 'false')

    fs.mkdirSync(path.join(dir, '.githooks'))
    const hook = path.join(dir, '.githooks', 'pre-commit')
    fs.writeFileSync(hook, `#!/bin/sh\nexec node ${JSON.stringify(STRIPPER)} --staged\n`)
    fs.chmodSync(hook, 0o755)
    run('config', 'core.hooksPath', '.githooks')
    return { dir, run }
  }

  test('a committed photo has no location data', () => {
    const { dir, run } = makeRepo()
    try {
      makeGeotaggedJpeg(dir, 'vacation.jpg')
      run('add', 'vacation.jpg')
      run('commit', '-q', '-m', 'Add a photo')

      const blob = path.join(dir, 'extracted.jpg')
      fs.writeFileSync(blob, execFileSync('git', ['cat-file', 'blob', 'HEAD:vacation.jpg'], {
        cwd: dir, maxBuffer: 32 * 1024 * 1024, encoding: 'buffer'
      }))

      assert.deepEqual(findLocation([blob]), [], 'committed blob still carries location data')
      assert.deepEqual(findLocation([path.join(dir, 'vacation.jpg')]), [],
        'working copy still carries location data')
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  test('leaves the commit alone when the photo is already clean', () => {
    const { dir, run } = makeRepo()
    try {
      const file = makeGeotaggedJpeg(dir, 'clean.jpg')
      execFileSync('exiftool', ['-q', '-overwrite_original', '-gps:all=', file])
      const before = fs.readFileSync(file)

      run('add', 'clean.jpg')
      run('commit', '-q', '-m', 'Add a clean photo')

      assert.deepEqual(fs.readFileSync(file), before)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  // A staged photo whose working copy has moved on must not have the unstaged
  // version swept into the commit.
  test('cleans the staged blob without touching a drifted working copy', () => {
    const { dir, run } = makeRepo()
    try {
      makeGeotaggedJpeg(dir, 'drift.jpg')
      run('add', 'drift.jpg')

      // Replace the working copy with different content, still geotagged. The
      // colour has to differ: an identical file would hash the same as what was
      // staged, and the hook would rightly treat it as in sync.
      const other = makeGeotaggedJpeg(dir, 'other.jpg', { r: 10, g: 200, b: 240 })
      fs.copyFileSync(other, path.join(dir, 'drift.jpg'))
      fs.rmSync(other)

      run('commit', '-q', '-m', 'Add drifted photo')

      const blob = path.join(dir, 'extracted.jpg')
      fs.writeFileSync(blob, execFileSync('git', ['cat-file', 'blob', 'HEAD:drift.jpg'], {
        cwd: dir, maxBuffer: 32 * 1024 * 1024, encoding: 'buffer'
      }))
      assert.deepEqual(findLocation([blob]), [], 'committed blob still carries location data')

      // The unstaged working copy is the author's business; it stays as it was.
      assert.equal(findLocation([path.join(dir, 'drift.jpg')]).length, 1)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
