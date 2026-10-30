// What the file service's routes share: the same-origin rule and the
// installed file types' identity adapters, loaded once.
import { pathToFileURL } from 'node:url'
import { getRequestHeader, type H3Event } from 'h3'
import type { FileServiceConfig } from '../nuxt-module.ts'
import type { FileServiceOptions } from '../source.ts'

let fileTypes: Promise<FileServiceOptions['fileTypes']>

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
