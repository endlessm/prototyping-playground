// The file service's tree route, a Nitro route that exists only while the
// dev server runs (`../nuxt-module.ts`):
//
//   GET  <base>_studio/files/tree?prototype=<id>[&access=0]
//       the prototype's files and folders, its folder, and whether you may
//       change them (and why not); with access=0, without the last two
//   POST <base>_studio/files/tree   { op, prototype, … }
//       create   { parent, name, type }  a folder (type "folder") or a file
//                                        of that type → { path, artifact }
//       rename   { path, name }          → { path, relinked }
//       move     { path, to }            into the folder `to` ('' for the top
//                                        level) → { path, moved, relinked }
//       reorder  { path, before, to? }   before a sibling, or last for '',
//                                        after moving into `to` if given; the
//                                        order is saved in meta.json
//                                        → { path, moved, relinked }
//       delete   { path }                to the computer's trash → { trashedTo }
//       lofi     { artifact, lofi }      → { lofi }
//       reveal   { path }                in the computer's file browser
//       open     { path }                in a code editor → { opened, message }
//
// Renames and moves repair the references to and in what moved, and say
// how many files changed (`relinked`); if they can't, nothing moves (409
// `references`). Changes answer 403 with the reason if you may not change the prototype,
// 409 for a name that is taken, 400 for one that isn't allowed. Only the
// studio's own pages may call it.
import { appendFileSync } from 'node:fs'
import { createError, defineEventHandler, getQuery, readBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { FileServiceError } from '../source.ts'
import { createFileTree } from '../tree.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'
import {
  loadFileTypes,
  loadReferences,
  remembered,
  sameOrigin,
} from './common.ts'
import { settleMoves } from './moves.ts'

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event))
    throw createError({ status: 403, message: 'Only the studio can use this.' })
  const config = useRuntimeConfig(event).studioFiles as FileServiceConfig
  const { launchLog } = config
  const tree = createFileTree({
    ...config,
    fileTypes: await loadFileTypes(config),
    references: await loadReferences(config),
    identify: remembered(config.root),
    // Noted instead of started, and as if no code editor is installed, so
    // the scenarios go the same on every computer.
    ...(launchLog && {
      launch: async (command: string, args: string[]) => {
        appendFileSync(launchLog, `${JSON.stringify({ command, args })}\n`)
      },
      editors: [],
    }),
  })
  event.node.res.setHeader('Cache-Control', 'no-store')
  try {
    if (event.method === 'GET')
      return await tree.list({
        prototype: getQuery(event).prototype,
        access: getQuery(event).access !== '0',
      })
    if (event.method !== 'POST')
      throw new FileServiceError(405, 'method', 'Use GET or POST.')
    const body = (await readBody(event)) ?? {}
    // The studio's own moves repair their references as they happen; then
    // the watcher of outside moves takes things as they are, so it doesn't
    // repair them again, even when a reorder fails after its move.
    if (['rename', 'move', 'reorder'].includes(body.op))
      try {
        return await (body.op === 'rename'
          ? tree.rename(body)
          : body.op === 'move'
            ? tree.move(body)
            : tree.reorder(body))
      } finally {
        settleMoves()
      }
    switch (body.op) {
      case 'create':
        return await tree.create(body)
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
