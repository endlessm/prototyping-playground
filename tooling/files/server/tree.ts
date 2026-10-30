// The file service's tree route, a Nitro route that exists only while the
// dev server runs (`../nuxt-module.ts`):
//
//   GET  <base>_studio/files/tree?prototype=<id>[&access=0]
//       the prototype's files and folders, its folder, and whether you may
//       change them (and why not); with access=0, without the last two
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
import { defaultIdentify, FileServiceError } from '../source.ts'
import { createFileTree } from '../tree.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'
import { loadFileTypes, sameOrigin } from './common.ts'

// Finding out who you are runs Git and perhaps the GitHub CLI, which hold
// up the dev server, and every open tree asks. As with the studio's own
// "who are you", the answer is kept until the profiles change.
type Identify = ReturnType<typeof defaultIdentify>
let known: { profiles: string; identity: ReturnType<Identify> } | undefined
const remembered =
  (root: string): Identify =>
  (contributors) => {
    const profiles = JSON.stringify(contributors)
    if (known?.profiles !== profiles)
      known = { profiles, identity: defaultIdentify(root)(contributors) }
    return known.identity
  }

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event))
    throw createError({ status: 403, message: 'Only the studio can use this.' })
  const config = useRuntimeConfig(event).studioFiles as FileServiceConfig
  const { launchLog } = config
  const tree = createFileTree({
    ...config,
    fileTypes: await loadFileTypes(config),
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
