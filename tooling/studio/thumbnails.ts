// `yarn studio thumbnails [<prototype folder>…] [--missing] [--stale]`:
// previews which prototypes would get a new picture of their first view,
// and why, then takes them with --yes. Without folders it covers every
// prototype you may change. It uses the running dev server's preview
// documents, or starts its own for the run.
import path from 'node:path'
import { identityHint } from '../contributors/identity.ts'
import { refusalMessage } from '../contributors/roles.ts'
import { basePathFromEnv } from '../deployment.ts'
import { readDevServer } from '../dev-server/registry.ts'
import { identityFileTypes } from '../identity/file-types.ts'
import { buildManifest, type ManifestPrototype } from '../manifest/build.ts'
import { loadSystems, systemsFolder } from '../systems/registry.ts'
import {
  ChromiumMissing,
  createThumbnailCapturer,
  type ThumbnailResult,
} from '../thumbnails/capture.ts'
import { systemVersion, thumbnailStatus } from '../thumbnails/fingerprint.ts'
import { startPreviewServer } from '../thumbnails/preview-server.ts'
import { THUMBNAIL_IMAGE } from '../thumbnails/record.ts'
import { firstView, thumbnailRefusal } from '../thumbnails/targets.ts'
import { studioModules } from './contributors.ts'
import { NOTHING_CHANGED, Refusal, say, type Flags } from './output.ts'
import { session } from './permissions.ts'
import { realFolder } from './status.ts'

const USAGE =
  'Usage: yarn studio thumbnails [src/prototypes/<contributor>/<prototype>…] [--missing] [--stale] [--yes] [--json] [--as <key>]'

interface Planned {
  folder: string
  id: string
  title: string
  /** Why: it has no picture, its picture is out of date, or it is current. */
  state: 'missing' | 'stale' | 'current'
  /** The first view's path inside the prototype, or null for none. */
  view: string | null
  target: {
    dir: string
    systemId: string | null
    systemVersion: string
    artifactId: string
  } | null
}

const kilobytes = (bytes: number) =>
  `${Math.max(1, Math.round(bytes / 1024))} KB`

