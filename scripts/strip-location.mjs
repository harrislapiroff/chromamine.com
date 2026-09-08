#!/usr/bin/env node

// Remove location metadata from photos, and check that none is present.
//
// Three modes, in rough order of how often they run:
//
//   --staged   what the pre-commit hook uses. Rewrites the staged blobs, so
//              whatever lands in the commit is clean no matter what is on disk.
//   --check    audit only, non-zero exit if anything has location data. Used by
//              `npm run validate` and safe to run in CI.
//   (default)  strip every tracked photo, or just the paths given as arguments.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'url'
import { program } from 'commander'

import {
  ExiftoolMissingError,
  exiftoolVersion,
  findLocation,
  isMediaPath,
  isUnwritablePath,
  stripLocation
} from './lib/location.js'

const __filename = fileURLToPath(import.meta.url)

// The repo this is being run against, which is not necessarily the repo the
// script lives in: the pre-commit hook resolves paths relative to the checkout
// git invoked it from. Cached because every git call below needs it.
let cachedRoot = null
function repoRoot() {
  if (cachedRoot) return cachedRoot
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    throw new Error('Not inside a git repository.')
  }
  cachedRoot = result.stdout.trim()
  return cachedRoot
}

function git(args, { encoding = 'utf8' } = {}) {
  const result = spawnSync('git', args, {
    cwd: repoRoot(),
    encoding,
    maxBuffer: 256 * 1024 * 1024
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const stderr = result.stderr instanceof Buffer ? result.stderr.toString() : result.stderr
    throw new Error(`git ${args.join(' ')} failed:\n${stderr}`)
  }
  return result.stdout
}

function splitZ(output) {
  return output.split('\0').filter(Boolean)
}

export function trackedMedia() {
  return splitZ(git(['ls-files', '-z'])).filter(isMediaPath)
}

// Index entries for the photos staged in this commit.
//
// --diff-filter=ACMR skips deletions: a removed photo has no content to clean,
// and asking ls-files for it would come back empty anyway.
export function stagedMedia() {
  const changed = splitZ(
    git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'])
  ).filter(isMediaPath)
  if (!changed.length) return []

  return splitZ(git(['ls-files', '--stage', '-z', '--', ...changed])).map((line) => {
    const tab = line.indexOf('\t')
    const [mode, sha, stage] = line.slice(0, tab).split(/\s+/)
    return { mode, sha, stage, path: line.slice(tab + 1) }
  })
}

// Strip the staged blobs themselves rather than the files on disk.
//
// Going through the index matters when the working copy and the staged content
// have drifted apart -- `git add`ing the file back would then sweep unstaged
// changes into the commit. Rewriting the blob touches only what is being
// committed, and the working copy is synced separately below when it is safe.
function stripStaged() {
  const entries = stagedMedia()
  const result = { checked: entries.length, stripped: [], blocked: [], stale: [] }
  if (!entries.length) return result

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-location-'))
  try {
    for (const entry of entries) {
      entry.tmp = path.join(tmpDir, `${entry.sha}${path.extname(entry.path)}`)
      fs.writeFileSync(entry.tmp, git(['cat-file', 'blob', entry.sha], { encoding: 'buffer' }))
    }

    const hits = new Set(
      findLocation(entries.map((entry) => entry.tmp)).map((hit) => path.resolve(hit.file))
    )
    if (!hits.size) return result

    for (const entry of entries) {
      if (!hits.has(path.resolve(entry.tmp))) continue

      // exiftool can read GPS out of QuickTime video but cannot delete it.
      // Better to stop the commit than to report a clean strip that did not
      // happen.
      if (isUnwritablePath(entry.path)) {
        result.blocked.push(entry.path)
        continue
      }

      stripLocation([entry.tmp])
      const newSha = git(['hash-object', '-w', '--', entry.tmp]).trim()
      git(['update-index', '--cacheinfo', `${entry.mode},${newSha},${entry.path}`])
      result.stripped.push(entry.path)

      // Only overwrite the working copy when it still matches what was staged.
      // If it has moved on, the file on disk is the author's business; say so
      // rather than clobbering it.
      const onDisk = path.join(repoRoot(), entry.path)
      const diskSha = fs.existsSync(onDisk)
        ? git(['hash-object', '--', onDisk]).trim()
        : null
      if (diskSha === entry.sha) {
        fs.copyFileSync(entry.tmp, onDisk)
      } else if (diskSha !== null && diskSha !== newSha) {
        result.stale.push(entry.path)
      }
    }
    return result
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

function reportStaged(result) {
  if (result.stripped.length) {
    console.log(`Stripped location data from ${result.stripped.length} staged photo(s):`)
    for (const file of result.stripped.sort()) console.log(`  ${file}`)
    console.log('The cleaned versions have been re-staged.')
  }

  if (result.stale.length) {
    console.log('\nStaged copies were cleaned, but these working copies still')
    console.log('hold location data because they differ from what you staged:')
    for (const file of result.stale.sort()) console.log(`  ${file}`)
    console.log('Run `npm run strip-location` to clean them too.')
  }

  if (result.blocked.length) {
    console.error('\nThese files carry location data that exiftool cannot remove:')
    for (const file of result.blocked.sort()) console.error(`  ${file}`)
    console.error('Re-encode them without metadata before committing.')
    return 1
  }
  return 0
}

function reportCheck(hits) {
  if (!hits.length) {
    console.log('No location metadata found.')
    return 0
  }
  console.log(`${hits.length} file(s) carry location metadata:\n`)
  for (const { file, tags } of hits.sort((a, b) => a.file.localeCompare(b.file))) {
    console.log(`  ${file}`)
    console.log(`    ${tags.join(', ')}`)
  }
  console.log('\nRun `npm run strip-location` to remove it.')
  return 1
}

program
  .name('strip-location')
  .description('Remove GPS metadata from photos, or check that none is present')
  .argument('[files...]', 'Files to process (default: every tracked photo)')
  .option('--check', 'Report location data without removing it; exit non-zero if any is found')
  .option('--staged', 'Clean the photos staged for commit (used by the pre-commit hook)')
  .action((files, { check, staged }) => {
    if (staged && check) {
      console.error('--staged and --check cannot be combined.')
      process.exit(2)
    }

    if (staged) {
      // A repo without exiftool should not be silently unprotected.
      if (!exiftoolVersion() && stagedMedia().length) throw new ExiftoolMissingError()
      process.exit(reportStaged(stripStaged()))
    }

    const targets = files.length ? files.filter(isMediaPath) : trackedMedia()
    if (!targets.length) {
      console.log('No photos to check.')
      return
    }

    const hits = findLocation(targets)
    if (check) process.exit(reportCheck(hits))

    if (!hits.length) {
      console.log(`No location metadata found in ${targets.length} photo(s).`)
      return
    }

    const blocked = hits.filter((hit) => isUnwritablePath(hit.file))
    const strippable = hits.filter((hit) => !isUnwritablePath(hit.file))

    if (strippable.length) {
      stripLocation(strippable.map((hit) => hit.file))
      console.log(`Stripped location data from ${strippable.length} photo(s):`)
      for (const { file } of strippable) console.log(`  ${file}`)
    }

    if (blocked.length) {
      console.error('\nCould not strip these (exiftool cannot write the format):')
      for (const { file } of blocked) console.error(`  ${file}`)
      process.exit(1)
    }
  })

if (process.argv[1] === __filename) {
  try {
    program.parse()
  } catch (error) {
    console.error(error instanceof ExiftoolMissingError ? error.message : error)
    process.exit(2)
  }
}
