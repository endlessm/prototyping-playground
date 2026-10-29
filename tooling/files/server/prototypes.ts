// The file service's prototypes route, a Nitro route that exists only while
// the dev server runs (`../nuxt-module.ts`):
//
//   POST <base>_studio/files/prototypes   { title, system }
//       creates a prototype in your own space (`system`: a system's ID, or
//       null for none) and answers with its permanent ID and folder; 400
//       with the reason for an invalid title or system, 403 if you aren't a
//       registered contributor, 409 if you already have one of that name
//
// Only the studio's own pages may call it.
import { createError, defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { createPrototype } from '../prototypes.ts'
import { FileServiceError } from '../source.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'
import { loadFileTypes, sameOrigin } from './common.ts'

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event))
    throw createError({ status: 403, message: 'Only the studio can use this.' })
  const config = useRuntimeConfig(event).studioFiles as FileServiceConfig
  event.node.res.setHeader('Cache-Control', 'no-store')
  try {
    if (event.method !== 'POST')
      throw new FileServiceError(405, 'method', 'Use POST.')
    const body = (await readBody(event)) ?? {}
    const created = createPrototype(
      { ...config, fileTypes: await loadFileTypes(config) },
      { title: body.title, system: body.system ?? null },
    )
    event.node.res.statusCode = 201
    return created
  } catch (error) {
    if (!(error instanceof FileServiceError)) throw error
    event.node.res.statusCode = error.status
    return { error: error.message, code: error.code }
  }
})
