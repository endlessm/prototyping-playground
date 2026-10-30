// What the file service's routes share: the same-origin rule, and the
// installed file types' identity adapters and the modules' reference
// adapters, loaded once.
import { pathToFileURL } from 'node:url'
import { getRequestHeader, type H3Event } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import type { FileServiceConfig } from '../nuxt-module.ts'
import type { ReferenceAdapter } from '../references.ts'
import { defaultIdentify, type FileServiceOptions } from '../source.ts'
import { RELEASE_ROUTE } from '../watchers.ts'

let fileTypes: Promise<FileServiceOptions['fileTypes']>
let references: Promise<ReferenceAdapter[]>

async function exported<T>(file: string | undefined, name: string) {
  if (!file) return undefined
  return ((await import(pathToFileURL(file).href)) as Record<string, T>)[name]
}

/** Only the studio's own pages may call the service. */
export function sameOrigin(event: H3Event) {
  const site = getRequestHeader(event, 'sec-fetch-site')
  if (site) return site === 'same-origin'
  // Over plain http on a network address browsers leave it out.
  const origin = getRequestHeader(event, 'origin')
  return !origin || origin === `http://${getRequestHeader(event, 'host')}`
}

/**
 * Asks the dev server's main process to have its file watchers let go of a
 * folder before it is renamed or trashed (`../watchers.ts`); resolves to how
 * to have them watch it again.
 */
export function releaser(event: H3Event, config: FileServiceConfig) {
  const base = useRuntimeConfig(event).app.baseURL
  const url = `http://${getRequestHeader(event, 'host')}${base}${RELEASE_ROUTE}`
  const call = (folder: string, restore: boolean) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: config.releaseToken, folder, restore }),
    }).catch(() => undefined)
  return async (folder: string) => {
    await call(folder, false)
    return async () => {
      await call(folder, true)
    }
  }
}

export function loadFileTypes(config: FileServiceConfig) {
  fileTypes ??= Promise.all(
    config.fileTypes.map(async (type) => ({
      id: type.id,
      extensions: type.extensions,
      identity: (await exported<
        FileServiceOptions['fileTypes'][number]['identity']
      >(type.identity, 'identity'))!,
      fidelity: await exported(type.fidelity, 'fidelity'),
      template: await exported(type.template, 'template'),
    })),
  )
  return fileTypes
}

export function loadReferences(config: FileServiceConfig) {
  references ??= Promise.all(
    config.references.map(
      async (file) =>
        (await exported<ReferenceAdapter[]>(file, 'references')) ?? [],
    ),
  ).then((lists) => lists.flat())
  return references
}

// Finding out who you are runs Git and perhaps the GitHub CLI, which hold
// up the dev server, and every open tree asks. As with the studio's own
// "who are you", the answer is kept until the profiles change.
type Identify = ReturnType<typeof defaultIdentify>
let known: { profiles: string; identity: ReturnType<Identify> } | undefined
export const remembered =
  (root: string): Identify =>
  (contributors) => {
    const profiles = JSON.stringify(contributors)
    if (known?.profiles !== profiles)
      known = { profiles, identity: defaultIdentify(root)(contributors) }
    return known.identity
  }
