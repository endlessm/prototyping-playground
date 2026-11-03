// The dev server's restart trigger, on a temporary copy of the files: which
// changes restart the studio, waiting while a system operation runs, and
// skipping when the files are back to what the server started with. The
// watcher's events, the clock, the announcer and the restart are stand-ins,
// so nothing restarts.
import fs from 'node:fs'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, expect, test } from 'vitest'
import {
  restartTrigger,
  type TriggerOptions,
} from '../../tooling/restart/trigger'
import { NO_RESTART_EVENT, RESTART_EVENT } from '../../tooling/restart/names'

let root: string
const at = (file: string) => path.join(root, file)
function write(file: string, text: string) {
  fs.mkdirSync(path.dirname(at(file)), { recursive: true })
  fs.writeFileSync(at(file), text)
}
const CONFIG = '{ "name": "Studio" }\n'
const DECLARATION = 'export default { label: "Endless Studios" }\n'

/** A clock that moves only when the test says so. */
function fakeClock() {
  let now = 0
  let next = 0
  const timers = new Map<number, { at: number; run: () => void }>()
  return {
    setTimeout(run: () => void, ms: number) {
      timers.set(++next, { at: now + ms, run })
      return next
    },
    clearTimeout(timer: unknown) {
      timers.delete(timer as number)
    },
    advance(ms: number) {
      const until = now + ms
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, timer]) => timer.at <= until)
          .sort(([, a], [, b]) => a.at - b.at)[0]
        if (!due) break
        timers.delete(due[0])
        now = due[1].at
        due[1].run()
      }
      now = until
    },
  }
}

let clock: ReturnType<typeof fakeClock>
let watcher: EventEmitter & { add(paths: string[]): void }
let happened: string[]
let trigger: ReturnType<typeof restartTrigger>
beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'restart-')))
  write('studio.config.json', CONFIG)
  write('src/systems/endless-studios/system.ts', DECLARATION)
  clock = fakeClock()
  watcher = Object.assign(new EventEmitter(), { add: () => {} })
  happened = []
  trigger = restartTrigger(options())
})
const options = (): TriggerOptions => ({
  instance: 'A',
  configFile: at('studio.config.json'),
  systemsFolder: at('src/systems'),
  marker: at('.studio-system-operation'),
  watcher,
  clock,
  announce: (event, data) => happened.push(`${event} ${data.instance}`),
  restart: () => happened.push('restart'),
})
afterEach(() => {
  trigger.close()
  fs.rmSync(root, { recursive: true, force: true })
})

/** What the dev server's watcher reports after a file changes on disk. */
function changed(file: string, event: 'add' | 'change' | 'unlink' = 'change') {
  watcher.emit(event, at(file))
}

test('[SH-119] [CL-59] a configuration change announces the restart, then restarts the studio', () => {
  write('studio.config.json', '{ "name": "Renamed" }\n')
  changed('studio.config.json')
  changed('studio.config.json')
  clock.advance(1000)
  expect(happened).toEqual([`${RESTART_EVENT} A`, 'restart'])
})

test('[SY-24] [SY-45] [SY-55] a system declaration added, changed or removed restarts the studio', () => {
  write('src/systems/brand/system.ts', DECLARATION)
  changed('src/systems/brand/system.ts', 'add')
  clock.advance(1000)
  write('src/systems/brand/system.ts', 'export default { label: "Brand" }\n')
  changed('src/systems/brand/system.ts')
  clock.advance(1000)
  fs.rmSync(at('src/systems/endless-studios'), { recursive: true })
  changed('src/systems/endless-studios/system.ts', 'unlink')
  clock.advance(1000)
  expect(happened).toEqual([
    ...[`${RESTART_EVENT} A`, 'restart'],
    ...[`${RESTART_EVENT} A`, 'restart'],
    ...[`${RESTART_EVENT} A`, 'restart'],
  ])
})

test('[SH-119] other files, in a system’s folder or beside the configuration, don’t restart the studio', () => {
  write('src/systems/endless-studios/README.md', '# Endless Studios\n')
  changed('src/systems/endless-studios/README.md', 'add')
  write('src/systems/endless-studios/app/system.ts', DECLARATION)
  changed('src/systems/endless-studios/app/system.ts', 'add')
  write('studio.config.json.bak', '{}\n')
  changed('studio.config.json.bak', 'add')
  clock.advance(1000)
  expect(happened).toEqual([])
})

test('[SY-25] while a system operation holds its marker the restart waits, and follows once the marker is gone', () => {
  write('.studio-system-operation', '{}\n')
  write('src/systems/brand/system.ts', DECLARATION)
  changed('src/systems/brand/system.ts', 'add')
  write('studio.config.json', '{ "name": "Renamed" }\n')
  changed('studio.config.json')
  clock.advance(10_000)
  expect(happened).toEqual([])
  fs.rmSync(at('.studio-system-operation'))
  clock.advance(1000)
  expect(happened).toEqual([`${RESTART_EVENT} A`, 'restart'])
})

test('[SH-119] [SY-25] files put back as the server found them announce that no restart is coming, and don’t restart', () => {
  write('studio.config.json', '{ "name": "Renamed" }\n')
  changed('studio.config.json')
  write('studio.config.json', CONFIG)
  changed('studio.config.json')
  clock.advance(1000)
  // A system operation rolled back: its declaration is back, then the marker
  // goes.
  write('.studio-system-operation', '{}\n')
  fs.rmSync(at('src/systems/endless-studios/system.ts'))
  changed('src/systems/endless-studios/system.ts', 'unlink')
  clock.advance(1000)
  write('src/systems/endless-studios/system.ts', DECLARATION)
  changed('src/systems/endless-studios/system.ts', 'add')
  fs.rmSync(at('.studio-system-operation'))
  clock.advance(1000)
  expect(happened).toEqual([`${NO_RESTART_EVENT} A`, `${NO_RESTART_EVENT} A`])
})

/** Asks the trigger's light check over http, as a page would. */
async function ask(headers: Record<string, string> = {}, method = 'GET') {
  const server = http.createServer((req, res) => trigger.lightCheck(req, res))
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  const { port } = server.address() as AddressInfo
  try {
    return await new Promise<{ status: number; body: string; cache: string }>(
      (done, fail) => {
        const request = http.request(
          { host: '127.0.0.1', port, method, headers },
          (response) => {
            let body = ''
            response.on('data', (chunk) => (body += chunk))
            response.on('end', () =>
              done({
                status: response.statusCode ?? 0,
                body,
                cache: String(response.headers['cache-control']),
              }),
            )
          },
        )
        request.on('error', fail)
        request.end()
      },
    )
  } finally {
    server.close()
  }
}

test('[SH-119] the light check names this server, even while the configuration is broken', async () => {
  trigger.close()
  write('studio.config.json', '{ "name": "Studio", ')
  trigger = restartTrigger({ ...options(), instance: 'B' })
  const answer = await ask({ 'sec-fetch-site': 'same-origin' })
  expect(answer.status).toBe(200)
  expect(JSON.parse(answer.body)).toEqual({ instance: 'B' })
  expect(answer.cache).toBe('no-store')
})

test('[SH-119] the light check answers only the studio’s own pages', async () => {
  expect((await ask({ 'sec-fetch-site': 'cross-site' })).status).toBe(403)
  expect((await ask({ origin: 'http://elsewhere.test' })).status).toBe(403)
  expect((await ask({ 'sec-fetch-site': 'same-origin' }, 'POST')).status).toBe(
    405,
  )
  // Over plain http on a network address browsers leave the headers out.
  expect((await ask()).status).toBe(200)
})
