// The file service's system source route, a Nitro route that exists only
// while the dev server runs (`../nuxt-module.ts`):
//
//   GET <base>_studio/files/system-source?system=<id>&path=<inside its folder>
//       the file's text, its version, and whether you may save it (and why
//       not)
//   POST <base>_studio/files/system-source  { system, component }
//       creates the examples file and page the component is missing, from
//       templates; the files created
//   PUT <base>_studio/files/system-source   { system, path, content, base }
//       saves it over version `base`; 409 `changed` if the file changed on
//       disk since, 403 with the reason if you may not change the system
//
// Only the studio's own pages may call it.
import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestHeader,
  readBody,
  type H3Event,
} from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { FileServiceError } from '../source.ts'
import { createSystemSourceService } from '../system-source.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'

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
  const files = createSystemSourceService(config)
  event.node.res.setHeader('Cache-Control', 'no-store')
  try {
    if (event.method === 'GET') {
      const { system, path } = getQuery(event)
      return await files.read({
        system: String(system ?? ''),
        path: String(path ?? ''),
      })
    }
    if (event.method === 'POST') {
      const body = (await readBody(event)) ?? {}
      return await files.create({
        system: String(body.system ?? ''),
        component: String(body.component ?? ''),
      })
    }
    if (event.method === 'PUT') {
      const body = (await readBody(event)) ?? {}
      return await files.save({
        system: String(body.system ?? ''),
        path: String(body.path ?? ''),
        content: body.content,
        base: body.base,
      })
    }
    throw new FileServiceError(405, 'method', 'Use GET, POST or PUT.')
  } catch (error) {
    if (!(error instanceof FileServiceError)) throw error
    event.node.res.statusCode = error.status
    return { error: error.message, code: error.code }
  }
})
