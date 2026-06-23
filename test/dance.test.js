import { test } from 'node:test'
import assert from 'node:assert/strict'

import { extractDances } from '../scripts/dance.mjs'

test('extractDances collects dances across sets and events', () => {
  const programs = [
    [
      [
        { title: 'Dance A', author: 'Author One' },
        { title: 'Dance B', author: 'Author Two' },
      ],
      [
        { title: 'Dance C', author: 'Author Three' },
      ],
    ],
  ]
  const dances = extractDances(programs)
  assert.deepEqual(dances, [
    { title: 'Dance A', author: 'Author One', count: 1 },
    { title: 'Dance B', author: 'Author Two', count: 1 },
    { title: 'Dance C', author: 'Author Three', count: 1 },
  ])
})

test('extractDances sorts results by title', () => {
  const programs = [
    [[
      { title: 'Zebra', author: 'Z' },
      { title: 'Apple', author: 'A' },
      { title: 'Mango', author: 'M' },
    ]],
  ]
  const titles = extractDances(programs).map((d) => d.title)
  assert.deepEqual(titles, ['Apple', 'Mango', 'Zebra'])
})

test('extractDances counts repeated dances by the same author', () => {
  const programs = [
    [[{ title: 'Popular Dance', author: 'Same Author' }]],
    [[{ title: 'Popular Dance', author: 'Same Author' }]],
    [[{ title: 'Popular Dance', author: 'Same Author' }]],
  ]
  const dances = extractDances(programs)
  assert.deepEqual(dances, [
    { title: 'Popular Dance', author: 'Same Author', count: 3 },
  ])
})

test('extractDances does not count a dance attributed to a different author', () => {
  const programs = [
    [[{ title: 'Ambiguous', author: 'First Author' }]],
    [[{ title: 'Ambiguous', author: 'Different Author' }]],
  ]
  const dances = extractDances(programs)
  // The second entry's author differs, so it is neither counted nor overwrites
  assert.deepEqual(dances, [
    { title: 'Ambiguous', author: 'First Author', count: 1 },
  ])
})

test('extractDances splits medleys into their component dances', () => {
  const programs = [
    [[
      {
        title: 'Medley: First Tune, Second Tune, Third Tune',
        author: 'Author A, Author B, Author C',
        medley: true,
      },
    ]],
  ]
  const dances = extractDances(programs)
  assert.deepEqual(dances, [
    { title: 'First Tune', author: 'Author A', count: 1 },
    { title: 'Second Tune', author: 'Author B', count: 1 },
    { title: 'Third Tune', author: 'Author C', count: 1 },
  ])
})

test('extractDances reuses the first author when a medley lists fewer authors', () => {
  const programs = [
    [[
      {
        title: 'Medley: One, Two',
        author: 'Solo Author',
        medley: true,
      },
    ]],
  ]
  const dances = extractDances(programs)
  assert.deepEqual(dances, [
    { title: 'One', author: 'Solo Author', count: 1 },
    { title: 'Two', author: 'Solo Author', count: 1 },
  ])
})

test('extractDances handles a "Medley:" prefix case-insensitively', () => {
  const programs = [
    [[{ title: 'medley: Lower, Case', author: 'X, Y', medley: true }]],
  ]
  const titles = extractDances(programs).map((d) => d.title)
  assert.deepEqual(titles, ['Case', 'Lower'])
})

test('extractDances skips dances missing a title or author', () => {
  const programs = [
    [[
      { title: 'Has Both', author: 'Author' },
      { title: 'No Author' },
      { author: 'No Title' },
    ]],
  ]
  const dances = extractDances(programs)
  assert.deepEqual(dances, [
    { title: 'Has Both', author: 'Author', count: 1 },
  ])
})

test('extractDances ignores events without a program', () => {
  const programs = [
    undefined,
    null,
    [[{ title: 'Only Dance', author: 'Author' }]],
  ]
  const dances = extractDances(programs)
  assert.deepEqual(dances, [
    { title: 'Only Dance', author: 'Author', count: 1 },
  ])
})

test('extractDances returns an empty array for no events', () => {
  assert.deepEqual(extractDances([]), [])
})
