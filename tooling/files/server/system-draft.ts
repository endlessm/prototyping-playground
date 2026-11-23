// The file service's system draft route, a Nitro route that exists only
// while the dev server runs (`../nuxt-module.ts`):
//
//   GET <base>_studio/files/system-draft?system=<id>&path=<inside its folder>
//       the draft's text, or null
//   GET <base>_studio/files/system-draft?system=<id>
//       the system's files that have a draft
//   PUT <base>_studio/files/system-draft     { system, path, content }
//       writes the draft (removed when it matches the file); 403 with the
//       reason if you may not change the system
//   DELETE <base>_studio/files/system-draft?system=<id>&path=<…>
//       discards it
//
// Only the studio's own pages may call it.
import { createError, defineEventHandler, getQuery, readBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { FileServiceError } from '../source.ts'
import { createSystemDraftService } from '../system-drafts.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'
import { sameOrigin } from './common.ts'

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event))
    throw createError({ status: 403, message: 'Only the studio can use this.' })
  const config = useRuntimeConfig(event).studioFiles as FileServiceConfig
  const drafts = createSystemDraftService(config)
  event.node.res.setHeader('Cache-Control', 'no-store')
  try {
    const query = getQuery(event)
    const address = {
      system: String(query.system ?? ''),
      path: String(query.path ?? ''),
    }
    if (event.method === 'GET')
      return query.path === undefined
        ? await drafts.list(address.system)
        : await drafts.read(address)
    if (event.method === 'DELETE') return await drafts.discard(address)
    if (event.method === 'PUT') {
      const body = (await readBody(event)) ?? {}
      return await drafts.write({
        system: String(body.system ?? ''),
        path: String(body.path ?? ''),
        content: body.content,
      })
    }
    throw new FileServiceError(405, 'method', 'Use GET, PUT or DELETE.')
  } catch (error) {
    if (!(error instanceof FileServiceError)) throw error
    event.node.res.statusCode = error.status
    return { error: error.message, code: error.code }
  }
})
