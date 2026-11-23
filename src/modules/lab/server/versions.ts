// The Lab's versions on the local dev server, at
// `<base>_studio/modules/lab/versions`:
//
//   POST { action: "create", system, component }
//        copies the app component's original into your own "<Component>
//        versions" prototype (made with the component's system on your
//        first version) as a new view holding its permanent ID and its
//        `@lab-version` marker → { prototype, artifact, path }
//   POST { action: "read-draft", prototype, artifact }
//        the version's unsaved draft → { draft: string | null }
//   POST { action: "write-draft", prototype, artifact, content }
//        writes the draft, or removes it when it matches the file, for
//        whoever may change the prototype → { draft: boolean }
//   POST { action: "discard-draft", prototype, artifact }
//        removes the draft; anyone may → { draft: false }
//   POST { action: "props", prototype, artifact }
//        the props the version (or its draft) declares → { props } or
//        { error }
//
// Saving a version goes through the file service's source route, over the
// version read, with its permission messages. Refusals answer with the
// file service's status and message.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { ModuleServerHandler } from '../../../../tooling/modules/contract.ts'
import { readContributors } from '../../../../tooling/contributors/profiles.ts'
import { newStudioId } from '../../../../tooling/contributors/studio-ids.ts'
import {
  draftMap,
  draftsDir,
  versionDraftsDir,
} from '../../../../tooling/files/drafts-folder.ts'
import { createPrototype } from '../../../../tooling/files/prototypes.ts'
import {
  defaultIdentify,
  fileAccess,
  FileServiceError,
  MAX_SOURCE_BYTES,
} from '../../../../tooling/files/source.ts'
import { systemAccess } from '../../../../tooling/files/system-source.ts'
import { identityLock } from '../../../../tooling/identity/assign.ts'
import {
  auditIdentities,
  identitiesInUse,
} from '../../../../tooling/identity/audit.ts'
import { identityFileTypes } from '../../../../tooling/identity/file-types.ts'
import { PROTOTYPES_FOLDER } from '../../../../tooling/manifest/build.ts'
import { loadRegistry } from '../../../../tooling/modules/registry.ts'
import { appComponents } from '../../../../tooling/preview/lab-versions.ts'
import { appCopy, appOriginal } from '../../../../tooling/systems/app-copy.ts'
import {
  readVersionMarker,
  versionMarker,
} from '../../../../tooling/systems/app-versions.ts'
import { systemCatalog } from '../../../../tooling/systems/catalog.ts'
import { systemsFolder } from '../../../../tooling/systems/registry.ts'

const fail = (status: number, message: string) =>
  Object.assign(new Error(message), { status })

const VIEW = 'view'
/** A new version's file name: "Version 1.vue", "Version 2.vue"… */
const NAME = /^Version (\d+)\.vue$/

export default (async ({ root, contributorsFolder, method, body }) => {
  const request = (body ?? {}) as Record<string, unknown>
  if (method !== 'POST') throw fail(405, 'Use POST.')
  const prototypesFolder = process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER
  const contributors = path.relative(root, contributorsFolder)
  const configFile = process.env.STUDIO_CONFIG || undefined
  const registry = await loadRegistry(root, {
    modulesFolder: process.env.STUDIO_MODULES || undefined,
    configFile,
  })
  // Every file type, turned off or not, so no permanent ID is reused.
  const fileTypes = await identityFileTypes(registry.modules)
  const access = fileAccess({
    root,
    prototypesFolder,
    contributorsFolder: contributors,
    configFile,
    fileTypes,
  })

  try {
    if (request.action === 'create')
      return await create(request, {
        root,
        prototypesFolder,
        contributorsFolder: contributors,
        configFile,
        fileTypes,
        access,
      })

    // The other actions are about one version.
    const found = access.prototypeOf(String(request.prototype ?? ''))
    const { file } = access.artifactOf(
      found.dir,
      String(request.artifact ?? ''),
    )
    if (!readVersionMarker(readFileSync(file, 'utf8')))
      throw fail(400, 'This view isn’t a version of an app component.')
    const drafts = draftMap(
      access.prototypesDir,
      versionDraftsDir(draftsDir(root)),
    )
    const draft = drafts.draftOf(file)!

    if (request.action === 'read-draft')
      return { draft: existsSync(draft) ? readFileSync(draft, 'utf8') : null }

    if (request.action === 'discard-draft') {
      rmSync(draft, { force: true })
      return { draft: false }
    }

    if (request.action === 'write-draft') {
      const refusal = access.refusalFor(found.contributor, found.meta)
      if (refusal) throw fail(403, refusal.message)
      const { content } = request
      if (
        typeof content !== 'string' ||
        Buffer.byteLength(content) > MAX_SOURCE_BYTES
      )
        throw fail(
          413,
          'This file is too large to edit here. Keep files under 750 KB.',
        )
      if (content === readFileSync(file, 'utf8')) {
        rmSync(draft, { force: true })
        return { draft: false }
      }
      // Rewriting the same text would send the stage a needless update.
      if (existsSync(draft) && readFileSync(draft, 'utf8') === content)
        return { draft: true }
      mkdirSync(path.dirname(draft), { recursive: true })
      writeFileSync(draft, content)
      return { draft: true }
    }

    if (request.action === 'props') {
      const shown = existsSync(draft) ? draft : file
      const { componentProps } =
        await import('../../../../tooling/systems/props.ts')
      const result = (await componentProps([shown]))[shown]
      if (!result || 'error' in result)
        return { error: result?.error ?? 'The props couldn’t be read.' }
      return { props: result }
    }

    throw fail(400, 'Unknown request.')
  } catch (error) {
    if (error instanceof FileServiceError)
      throw fail(error.status, error.message)
    throw error
  }
}) satisfies ModuleServerHandler

