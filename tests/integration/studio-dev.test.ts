import { spawn, type ChildProcess } from 'node:child_process'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  isAlive,
  readDevServer,
  recordDevServer,
} from '../../tooling/dev-server/registry'
import { tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio
const children: ChildProcess[] = []

// A process standing in for a dev server.
function sleeper() {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
  })
  children.push(child)
  return child.pid!
}

function record(pid: number) {
  recordDevServer(studio.root, {
    port: 3917,
    pid,
    url: 'http://localhost:3917/',
    startedAt: new Date().toISOString(),
    startedBy: 'ada',
  })
}

beforeEach(() => {
  studio = tempStudio()
})
afterEach(() => {
  for (const child of children.splice(0)) child.kill()
  studio.remove()
})

describe('yarn studio dev', () => {
  test('[CL-56] status says whether this studio’s dev server runs, where, since when and who started it', () => {
    expect(studio.studio('dev', 'status').stdout).toContain(
      'No dev server is recorded',
    )
    record(sleeper())
    const text = studio.studio('dev', 'status')
    expect(text.stdout).toMatch(
      /Running: http:\/\/localhost:3917\/ \(port 3917, process \d+\), started by ada since/,
    )
    const json = JSON.parse(studio.studio('dev', 'status', '--json').stdout)
    expect(json).toMatchObject({ state: 'running', record: { port: 3917 } })
  })

  test('[CL-58] stop ends only the recorded process', () => {
    const recorded = sleeper()
    const other = sleeper()
    record(recorded)
    const result = studio.studio('dev', 'stop')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(
      `Stopped the dev server on port 3917 (process ${recorded})`,
    )
    expect(isAlive(recorded)).toBe(false)
    expect(isAlive(other)).toBe(true)
    expect(readDevServer(studio.root).state).toBe('absent')
  })

  test('[CL-55] [CL-58] a crashed server’s record is stale, and stop clears it', async () => {
    const pid = sleeper()
    record(pid)
    children.pop()!.kill('SIGKILL')
    await expect.poll(() => isAlive(pid)).toBe(false)
    expect(studio.studio('dev', 'status').stdout).toContain('Stale record')
    expect(studio.studio('dev', 'stop').stdout).toContain(
      'Removed the stale record',
    )
    expect(readDevServer(studio.root).state).toBe('absent')
  })

  test('[CL-57] restart needs a record, and a studio that can’t start leaves the running server alone', () => {
    const none = studio.studio('dev', 'restart')
    expect(none.status).toBe(1)
    expect(none.stderr).toContain('nothing to restart')

    const pid = sleeper()
    record(pid)
    studio.addModule('broken')
    studio.write('src/modules/broken/module.ts', 'export default { id: 1 }\n')
    const broken = studio.studio('dev', 'restart')
    expect(broken.status).toBe(1)
    expect(broken.stderr).toContain('left alone')
    expect(isAlive(pid)).toBe(true)
    expect(readDevServer(studio.root).state).toBe('running')
  })
})
