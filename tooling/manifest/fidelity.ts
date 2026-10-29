// "Make lo-fi" and "Make hi-fi" in development: the dev server writes or
// removes the marker in the artifact's file, the way its file type says. It
// works in your own prototypes, or in any as an Admin. The manifest follows
// from the file changing, like any edit.
import { readFileSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { resolveIdentity } from '../contributors/identity.ts'
import { readContributors } from '../contributors/profiles.ts'
import {
  permissionRefusal,
  refusalMessage,
  teamOf,
} from '../contributors/roles.ts'
import { sameOrigin } from '../modules/nuxt-module.ts'
import { readConfig } from '../modules/registry.ts'
import type { BuiltManifest, FileTypeReader } from './build.ts'

export const FIDELITY_ROUTE = '_studio/fidelity'
const MAX_BODY = 4096

export interface FidelityOptions {
  root: string
  contributorsFolder: string
  configFile: string
  read: () => BuiltManifest
  readers: FileTypeReader[]
}

type Reply = { status: number; body: Record<string, unknown> }
const refuse = (status: number, error: string): Reply => ({
  status,
  body: { error },
})

/** Switches one artifact to lo-fi or back, for the person running the studio. */
export function setFidelity(
  options: FidelityOptions,
  request: { artifact?: unknown; lofi?: unknown },
): Reply {
  const { artifact: id, lofi } = request
  if (typeof id !== 'string' || typeof lofi !== 'boolean')
    return refuse(400, 'Name an artifact and whether it is lo-fi.')
  const { manifest, artifacts } = options.read()
  const prototype = manifest.prototypes.find(({ id: key }) =>
    artifacts[key]?.some((artifact) => artifact.id === id),
  )
  const artifact =
    prototype && artifacts[prototype.id]!.find((a) => a.id === id)
  if (!prototype || !artifact)
    return refuse(404, 'That artifact is not in the studio any more.')
  const fidelity = options.readers.find(
    ({ id: type }) => type === artifact.type,
  )?.fidelity
  if (!fidelity) return refuse(400, 'This kind of file has no lo-fi version.')

  const { contributors } = readContributors(
    options.root,
    options.contributorsFolder,
  )
  const identity = resolveIdentity(options.root, contributors)
  const team = teamOf(readConfig(options.configFile), contributors)
  const refusal = permissionRefusal(
    team,
    contributors,
    identity.key,
    { kind: 'prototype', owner: prototype.contributor },
    'edit',
  )
  if (refusal)
    return refuse(
      403,
      refusalMessage(refusal, { email: identity.email || undefined }),
    )

  const file = path.resolve(options.root, artifact.file)
  const source = readFileSync(file, 'utf8')
  const next = fidelity.setLofi(source, lofi)
  if (next !== source) writeFileSync(file, next)
  return { status: 200, body: { lofi } }
}

/** The development route: `POST <base>_studio/fidelity`, same origin only. */
export function fidelityRoute(options: FidelityOptions) {
  return (req: IncomingMessage, res: ServerResponse) => {
    const reply = (status: number, body: Record<string, unknown>) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(body))
    }
    if (req.method !== 'POST' || !sameOrigin(req.headers))
      return reply(403, { error: 'Not allowed.' })
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => {
      body += chunk
      if (body.length > MAX_BODY) req.destroy()
    })
    req.on('end', () => {
      let request: Record<string, unknown>
      try {
        request = JSON.parse(body)
      } catch {
        return reply(400, { error: 'The request is not valid JSON.' })
      }
      try {
        const { status, body: answer } = setFidelity(options, request ?? {})
        reply(status, answer)
      } catch (error) {
        reply(500, { error: (error as Error).message })
      }
    })
  }
}
