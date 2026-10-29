// Starts the studio for browser scenarios: the dev server, or the static build
// served the way a static host serves it.
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { createServer } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { serveStatic } from '../../../tooling/serve-static.ts'

export interface RunningStudio {
  /** Address of Home, ending in a slash. */
  url: string
  stop: () => Promise<void>
}

const NUXT = path.resolve('node_modules/nuxt/bin/nuxt.mjs')

export async function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number }
      server.close(() => resolve(port))
    })
  })
}

// Vitest's own environment would make Nuxt build in test mode.
function cleanEnv() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !['NODE_ENV', 'TEST'].includes(key) && !key.startsWith('VITEST'),
    ),
  )
}

function run(args: string[], env: Record<string, string>) {
  return spawn(process.execPath, [NUXT, ...args], {
    env: { ...cleanEnv(), ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

async function waitFor(url: string, timeout: number) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok && (await response.text()).includes('__nuxt')) return
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`The studio did not answer at ${url}`)
}

export async function startDevServer(
  env: Record<string, string> = {},
  // `0.0.0.0` also answers on the computer's network addresses.
  { host = '127.0.0.1' }: { host?: string } = {},
): Promise<RunningStudio> {
  const port = await freePort()
  // Its own build directory and dev-server record, so a person's `yarn dev`
  // in the same checkout keeps running and keeps its record.
  const child = run(['dev', '--port', String(port), '--host', host], {
    STUDIO_RUNTIME_DIR: mkdtempSync(path.join(os.tmpdir(), 'studio-runtime-')),
    ...env,
    STUDIO_BUILD_DIR: '.nuxt-e2e',
  })
  let log = ''
  child.stdout.on('data', (chunk) => (log += chunk))
  child.stderr.on('data', (chunk) => (log += chunk))
  const url = `http://127.0.0.1:${port}/`
  try {
    await waitFor(url, 300_000)
  } catch (error) {
    child.kill()
    throw new Error(`${(error as Error).message}\n${log}`, { cause: error })
  }
  return {
    url,
    stop: async () => {
      if (child.exitCode !== null) return
      const exited = new Promise((resolve) => child.once('exit', resolve))
      child.kill()
      await exited
    },
  }
}

export const STATIC_OUTPUT = '.output-e2e'

export async function buildStaticSite(
  basePath: string,
  env: Record<string, string> = {},
) {
  const child = run(['generate'], {
    ...env,
    STUDIO_BASE_PATH: basePath,
    STUDIO_OUTPUT_DIR: STATIC_OUTPUT,
    STUDIO_BUILD_DIR: '.nuxt-e2e-build',
  })
  let log = ''
  child.stdout.on('data', (chunk) => (log += chunk))
  child.stderr.on('data', (chunk) => (log += chunk))
  const code = await new Promise<number | null>((resolve) =>
    child.once('exit', resolve),
  )
  if (code !== 0) throw new Error(`nuxt generate failed (${code}):\n${log}`)
  return path.resolve(STATIC_OUTPUT, 'public')
}

export async function startStaticSite(
  basePath: string,
  env: Record<string, string> = {},
): Promise<RunningStudio & { directory: string }> {
  const directory = await buildStaticSite(basePath, env)
  const server = await serveStatic({ directory, basePath, port: 0 })
  return { url: server.url, stop: server.close, directory }
}
