// The file service's systems route, a Nitro route that exists only while
// the dev server runs (`../nuxt-module.ts`):
//
//   POST <base>_studio/files/systems   { op, … }
//       open | reveal   { system }          the folder in a code editor or the
//                                           file browser
//       create          { name }            an empty Vue system → 201
//                                           { key, studioId }
//       default         { system }          the system new prototypes start with
//       rename          { system, name }    → { key, studioId, references, … }
//       archive | delete { system }
//       restore         { system, restorePrototypes }
//       <op>-check      { system, … }       what it would touch → { prototypes,
//                                           references }; 409 when another
//                                           program holds the folder
//
// `system` is a folder key or permanent ID. Answers 400 with the reason, 403
// if you may not, 404 for an unknown system, 409 for a name that is taken,
// a held folder or another system change in progress. Applied changes make
// the dev server restart once the change is done. Only the studio's own
// pages may call it.
import { appendFileSync } from 'node:fs'
import { createError, defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { yarn } from '../../studio/package-manager.ts'
import { LifecycleError } from '../../systems/lifecycle.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'
import { createSystemActions } from '../systems.ts'
import { releaser, remembered, sameOrigin } from './common.ts'

export default defineEventHandler(async (event) => {
  if (!sameOrigin(event))
    throw createError({ status: 403, message: 'Only the studio can use this.' })
  const config = useRuntimeConfig(event).studioFiles as FileServiceConfig
  const { launchLog } = config
  event.node.res.setHeader('Cache-Control', 'no-store')
  const actions = createSystemActions({
    ...config,
    identify: remembered(config.root),
    yarn: (args) => yarn(config.root, args),
    release: releaser(event, config),
    // Noted instead of started, as the file tree's route does.
    ...(launchLog && {
      launch: async (command: string, args: string[]) => {
        appendFileSync(launchLog, `${JSON.stringify({ command, args })}\n`)
      },
      editors: [],
    }),
  })
  try {
    if (event.method !== 'POST') throw new LifecycleError('Use POST.', 405)
    const body = ((await readBody(event)) ?? {}) as Record<string, unknown>
    const result = await actions.run(body.op, body)
    if (body.op === 'create') event.node.res.statusCode = 201
    return result
  } catch (error) {
    if (!(error instanceof LifecycleError)) {
      event.node.res.statusCode = 500
      return { error: (error as Error).message }
    }
    event.node.res.statusCode = error.status
    return { error: error.message }
  }
})
