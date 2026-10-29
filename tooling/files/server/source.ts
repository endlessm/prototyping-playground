// The file service's source route, a Nitro route that exists only while the
// dev server runs (`../nuxt-module.ts`):
//
//   GET <base>_studio/files/source?prototype=<id>&artifact=<id>
//       the artifact's text, its version, and whether you may save it (and
//       why not)
//   PUT <base>_studio/files/source   { prototype, artifact, content, base }
//       saves it over version `base`; 409 `changed` if the file changed on
//       disk since, 403 with the reason if you may not change the prototype
//
// Only the studio's own pages may call it.
import { pathToFileURL } from 'node:url'
import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestHeader,
  readBody,
  type H3Event,
} from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import type { IdentityAdapter } from '../../modules/contract.ts'
import { createFileService, FileServiceError } from '../source.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'

let fileTypes: Promise<
  { id: string; extensions: string[]; identity: IdentityAdapter }[]
>

function sameOrigin(event: H3Event) {
  const site = getRequestHeader(event, 'sec-fetch-site')
  if (site) return site === 'same-origin'
  // Over plain http on a network address browsers leave it out.
  const origin = getRequestHeader(event, 'origin')
  return !origin || origin === `http://${getRequestHeader(event, 'host')}`
}

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event))
    throw createError({ status: 403, message: 'Only the studio can use this.' })
  const config = useRuntimeConfig(event).studioFiles as FileServiceConfig
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
  const files = createFileService({ ...config, fileTypes: await fileTypes })
  event.node.res.setHeader('Cache-Control', 'no-store')
  try {
    if (event.method === 'GET') {
      const { prototype, artifact } = getQuery(event)
      return await files.read({
        prototype: String(prototype ?? ''),
        artifact: String(artifact ?? ''),
      })
    }
    if (event.method === 'PUT') {
      const body = (await readBody(event)) ?? {}
      return await files.save({
        prototype: String(body.prototype ?? ''),
        artifact: String(body.artifact ?? ''),
        content: body.content,
        base: body.base,
      })
    }
    throw new FileServiceError(405, 'method', 'Use GET or PUT.')
  } catch (error) {
    if (!(error instanceof FileServiceError)) throw error
    event.node.res.statusCode = error.status
    return { error: error.message, code: error.code }
  }
})
