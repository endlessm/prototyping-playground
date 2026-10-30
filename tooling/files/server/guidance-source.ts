// The file service's guidance route, a Nitro route that exists only while
// the dev server runs (`../nuxt-module.ts`):
//
//   GET  <base>_studio/files/guidance-source?path=<repository path>
//        the file's text, its version, and whether you may save it (and
//        why not)
//   PUT  <base>_studio/files/guidance-source   { path, content, base }
//        saves it over version `base` (an Admin only)
//   POST <base>_studio/files/guidance-source   { op: 'reveal' | 'open', path }
//        shows it in the file browser, or opens it in a code editor
//
// Only the studio's own pages may call it.
import { appendFileSync } from 'node:fs'
import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestHeader,
  readBody,
  type H3Event,
} from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { createGuidanceSourceService } from '../guidance-source.ts'
import { FileServiceError } from '../source.ts'
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
  const { launchLog } = config
  const files = createGuidanceSourceService({
    root: config.root,
    platformFolder: config.platformFolder,
    modulesFolder: config.modulesFolder,
    contributorsFolder: config.contributorsFolder,
    configFile: config.configFile,
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
      return await files.read({ path: String(getQuery(event).path ?? '') })
    const body = (await readBody(event)) ?? {}
    if (event.method === 'PUT')
      return await files.save({
        path: body.path,
        content: body.content,
        base: body.base,
      })
    if (event.method === 'POST' && body.op === 'reveal')
      return await files.reveal({ path: body.path })
    if (event.method === 'POST' && body.op === 'open')
      return await files.open({ path: body.path })
    throw new FileServiceError(405, 'method', 'Use GET, PUT or POST.')
  } catch (error) {
    if (!(error instanceof FileServiceError)) throw error
    event.node.res.statusCode = error.status
    return { error: error.message, code: error.code }
  }
})
