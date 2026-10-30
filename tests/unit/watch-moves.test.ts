// Renames and moves made outside the studio (an editor, File Explorer or
// Finder) while the dev server runs: the watcher compares each of your
// prototypes with how it was, and repairs references for the moves it is
// sure of. Driven by calling `flush` as the dev server's file events would.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { references } from '../../src/modules/prototypes/references'
import { watchMoves } from '../../tooling/files/watch-moves'

let root: string
const at = (file: string) => path.join(root, file)
function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true })
  fs.writeFileSync(at(file), text)
}
const read = (file: string) => fs.readFileSync(at(file), 'utf8')
const HOME = `<template><PrototypeLink to="flows/Start" /></template>\n<script setup lang="ts">\nimport Card from './_parts/Card.vue'\n</script>\n`

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'watch-')))
  for (const name of ['mine', 'other']) {
    write(`${name}/Home.vue`, HOME)
    write(`${name}/flows/Start.vue`, '<template><p /></template>\n')
    write(`${name}/_parts/Card.vue`, '<template><p /></template>\n')
  }
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

const watcher = () => {
  const moved: { dir: string; relinked: string[] }[] = []
  const watch = watchMoves({
    scopes: () => [at('mine')],
    references: async () => references,
    onRepair: (dir, relinked) => moved.push({ dir, relinked }),
  })
  watch.capture()
  return { watch, moved }
}

test('[PR-68] a file renamed or moved outside the studio has the references to it repaired', async () => {
  const { watch, moved } = watcher()
  fs.renameSync(at('mine/flows'), at('mine/journeys'))
  await watch.flush()
  expect(read('mine/Home.vue')).toContain('to="journeys/Start"')
  expect(moved).toEqual([{ dir: at('mine'), relinked: ['Home.vue'] }])
  fs.mkdirSync(at('mine/screens'))
  fs.renameSync(at('mine/Home.vue'), at('mine/screens/Home.vue'))
  await watch.flush()
  expect(read('mine/screens/Home.vue')).toContain(
    `import Card from '../_parts/Card.vue'`,
  )
})

test('[PR-68] copies, deletes, moves to another prototype and prototypes that aren’t yours are not guessed', async () => {
  const { watch, moved } = watcher()
  fs.copyFileSync(at('mine/flows/Start.vue'), at('mine/Start.vue'))
  fs.rmSync(at('mine/flows/Start.vue'))
  await watch.flush()
  fs.renameSync(at('mine/_parts/Card.vue'), at('other/Card.vue'))
  await watch.flush()
  fs.renameSync(at('other/flows'), at('other/journeys'))
  await watch.flush()
  expect(read('mine/Home.vue')).toBe(HOME)
  expect(read('other/Home.vue')).toBe(HOME)
  expect(moved).toEqual([])
})

test('[PR-68] after the studio’s own move is captured, the watcher doesn’t repair it again', async () => {
  const { watch, moved } = watcher()
  fs.renameSync(at('mine/flows'), at('mine/journeys'))
  watch.capture()
  await watch.flush()
  expect(read('mine/Home.vue')).toBe(HOME)
  expect(moved).toEqual([])
})
