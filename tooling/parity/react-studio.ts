// The React studio for parity runs: a copy of a Git commit (by default
// `main`) outside this checkout, installed with its own toolchain (the Node
// and pnpm its `mise.toml` names, through mise or, where mise is missing,
// the Node folder `STUDIO_PARITY_NODE` names), with the parity fixtures as
// its prototypes. Its dev server starts with `pnpm dev` and stops with
// `pnpm studio dev stop`, so the React studio's own dev-server registry,
// kept inside the copy, decides what is stopped.
import { spawn, spawnSync, type SpawnOptions } from 'node:child_process'
import {
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { writeReactPrototypes } from './fixtures'

export interface ReactStudio {
  root: string
  commit: string
}

export interface RunningReactStudio extends ReactStudio {
  url: string
  stop: () => Promise<void>
}

const INSTALLED = '.parity-installed'
const RECORD = '.studio/runtime/dev-server.json'
const LOG = 'parity-dev.log'

// Not the system temp folder: cleanup there removed files from an installed
// copy between runs.
export const DEFAULT_CACHE =
  process.env.STUDIO_PARITY_CACHE ??
  path.join(os.homedir(), '.cache', 'studio-parity')

// Vitest's own environment would leak into the React studio's tools.
function cleanEnv(
  env: Record<string, string | undefined> = process.env,
  extra: Record<string, string> = {},
) {
  return {
    ...Object.fromEntries(
      Object.entries(env).filter(
        ([key, value]) =>
          value !== undefined &&
          !['NODE_ENV', 'TEST'].includes(key) &&
          !key.startsWith('VITEST'),
      ),
    ),
    ...extra,
  } as Record<string, string>
}

function git(args: string[], env: Record<string, string> = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    env: cleanEnv(process.env, env),
  })
  if (result.status !== 0)
    throw new Error(`git ${args.join(' ')} failed:\n${result.stderr}`)
  return result.stdout.trim()
}

export interface Toolchain {
  command: string
  /** The command's arguments for running `pnpm <args>`. */
  args: (pnpmArgs: string[]) => string[]
  env: Record<string, string>
  /** `pnpm` from PATH is a `.cmd` shim on Windows. */
  shell: boolean
}

// `24` matches 24.x.y, `24.1` matches 24.1.y.
function satisfies(version: string, wanted: string) {
  const bare = version.trim().replace(/^v/, '')
  return bare === wanted || bare.startsWith(`${wanted}.`)
}

/**
 * How to run the copy's pnpm with the Node and pnpm its own `mise.toml`
 * names: `mise exec node@24 pnpm@12 -- pnpm …`, or, when
 * `STUDIO_PARITY_NODE` names a folder holding that Node, `pnpm …` from PATH
 * with that folder first, after checking both versions.
 */
export function reactToolchain(
  root: string,
  env: Record<string, string | undefined> = process.env,
): Toolchain {
  const config = readFileSync(path.join(root, 'mise.toml'), 'utf8')
  const tools = new Map(
    [...config.matchAll(/^(node|pnpm)\s*=\s*"([^"]+)"/gm)].map(
      ([, tool, version]) => [tool!, version!],
    ),
  )
  const node = tools.get('node')
  if (!node) throw new Error(`${root}/mise.toml names no Node version`)
  const base = cleanEnv(env)
  const nodeFolder = env.STUDIO_PARITY_NODE
  if (!nodeFolder) {
    const pinned = [...tools].map(([tool, version]) => `${tool}@${version}`)
    return {
      command: 'mise',
      args: (pnpmArgs) => ['exec', ...pinned, '--', 'pnpm', ...pnpmArgs],
      env: base,
      shell: false,
    }
  }

  const pathKey =
    Object.keys(base).find((key) => key.toUpperCase() === 'PATH') ?? 'PATH'
  const toolchainEnv = {
    ...base,
    [pathKey]: [nodeFolder, base[pathKey]].filter(Boolean).join(path.delimiter),
  }
  const nodeVersion = spawnSync(
    path.join(nodeFolder, process.platform === 'win32' ? 'node.exe' : 'node'),
    ['--version'],
    { encoding: 'utf8', windowsHide: true },
  ).stdout?.trim()
  if (!nodeVersion || !satisfies(nodeVersion, node))
    throw new Error(
      `The React studio needs Node ${node}, but ${nodeFolder} has ${nodeVersion || 'no node'} (STUDIO_PARITY_NODE)`,
    )
  const shell = process.platform === 'win32'
  const pnpm = tools.get('pnpm')
  if (pnpm) {
    const pnpmVersion = spawnSync('pnpm', ['--version'], {
      cwd: root,
      encoding: 'utf8',
      env: toolchainEnv,
      shell,
      windowsHide: true,
    }).stdout?.trim()
    if (!pnpmVersion || !satisfies(pnpmVersion, pnpm))
      throw new Error(
        `The React studio needs pnpm ${pnpm}, but PATH has ${pnpmVersion || 'no pnpm'}`,
      )
  }
  return {
    command: 'pnpm',
    args: (pnpmArgs) => pnpmArgs,
    env: toolchainEnv,
    shell,
  }
}

