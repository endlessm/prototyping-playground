// The file service's prototypes route, a Nitro route that exists only while
// the dev server runs (`../nuxt-module.ts`):
//
//   POST <base>_studio/files/prototypes   { op, … }
//       create     { title, system }       a prototype in your own space
//                                          (`system`: a system's ID, or null
//                                          for none) → 201 { id, folder }
//       rename     { prototype, title }    the folder follows the title; the
//                                          link stays → { id, folder, relinked }
//       duplicate  { prototype, title, system? }
//                                          a copy with fresh IDs; another
//                                          system makes a rebuild copy
//                                          → 201 { id, folder, rebuild }
//       archive    { prototype }           → { status }
//       restore    { prototype }           → { status }
//       delete     { prototype }           to the computer's trash
//                                          → { trashedTo, title }
//
// Without `op`, it creates. Answers 400 with the reason for an invalid
// title or system, 403 if you may not (not a registered contributor, not
// its owner or an Admin, archived), 409 for a name that is taken or a
// restore its system doesn't allow. Only the studio's own pages may call it.
import { createError, defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { createOrganizer } from '../organize.ts'
import { createPrototype } from '../prototypes.ts'
import { FileServiceError } from '../source.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'
import {
  loadFileTypes,
  loadReferences,
  releaser,
  remembered,
  sameOrigin,
} from './common.ts'
import { settleMoves } from './moves.ts'

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event))
    throw createError({ status: 403, message: 'Only the studio can use this.' })
  const config = useRuntimeConfig(event).studioFiles as FileServiceConfig
  event.node.res.setHeader('Cache-Control', 'no-store')
  try {
    if (event.method !== 'POST')
      throw new FileServiceError(405, 'method', 'Use POST.')
    const body = (await readBody(event)) ?? {}
    const fileTypes = await loadFileTypes(config)
    const op = body.op ?? 'create'
    if (op === 'create') {
      const created = createPrototype(
        { ...config, fileTypes },
        { title: body.title, system: body.system ?? null },
      )
      event.node.res.statusCode = 201
      return created
    }
    const organizer = createOrganizer({
      ...config,
      fileTypes,
      references: await loadReferences(config),
      identify: remembered(config.root),
      release: releaser(event, config),
    })
    const request = { prototype: body.prototype }
    try {
      switch (op) {
        case 'rename':
          return await organizer.rename({ ...request, title: body.title })
        case 'duplicate': {
          const copy = await organizer.duplicate({
            ...request,
            title: body.title,
            ...('system' in body ? { system: body.system } : {}),
          })
          event.node.res.statusCode = 201
          return copy
        }
        case 'archive':
          return await organizer.archive(request)
        case 'restore':
          return await organizer.restore(request)
        case 'delete':
          return await organizer.remove(request)
        default:
          throw new FileServiceError(400, 'invalid', 'Unknown operation.')
      }
    } finally {
      // The studio's own renames are already repaired; the watcher of
      // outside moves takes things as they are now.
      settleMoves()
    }
  } catch (error) {
    if (!(error instanceof FileServiceError)) throw error
    event.node.res.statusCode = error.status
    return { error: error.message, code: error.code }
  }
})
