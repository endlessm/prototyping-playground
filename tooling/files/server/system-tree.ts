// The file service's system tree route, a Nitro route that exists only
// while the dev server runs (`../nuxt-module.ts`):
//
//   GET  <base>_studio/files/system-tree?system=<id>[&access=0]
//       the system's Context and Skills files and folders, its folder, and
//       whether you may change them (and why not); with access=0, without
//       the last two
//   POST <base>_studio/files/system-tree   { op, system, section, … }
//       create  { parent, name, kind }   a Context document ("document",
//                                         `.md` added), a file inside a
//                                         skill ("file") or a folder
//                                         → { path }
//       skill   { name, description }    a new skill's folder and SKILL.md
//                                         (no section) → { path }
//       rename  { path, name }           → { path }
//       move    { path, to }             into the folder `to` of the same
//                                         section → { path, moved }
//       delete  { path }                 to the computer's trash
//                                         → { trashedTo }
//
// Changes answer 403 with the reason if you may not change the system, 400
// with what to do instead for what the section doesn't allow, 409 for a
// name that is taken. Only the studio's own pages may call it.
import { createError, defineEventHandler, getQuery, readBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { FileServiceError } from '../source.ts'
import { createSystemTree } from '../system-tree.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'
import { releaser, remembered, sameOrigin } from './common.ts'

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event))
    throw createError({ status: 403, message: 'Only the studio can use this.' })
  const config = useRuntimeConfig(event).studioFiles as FileServiceConfig
  const tree = createSystemTree({
    ...config,
    identify: remembered(config.root),
    release: releaser(event, config),
  })
  event.node.res.setHeader('Cache-Control', 'no-store')
  try {
    if (event.method === 'GET')
      return await tree.list({
        system: getQuery(event).system,
        access: getQuery(event).access !== '0',
      })
    if (event.method !== 'POST')
      throw new FileServiceError(405, 'method', 'Use GET or POST.')
    const body = (await readBody(event)) ?? {}
    switch (body.op) {
      case 'create':
        return await tree.create(body)
      case 'skill':
        return await tree.skill(body)
      case 'rename':
        return await tree.rename(body)
      case 'move':
        return await tree.move(body)
      case 'delete':
        return await tree.remove(body)
      default:
        throw new FileServiceError(400, 'invalid', 'Unknown file operation.')
    }
  } catch (error) {
    if (!(error instanceof FileServiceError)) throw error
    event.node.res.statusCode = error.status
    return { error: error.message, code: error.code }
  }
})