function pnpm(root: string, args: string[], options: SpawnOptions = {}) {
  const toolchain = reactToolchain(root)
  return spawn(toolchain.command, toolchain.args(args), {
    cwd: root,
    env: { ...toolchain.env, STUDIO_DEV_STARTED_BY: 'the parity harness' },
    shell: toolchain.shell,
    windowsHide: true,
    ...options,
  })
}

function finished(child: ReturnType<typeof spawn>) {
  return new Promise<number | null>((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', resolve)
  })
}

async function pnpmOrFail(root: string, args: string[]) {
  const child = pnpm(root, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout?.on('data', (chunk) => (output += chunk))
  child.stderr?.on('data', (chunk) => (output += chunk))
  const code = await finished(child)
  if (code !== 0)
    throw new Error(`pnpm ${args.join(' ')} failed (${code}):\n${output}`)
  return output
}

function readRecord(root: string) {
  try {
    return JSON.parse(readFileSync(path.join(root, RECORD), 'utf8')) as {
      pid: number
      port: number
      url?: string
    }
  } catch {
    return null
  }
}

function installedCommit(root: string) {
  try {
    return readFileSync(path.join(root, INSTALLED), 'utf8')
  } catch {
    return null
  }
}

function alive(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/**
 * Copies the commit and installs it, once per commit; every call puts the
 * parity fixtures back as its prototypes.
 */
export async function prepareReactStudio({
  ref = 'main',
  cacheDir = DEFAULT_CACHE,
}: { ref?: string; cacheDir?: string } = {}): Promise<ReactStudio> {
  const commit = git(['rev-parse', '--verify', `${ref}^{commit}`])
  const root = path.join(cacheDir, `react-${commit.slice(0, 12)}`)
  if (installedCommit(root) !== commit) {
    await stopRecorded(root)
    rmSync(root, { recursive: true, force: true })
    mkdirSync(root, { recursive: true })
    // A checkout into another folder through a throwaway index leaves this
    // checkout's own index and files alone.
    const index = path.join(cacheDir, `index-${process.pid}`)
    try {
      git(['--work-tree', root, 'checkout', commit, '--', '.'], {
        GIT_INDEX_FILE: index,
      })
    } finally {
      rmSync(index, { force: true })
    }
    await pnpmOrFail(root, ['install', '--frozen-lockfile', '--prefer-offline'])
    writeFileSync(path.join(root, INSTALLED), commit)
  }
  removeOtherCopies(cacheDir, root)
  writeReactPrototypes(path.join(root, 'src/prototypes'))
  return { root, commit }
}

// Copies of older commits, unless a dev server still runs from one.
function removeOtherCopies(cacheDir: string, keep: string) {
  for (const name of readdirSync(cacheDir)) {
    const dir = path.join(cacheDir, name)
    if (!name.startsWith('react-') || dir === keep) continue
    const record = readRecord(dir)
    if (record && alive(record.pid)) continue
    rmSync(dir, { recursive: true, force: true })
  }
}

/** Stops the dev server the copy's registry records, if one runs: only a harness run can have started it. */
async function stopRecorded(root: string) {
  const record = readRecord(root)
  if (!record) return
  // A run killed with its host process leaves the record behind, and its
  // process ID can belong to an unrelated program later: stop only a server
  // that still answers on the recorded port.
  let answers = false
  try {
    answers = (
      await fetch(record.url ?? `http://localhost:${record.port}/`, {
        signal: AbortSignal.timeout(5_000),
      })
    ).ok
  } catch {
    // Nothing listens there.
  }
  if (answers && alive(record.pid))
    await pnpmOrFail(root, ['studio', 'dev', 'stop'])
  else rmSync(path.join(root, RECORD), { force: true })
}

export async function startReactStudio(
  studio: ReactStudio,
  { port, timeout = 300_000 }: { port: number; timeout?: number },
): Promise<RunningReactStudio> {
  const { root } = studio
  // A server left by an interrupted run would refuse a second one.
  await stopRecorded(root)
  const log = openSync(path.join(root, LOG), 'w')
  const child = pnpm(root, ['dev', '--port', String(port), '--strictPort'], {
    stdio: ['ignore', log, log],
  })
  closeSync(log)
  let exited: number | null | undefined
  child.once('exit', (code) => (exited = code))
  child.once('error', () => (exited = -1))

  const stop = async () => {
    await stopRecorded(root)
    // The mise (or shell) and pnpm processes around the server end with it; if they
    // linger, they are this run's own.
    if (exited !== undefined) return
    const ended = await Promise.race([
      finished(child).then(() => true),
      new Promise<false>((resolve) => setTimeout(resolve, 15_000, false)),
    ])
    if (!ended && child.pid && process.platform === 'win32')
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })
    else if (!ended) child.kill()
  }

  const deadline = Date.now() + timeout
  const logTail = () =>
    readFileSync(path.join(root, LOG), 'utf8').split('\n').slice(-30).join('\n')
  while (Date.now() < deadline) {
    if (exited !== undefined)
      throw new Error(
        `The React studio's dev server exited (${exited}):\n${logTail()}`,
      )
    const record = readRecord(root)
    if (record?.port === port && alive(record.pid)) {
      const url = record.url ?? `http://localhost:${port}/`
      try {
        if ((await fetch(url)).ok) return { ...studio, url, stop }
      } catch {
        // Recorded before it answers.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  await stop()
  throw new Error(
    `The React studio did not start on port ${port} within ${timeout / 1000} s:\n${logTail()}`,
  )
}