export async function thumbnails(root: string, args: string[], flags: Flags) {
  const { contributors, key, identity, team } = session(root, flags)
  const refuse = (
    refusal:
      Parameters<typeof refusalMessage>[0] | 'archived' | 'system-missing',
    folder: string,
  ) => {
    if (refusal === 'archived')
      return new Refusal(
        `${folder} is archived, so it is read-only. Restore it first; nothing was changed.`,
      )
    if (refusal === 'system-missing')
      return new Refusal(
        `${folder} can't render: its system was deleted. Rebuild it with another system first; nothing was changed.`,
      )
    return new Refusal(
      refusalMessage(refusal, {
        email: identity.email,
        hint: identity.email ? identityHint(identity) : undefined,
      }),
    )
  }

  const registry = await studioModules(root)
  const { systems } = await loadSystems(root, registry.config, systemsFolder())
  const built = buildManifest({
    root,
    systems,
    fileTypes: await identityFileTypes(registry.enabled),
  })
  const byFolder = new Map(
    built.manifest.prototypes.map((prototype) => [prototype.folder, prototype]),
  )

  let chosen: ManifestPrototype[]
  if (args.length) {
    chosen = []
    for (const arg of args) {
      const folder = path
        .relative(root, path.resolve(root, arg.replace(/[\\/]+$/, '')))
        .split(path.sep)
        .join('/')
      const match = /^src\/prototypes\/([a-z0-9][a-z0-9-]*)\/([^/]+)$/.exec(
        folder,
      )
      const prototype =
        match && realFolder(root, folder) && byFolder.get(folder)
      if (!prototype)
        throw new Refusal(
          `Give an existing src/prototypes/<contributor>/<prototype> folder whose meta.json is valid, without symbolic links: ${arg} isn't one. ${USAGE}`,
        )
      const refusal = thumbnailRefusal(team, contributors, key, prototype)
      if (refusal) throw refuse(refusal, folder)
      if (!chosen.includes(prototype)) chosen.push(prototype)
    }
  } else {
    const anyone = thumbnailRefusal(team, contributors, key, {
      contributor: key ?? '',
      status: 'active',
    })
    if (anyone) throw refuse(anyone, 'Your prototypes')
    chosen = built.manifest.prototypes.filter(
      (prototype) => !thumbnailRefusal(team, contributors, key, prototype),
    )
  }

  const plans: Planned[] = chosen.map((prototype) => {
    const dir = path.resolve(root, prototype.folder)
    const version = systemVersion(
      systems.find(({ id }) => id === prototype.systemId),
    )
    const view = firstView(built.artifacts[prototype.id] ?? [])
    return {
      folder: prototype.folder,
      id: prototype.id,
      title: prototype.title,
      state: thumbnailStatus(dir, prototype.systemId, version).state,
      view: view?.path ?? null,
      target: view && {
        dir,
        systemId: prototype.systemId,
        systemVersion: version,
        artifactId: view.id,
      },
    }
  })
  const filtered = Boolean(flags.missing || flags.stale)
  const wanted = (plan: Planned) =>
    !filtered ||
    (plan.target !== null &&
      ((flags.missing && plan.state === 'missing') ||
        (flags.stale && plan.state === 'stale')))
  const capture = plans.filter((plan) => plan.target && wanted(plan))
  const noView = plans.filter((plan) => !plan.target && wanted(plan))
  const listed = (plan: Planned) => ({
    folder: plan.folder,
    prototypeId: plan.id,
    title: plan.title,
    state: plan.state,
    view: plan.view,
  })

  if (!flags.yes) {
    if (flags.json) {
      say(
        JSON.stringify(
          { capture: capture.map(listed), noView: noView.map(listed) },
          null,
          2,
        ),
      )
      return
    }
    const count = (n: number) => `${n} ${n === 1 ? 'prototype' : 'prototypes'}`
    say(
      capture.length
        ? `${count(capture.length)} would get a picture of ${capture.length === 1 ? 'its' : 'their'} first view:`
        : 'No prototype needs a picture.',
    )
    for (const plan of capture)
      say(
        `  ${plan.folder} (${plan.state === 'current' ? 'up to date, taken again' : plan.state}): ${plan.view}`,
      )
    if (noView.length) {
      say(
        `${count(noView.length)} ${noView.length === 1 ? 'has' : 'have'} no view, so ${noView.length === 1 ? 'its card shows' : 'their cards show'} the placeholder:`,
      )
      for (const plan of noView) say(`  ${plan.folder}`)
    }
    say(NOTHING_CHANGED)
    return
  }

  const written: {
    folder: string
    image: string
    bytes: number
    capturedAt: string
  }[] = []
  const failed: { folder: string; reason: string; detail: string }[] = []
  if (capture.length) {
    const dev = readDevServer(root)
    const own = dev.state === 'running' ? null : await startPreviewServer(root)
    const studioUrl =
      dev.state === 'running'
        ? new URL(
            basePathFromEnv(process.env),
            dev.record.url ?? `http://localhost:${dev.record.port}/`,
          ).href
        : own!.url
    const capturer = createThumbnailCapturer()
    try {
      for (const plan of capture) {
        let result: ThumbnailResult
        try {
          result = await capturer.capture(studioUrl, plan.target!)
        } catch (error) {
          if (error instanceof ChromiumMissing) throw new Refusal(error.message)
          result = {
            ok: false,
            reason: 'error',
            detail: (error as Error).message,
          }
        }
        if (result.ok)
          written.push({
            folder: plan.folder,
            image: `${plan.folder}/${THUMBNAIL_IMAGE}`,
            bytes: result.bytes,
            capturedAt: result.record.capturedAt,
          })
        else
          failed.push({
            folder: plan.folder,
            reason: result.reason,
            detail: result.detail,
          })
      }
    } finally {
      await capturer.close()
      await own?.close()
    }
  }
  if (failed.length) process.exitCode = 1
  if (flags.json) {
    say(
      JSON.stringify({ written, failed, noView: noView.map(listed) }, null, 2),
    )
    return
  }
  if (!capture.length) say('No prototype needs a picture.')
  for (const { image, bytes } of written)
    say(`Wrote ${image} (${kilobytes(bytes)}) and its .thumbnail.json.`)
  for (const { folder, detail } of failed)
    say(
      `No picture of ${folder}: ${detail} Its previous picture, if any, stays.`,
    )
  if (written.length) say('A running studio shows them by itself.')
}
