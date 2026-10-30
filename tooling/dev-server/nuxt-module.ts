// Records the running dev server in the dev-server registry and refuses a
// second one for the same studio. `nuxt dev` serves from a forked child that
// it restarts on configuration changes; the record names the parent, which
// holds the port and owns the child.
import os from 'node:os'
import { defineNuxtModule } from 'nuxt/kit'
import { resolveIdentity } from '../contributors/identity.ts'
import { readContributors } from '../contributors/profiles.ts'
import { syncInFreshProcess } from '../studio/sync.ts'
import {
  clearDevServer,
  describeDevServer,
  FORCE_ENV,
  readDevServer,
  recordDevServer,
} from './registry.ts'

// The contributor, otherwise STUDIO_SESSION_LABEL, otherwise the OS account.
function startedBy(root: string) {
  try {
    // The browser scenarios give the studio profiles of their own.
    const folder = process.env.STUDIO_CONTRIBUTORS || undefined
    const { contributors } = readContributors(root, folder)
    const { key } = resolveIdentity(root, contributors, { github: '' })
    if (key) return key
  } catch {
    // An unreadable profile names nobody.
  }
  if (process.env.STUDIO_SESSION_LABEL) return process.env.STUDIO_SESSION_LABEL
  try {
    return `session ${os.userInfo().username}`
  } catch {
    return 'an unnamed session'
  }
}

export default defineNuxtModule({
  meta: { name: 'studio-dev-server' },
  setup(_options, nuxt) {
    if (!nuxt.options.dev) return
    const root = nuxt.options.rootDir
    if (!process.env.STUDIO_CONFIG && !process.env.STUDIO_MODULES)
      syncInFreshProcess(root)
    const owner =
      process.env.__NUXT__FORK === 'true' ? process.ppid : process.pid
    const current = readDevServer(root)
    if (
      current.state === 'running' &&
      current.record.pid !== owner &&
      process.env[FORCE_ENV] !== '1'
    ) {
      const { record } = current
      throw new Error(
        [
          `A dev server is already running for this studio: ${describeDevServer(record)}, since ${record.startedAt}.`,
          `Use it at ${record.url ?? `http://localhost:${record.port}/`}, or restart it with yarn studio dev restart.`,
          `To start a second server anyway, set ${FORCE_ENV}=1.`,
        ].join('\n'),
      )
    }
    nuxt.hook('listen', (_server, listener) => {
      // A forced second server leaves the first one's record alone.
      const now = readDevServer(root)
      if (now.state === 'running' && now.record.pid !== owner) return
      const url = new URL(listener.url)
      // A restart of the child keeps when and by whom the server started.
      const previous = now.state === 'running' ? now.record : null
      recordDevServer(root, {
        port: Number(url.port),
        pid: owner,
        url: listener.url,
        startedAt: previous?.startedAt ?? new Date().toISOString(),
        startedBy:
          previous?.startedBy ??
          process.env.STUDIO_DEV_STARTED_BY ??
          startedBy(root),
      })
    })
    // A server that ends normally clears its record; a killed one leaves a
    // stale record, which readers detect.
    if (owner === process.pid)
      process.once('exit', () => clearDevServer(root, owner))
  },
})
