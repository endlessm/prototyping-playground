// The file service's tree route, a Nitro route that exists only while the
// dev server runs (`../nuxt-module.ts`):
//
//   GET  <base>_studio/files/tree?prototype=<id>
//       the prototype's files and folders, its folder, and whether you may
//       change them (and why not)
//   POST <base>_studio/files/tree   { op, prototype, … }
//       create   { parent, name, type }  a folder (type "folder") or a file
//                                        of that type → { path, artifact }
//       rename   { path, name }          → { path }
//       delete   { path }                to the computer's trash → { trashedTo }
//       lofi     { artifact, lofi }      → { lofi }
//       reveal   { path }                in the computer's file browser
//       open     { path }                in a code editor → { opened, message }
//
// Changes answer 403 with the reason if you may not change the prototype,
// 409 for a name that is taken, 400 for one that isn't allowed. Only the
// studio's own pages may call it.
import { appendFileSync } from 'node:fs'
import { createError, defineEventHandler, getQuery, readBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { FileServiceError } from '../source.ts'
import { createFileTree } from '../tree.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'
import { loadFileTypes, sameOrigin } from './common.ts'

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event))
    throw createError({ status: 403, message: 'Only the studio can use this.' })
  const config = useRuntimeConfig(event).studioFiles as FileServiceConfig
  const { launchLog } = config
  const tree = createFileTree({
    ...config,
    fileTypes: await loadFileTypes(config),
    ...(launchLog && {
      launch: async (command: string, args: string[]) => {
        appendFileSync(launchLog, `${JSON.stringify({ command, args })}\n`)
      },
    }),
  })
  event.node.res.setHeader('Cache-Control', 'no-store')
  try {
    if (event.method === 'GET')
      return await tree.list({ prototype: getQuery(event).prototype })
    if (event.method !== 'POST')
      throw new FileServiceError(405, 'method', 'Use GET or POST.')
    const body = (await readBody(event)) ?? {}
    switch (body.op) {
      case 'create':
        return await tree.create(body)
      case 'rename':
        return await tree.rename(body)
      case 'delete':
        return await tree.remove(body)
      case 'lofi':
        return await tree.setLofi(body)
      case 'reveal':
        return await tree.reveal(body)
      case 'open':
        return await tree.open(body)
      default:
        throw new FileServiceError(400, 'invalid', 'Unknown file operation.')
    }
  } catch (error) {
    if (!(error instanceof FileServiceError)) throw error
    event.node.res.statusCode = error.status
    return { error: error.message, code: error.code }
  }
})