interface CreateContext {
  root: string
  prototypesFolder: string
  contributorsFolder: string
  configFile?: string
  fileTypes: Awaited<ReturnType<typeof identityFileTypes>>
  access: ReturnType<typeof fileAccess>
}

/** The next free "Version N.vue" in a folder. */
function nextName(dir: string) {
  const taken = readdirSync(dir).flatMap((name) => {
    const match = NAME.exec(name)
    return match ? [Number(match[1])] : []
  })
  return `Version ${Math.max(0, ...taken) + 1}.vue`
}

async function create(
  request: Record<string, unknown>,
  context: CreateContext,
) {
  const { root, access, fileTypes } = context
  const { system } = await systemAccess({
    root,
    systemsFolder: systemsFolder(),
    configFile: context.configFile,
  }).systemOf(String(request.system ?? ''))
  if (!system || system.spec.status !== 'active')
    throw fail(404, 'This system isn’t installed or is archived.')
  const slug = String(request.component ?? '')
  const component = appComponents(system).get(slug)
  const copy = appCopy(system)
  if (!component || !copy)
    throw fail(404, 'Only an app component has versions.')
  const original = appOriginal(system, copy, component.app)
  const catalog = systemCatalog(system, root)
  const title =
    [...catalog.components, ...catalog.appComponents].find(
      (entry) => entry.slug === slug,
    )?.title ?? slug

  // Who is working: only registered contributors make versions.
  const { contributors } = readContributors(root, context.contributorsFolder)
  const me = defaultIdentify(root)(contributors)
  const profile = me.key ? contributors[me.key] : undefined
  if (!me.key || !profile)
    throw fail(
      403,
      'You’re not set up as a contributor yet. Ask your agent to add you.',
    )

  // Your own "<Component> versions" prototype for this system, or a new one.
  const name = `${title} versions`
  let home = [...access.prototypes()].find(
    ({ contributor, meta }) =>
      contributor === me.key &&
      meta.title === name &&
      meta.systemId === system.id &&
      meta.status !== 'archived',
  )
  let firstView: string | null = null
  if (!home) {
    const created = createPrototype(
      {
        root,
        prototypesFolder: context.prototypesFolder,
        contributorsFolder: context.contributorsFolder,
        configFile: context.configFile,
        fileTypes,
      },
      { title: name, system: system.id },
    )
    home = access.prototypeOf(created.id)
    firstView = created.artifact
  }
  const refusal = access.refusalFor(home.contributor, home.meta)
  if (refusal) throw fail(403, refusal.message)

  const view = fileTypes.find(({ id }) => id === VIEW)
  if (!view) throw fail(500, 'No installed module provides views.')
  const marker = versionMarker({
    system: system.id,
    component: slug,
    revision: original.revision,
  })
  const release = identityLock(root)
  try {
    // A new prototype's empty starting view becomes the first version.
    const starting = firstView ? path.join(home.dir, 'Prototype.vue') : null
    const artifact =
      firstView ??
      newStudioId(
        identitiesInUse(
          auditIdentities(root, fileTypes, {
            prototypesFolder: context.prototypesFolder,
            contributorsFolder: context.contributorsFolder,
          }),
        ),
      )
    const file = path.join(home.dir, nextName(home.dir))
    writeFileSync(
      file,
      view.identity.write(`${marker}\n${original.source}`, artifact),
      { flag: 'wx' },
    )
    if (starting && existsSync(starting)) rmSync(starting)
    const prototype = String(home.meta.studioId)
    return {
      prototype,
      artifact,
      path: path.basename(file, '.vue'),
      file: path.relative(root, file).split(path.sep).join('/'),
    }
  } finally {
    release()
  }
}
