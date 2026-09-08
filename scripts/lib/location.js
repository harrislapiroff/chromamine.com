// Detecting and removing location metadata from media files.
//
// Everything here shells out to exiftool. It is the only tool that reliably
// understands where GPS data hides across the formats this repo carries, and
// it is already a dependency of the author's workflow rather than something
// npm can install.

import { spawnSync } from 'node:child_process'
import path from 'node:path'

// Extensions treated as "photos" for stripping purposes. Deliberately broader
// than what the repo currently holds: the point is that a format nobody has
// committed yet still gets checked the first time one shows up.
export const MEDIA_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.tif', '.tiff', '.heic', '.heif', '.webp',
  '.avif', '.gif', '.mp4', '.mov', '.m4v', '.dng', '.cr2', '.nef', '.arw',
  '.raf', '.orf', '.rw2'
])

// Formats exiftool cannot rewrite in place. It can read GPS out of these but
// not delete it, so a hit here has to be reported rather than quietly "fixed".
// QuickTime-family video is the real case; the rest are here for completeness.
export const UNWRITABLE_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v'])

export function isMediaPath(filePath) {
  return MEDIA_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

export function isUnwritablePath(filePath) {
  return UNWRITABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

// Returns the exiftool version string, or null when exiftool is not installed.
export function exiftoolVersion() {
  const result = spawnSync('exiftool', ['-ver'], { encoding: 'utf8' })
  if (result.error || result.status !== 0) return null
  return result.stdout.trim()
}

export class ExiftoolMissingError extends Error {
  constructor() {
    super(
      'exiftool is not installed, so location metadata cannot be checked.\n' +
      'Install it with `brew install exiftool`.'
    )
    this.name = 'ExiftoolMissingError'
  }
}

// Run exiftool with the file list on stdin.
//
// The list goes through `-@ -` rather than argv for two reasons: argv has a
// length ceiling this repo's media directory could plausibly hit, and paths
// with spaces survive without quoting rules getting involved.
function runExiftool(args, files) {
  const result = spawnSync('exiftool', [...args, '-@', '-'], {
    input: files.join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  })
  if (result.error) throw result.error
  return result
}

// Parse the -json output of a GPS extraction into {file, tags} records.
//
// With `-gps:all` a clean file still produces an object -- it just has nothing
// in it beyond SourceFile. Anything more than that key is location data.
export function parseLocationReport(stdout) {
  const trimmed = (stdout || '').trim()
  if (!trimmed) return []

  let entries
  try {
    entries = JSON.parse(trimmed)
  } catch {
    throw new Error(`Could not parse exiftool JSON output:\n${trimmed.slice(0, 500)}`)
  }

  const found = []
  for (const entry of entries) {
    const tags = Object.keys(entry).filter((key) => key !== 'SourceFile')
    if (tags.length) found.push({ file: entry.SourceFile, tags: tags.sort() })
  }
  return found
}

// Which of `files` carry location metadata, and which tags each one has.
export function findLocation(files) {
  if (!files.length) return []
  if (!exiftoolVersion()) throw new ExiftoolMissingError()

  const result = runExiftool(['-m', '-q', '-json', '-gps:all'], files)
  return parseLocationReport(result.stdout)
}

// Delete the whole GPS group from each file in place.
//
// `-gps:all=` takes the entire group rather than a hand-listed set of tags.
// An earlier pass at this repo listed tags individually and left GPSImgDirection
// behind on two files, which is exactly the failure mode the group form avoids.
// `-P` keeps the filesystem mtime so stripping does not churn build caches.
export function stripLocation(files) {
  if (!files.length) return
  if (!exiftoolVersion()) throw new ExiftoolMissingError()

  const result = runExiftool(
    ['-gps:all=', '-overwrite_original', '-P', '-q', '-m'],
    files
  )
  if (result.status !== 0) {
    throw new Error(
      `exiftool failed to strip location data (exit ${result.status}):\n` +
      `${result.stderr || result.stdout}`
    )
  }
}
