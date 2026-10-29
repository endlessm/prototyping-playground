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
import { createError, defineEventHandler, getQuery, readBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { createFileService, FileServiceError } from '../source.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'
import { loadFileTypes, sameOrigin } from './common.ts'

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event))
    throw createError({ status: 403, message: 'Only the studio can use this.' })
  const config = useRuntimeConfig(event).studioFiles as FileServiceConfig
  const files = createFileService({
    ...config,
    fileTypes: await loadFileTypes(config),
  })
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
