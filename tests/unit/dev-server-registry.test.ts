import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  clearDevServer,
  readDevServer,
  recordDevServer,
  runtimeDir,
  statusLines,
} from '../../tooling/dev-server/registry'

let root: string
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-registry-'))
})
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

const alive = () => true
const dead = () => false
const record = {
  port: 3000,
  pid: 4242,
  url: 'http://localhost:3000/',
  startedAt: '2026-10-28T10:00:00.000Z',
  startedBy: 'ada',
}

describe('the dev-server record', () => {
  test('[CL-54] records folder, port, process, URL, start time and who started it, in a folder Git ignores', () => {
    recordDevServer(root, record)
    const dir = runtimeDir(root)
    expect(dir).toBe(path.join(root, '.studio/runtime'))
    expect(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8')).toBe('*\n')
    expect(readDevServer(root, { alive })).toEqual({
      state: 'running',
      record: { root: path.resolve(root), ...record },
    })
  })

  test('[CL-55] a crashed server is stale, and a record copied from another folder is ignored', () => {
    recordDevServer(root, record)
    expect(readDevServer(root, { alive: dead }).state).toBe('stale')

    const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-copy-'))
    fs.cpSync(root, copy, { recursive: true })
    expect(readDevServer(copy, { alive })).toEqual({ state: 'absent' })
    fs.rmSync(copy, { recursive: true, force: true })
  })

  test('[CL-58] clearing removes only the named process’s record', () => {
    recordDevServer(root, record)
    expect(clearDevServer(root, 1)).toBe(false)
    expect(readDevServer(root, { alive }).state).toBe('running')
    expect(clearDevServer(root, record.pid)).toBe(true)
    expect(readDevServer(root, { alive }).state).toBe('absent')
  })

  test('[CL-56] status says where it runs, since when and who started it', () => {
    recordDevServer(root, record)
    const now = Date.parse(record.startedAt) + 5 * 60_000
    expect(statusLines(readDevServer(root, { alive }), now)).toEqual([
      'Running: http://localhost:3000/ (port 3000, process 4242), started by ada since 2026-10-28T10:00:00.000Z (5 min ago).',
    ])
    expect(statusLines(readDevServer(root, { alive: dead }), now)[0]).toContain(
      'Stale record',
    )
    expect(statusLines({ state: 'absent' })[0]).toContain('No dev server')
  })
})
