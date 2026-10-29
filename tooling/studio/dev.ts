// yarn studio dev status|restart|stop: this studio's own dev server, as the
// dev-server registry records it. Restart and stop end only the recorded
// process and its children; nothing is stopped by port or by name.
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import {
  clearDevServer,
  isAlive,
  logFile,
  readDevServer,
  runtimeDir,
  statusLines,
} from '../dev-server/registry.ts'
import { readContributors } from '../contributors/profiles.ts'
import { loadRegistry } from '../modules/registry.ts'
import { Refusal, say, type Flags } from './output.ts'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function until(check: () => boolean | Promise<boolean>, timeout: number) {
  for (const end = Date.now() + timeout; Date.now() < end; await delay(200))
    if (await check()) return true
  return check()
}

const portFree = (port: number) =>
  new Promise<boolean>((resolve) => {
    const probe = net.createServer()
    probe.once('error', () => resolve(false))
    probe.listen(port, () => probe.close(() => resolve(true)))
  })

// Windows ends the process tree; elsewhere the server closes its children on
// SIGTERM.
async function stopProcess(root: string, pid: number) {
  if (process.platform === 'win32')
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
  else {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // Already gone.
    }
    if (!(await until(() => !isAlive(pid), 10_000)))
      try {
        process.kill(pid, 'SIGKILL')
      } catch {
        // Already gone.
      }
  }
  if (!(await until(() => !isAlive(pid), 10_000)))
    throw new Refusal(`Process ${pid} did not stop. Nothing else was changed.`)
  clearDevServer(root, pid)
}

// What `yarn dev` needs before it serves: the modules, the configuration and
// the profiles must load. Checked before anything stops.
async function prepare(root: string) {
  try {
    await loadRegistry(root)
  } catch (error) {
    throw new Refusal(
      `The studio can't start: ${(error as Error).message} The running dev server was left alone.`,
    )
  }
  const { problems } = readContributors(root)
  if (problems.length)
    throw new Refusal(
      `The studio can't start: ${problems.join(' ')} The running dev server was left alone.`,
    )
}

function status(root: string, flags: Flags) {
  const current = readDevServer(root)
  say(flags.json ? JSON.stringify(current) : statusLines(current).join('\n'))
}

async function stop(root: string) {
  const current = readDevServer(root)
  if (current.state === 'absent') {
    say('No dev server is recorded for this studio. Nothing was stopped.')
    return
  }
  const { record } = current
  if (current.state === 'stale') {
    clearDevServer(root, record.pid)
    say(
      `Removed the stale record of the dev server on port ${record.port}; it was no longer running.`,
    )
    return
  }
  await stopProcess(root, record.pid)
  say(`Stopped the dev server on port ${record.port} (process ${record.pid}).`)
}

async function restart(root: string, flags: Flags) {
  const current = readDevServer(root)
  if (current.state === 'absent')
    throw new Refusal(
      'No dev server is recorded for this studio, so there is nothing to restart. Start one with yarn dev.',
    )
  const { port, pid, url, startedBy } = current.record
  await prepare(root)
  const nuxt = path.join(root, 'node_modules/nuxt/bin/nuxt.mjs')
  if (!fs.existsSync(nuxt))
    throw new Refusal(
      'Nuxt is not installed. Run yarn install, then yarn studio dev restart.',
    )
  if (current.state === 'running') await stopProcess(root, pid)
  else clearDevServer(root, pid)
  if (!(await until(() => portFree(port), 10_000)))
    throw new Refusal(
      `Port ${port} is still in use by another program. The dev server was stopped and not restarted.`,
    )
  const host = url ? new URL(url).hostname : ''
  // Detached, so it outlives this command, with its output in the log.
  fs.mkdirSync(runtimeDir(root), { recursive: true })
  const log = fs.openSync(logFile(root), 'w')
  const child = spawn(
    process.execPath,
    [
      nuxt,
      'dev',
      '--port',
      String(port),
      ...(host && host !== 'localhost' ? ['--host', host] : []),
    ],
    {
      cwd: root,
      detached: true,
      windowsHide: true,
      stdio: ['ignore', log, log],
      env: { ...process.env, STUDIO_DEV_STARTED_BY: startedBy },
    },
  )
  fs.closeSync(log)
  let exited: string | null = null
  child.once('exit', (code) => (exited = String(code ?? 'a signal')))
  child.unref()
  const started = await until(() => {
    const now = readDevServer(root)
    return (
      exited !== null ||
      (now.state === 'running' && now.record.pid === child.pid)
    )
  }, 120_000)
  const relative = path.relative(root, logFile(root))
  const log_ = (relative.startsWith('..') ? logFile(root) : relative)
    .split(path.sep)
    .join('/')
  if (exited !== null || !started)
    throw new Refusal(
      `The dev server did not start on port ${port}${exited !== null ? ` (it exited with ${exited})` : ''}. See ${log_}.`,
    )
  const now = readDevServer(root)
  if (now.state === 'absent')
    throw new Refusal('The dev server record vanished.')
  if (flags.json) {
    say(JSON.stringify({ state: 'running', record: now.record, log: log_ }))
    return
  }
  say(
    `Restarted the dev server at ${now.record.url} (port ${port}, process ${now.record.pid}).`,
  )
  say(
    `It runs in the background with its output in ${log_}. Stop it with yarn studio dev stop.`,
  )
  if (current.state === 'running')
    say(
      `If the previous server (process ${pid}) ran in a terminal, that terminal has returned to its prompt.`,
    )
}

export async function dev(root: string, [action]: string[], flags: Flags) {
  if (action === 'status') return status(root, flags)
  if (action === 'stop') return stop(root)
  if (action === 'restart') return restart(root, flags)
  throw new Refusal(
    [
      'Usage: yarn studio dev status [--json] | restart [--json] | stop',
      '  status   whether this studio dev server runs, its port, since when and started by whom',
      '  restart  stop the recorded dev server only, then start it again on the same port, in the background',
      '  stop     stop the recorded dev server only, or clear a stale record',
    ].join('\n'),
  )
}
