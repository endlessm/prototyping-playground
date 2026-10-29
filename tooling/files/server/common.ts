// What the file service's routes share: the same-origin rule and the
// installed file types' identity adapters, loaded once.
import { pathToFileURL } from 'node:url'
import { getRequestHeader, type H3Event } from 'h3'
import type { IdentityAdapter } from '../../modules/contract.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'

let fileTypes: Promise<
  { id: string; extensions: string[]; identity: IdentityAdapter }[]
>

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
      ...type,
      identity: (
        (await import(pathToFileURL(type.identity).href)) as {
          identity: IdentityAdapter
        }
      ).identity,
    })),
  )
  return fileTypes
}
