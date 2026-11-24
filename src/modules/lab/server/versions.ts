// The Lab's versions on the local dev server, at
// `<base>_studio/modules/lab/versions`:
//
//   POST { action: "create", system, component }
//        copies the app component's original into your own "<Component>
//        versions" prototype (made with the component's system on your
//        first version) as a new view holding its permanent ID and its
//        `@lab-version` marker → { prototype, artifact, path }
//   POST { action: "copy", prototype, artifact }
//        copies a version, yours or someone else's, into your own
//        "<Component> versions" prototype as a new version, keeping its
//        marker (Save as my version, Duplicate) → as for create
//   POST { action: "dates", versions: [{ prototype, artifact }] }
//        when each version's file last changed, as `YYYY-MM-DD` on this
//        computer → { dates: { [artifact]: string } }
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
  renameSync,
  rmSync,
  statSync,
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
import {
  createPrototype,
  STARTING_VIEW,
} from '../../../../tooling/files/prototypes.ts'
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
  withoutStudioMarkers,
  type VersionMarker,
} from '../../../../tooling/systems/app-versions.ts'
import { systemCatalog } from '../../../../tooling/systems/catalog.ts'
import { systemsFolder } from '../../../../tooling/systems/registry.ts'

const fail = (status: number, message: string) =>
  Object.assign(new Error(message), { status })

const VIEW = 'view'
/** A new version's file name: "Version 1.vue", "Version 2.vue"… */
const NAME = /^Version (\d+)\.vue$/
/** How many numbered titles New version tries for its prototype. */
const MAX_TITLES = 50

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

  const context = {
    root,
    prototypesFolder,
    contributorsFolder: contributors,
    configFile,
    fileTypes,
    access,
  }
  try {
    if (request.action === 'create') return await create(request, context)
    if (request.action === 'copy') return await copy(request, context)
    if (request.action === 'dates') return { dates: dates(request, access) }

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

/** An active system by its permanent ID, as the file service finds it. */
async function activeSystem(context: CreateContext, id: string) {
  const { system } = await systemAccess({
    root: context.root,
    systemsFolder: systemsFolder(),
    configFile: context.configFile,
  }).systemOf(id)
  if (!system || system.spec.status !== 'active')
    throw fail(404, 'This system isn’t installed or is archived.')
  return system
}

/** A component's title on its system's pages, or its slug. */
function titleOf(
  system: Awaited<ReturnType<typeof activeSystem>>,
  root: string,
  slug: string,
) {
  const catalog = systemCatalog(system, root)
  return (
    [...catalog.components, ...catalog.appComponents].find(
      (entry) => entry.slug === slug,
    )?.title ?? slug
  )
}

async function create(
  request: Record<string, unknown>,
  context: CreateContext,
) {
  const system = await activeSystem(context, String(request.system ?? ''))
  const slug = String(request.component ?? '')
  const component = appComponents(system).get(slug)
  const copy = appCopy(system)
  if (!component || !copy)
    throw fail(404, 'Only an app component has versions.')
  const original = appOriginal(system, copy, component.app)
  return addVersion(context, {
    marker: { system: system.id, component: slug, revision: original.revision },
    title: titleOf(system, context.root, slug),
    source: original.source,
  })
}

// A copy keeps the version's marker, so it is still compared against the
// app revision its first version was made from.
async function copy(request: Record<string, unknown>, context: CreateContext) {
  const { access } = context
  const found = access.prototypeOf(String(request.prototype ?? ''))
  const { file } = access.artifactOf(found.dir, String(request.artifact ?? ''))
  const source = readFileSync(file, 'utf8')
  const marker = readVersionMarker(source)
  if (!marker) throw fail(400, 'This view isn’t a version of an app component.')
  const system = await activeSystem(context, marker.system)
  return addVersion(context, {
    marker,
    title: titleOf(system, context.root, marker.component),
    source: withoutStudioMarkers(source),
  })
}

/** When each version's file last changed, on this computer's calendar. */
function dates(
  request: Record<string, unknown>,
  access: ReturnType<typeof fileAccess>,
) {
  const asked = Array.isArray(request.versions) ? request.versions : []
  const found: Record<string, string> = {}
  for (const entry of asked.slice(0, 500) as Record<string, unknown>[]) {
    try {
      const home = access.prototypeOf(String(entry.prototype ?? ''))
      const artifact = String(entry.artifact ?? '')
      const changed = statSync(access.artifactOf(home.dir, artifact).file).mtime
      const day = (value: number) => String(value).padStart(2, '0')
      found[artifact] =
        `${changed.getFullYear()}-${day(changed.getMonth() + 1)}-${day(changed.getDate())}`
    } catch {
      // Gone since the list was read: it simply has no date.
    }
  }
  return found
}

/**
 * Writes a new version (`source` under its two markers) into your own
 * "<Component> versions" prototype for the system, made on your first.
 */
async function addVersion(
  context: CreateContext,
  version: { marker: VersionMarker; title: string; source: string },
) {
  const { root, access, fileTypes } = context
  const system = version.marker.system

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
  // Its title is numbered ("… versions 2") when an archived prototype or one
  // of another system already has the name.
  const name = `${version.title} versions`
  const numberOf = (title: unknown) => {
    if (title === name) return 1
    const match =
      typeof title === 'string' && title.startsWith(`${name} `)
        ? /^(\d+)$/.exec(title.slice(name.length + 1))
        : null
    return match ? Number(match[1]) : null
  }
  let home = [...access.prototypes()]
    .filter(
      ({ contributor, meta }) =>
        contributor === me.key &&
        numberOf(meta.title) !== null &&
        meta.systemId === system &&
        meta.status !== 'archived',
    )
    .sort((a, b) => numberOf(a.meta.title)! - numberOf(b.meta.title)!)[0]
  let firstView: string | null = null
  for (let count = 1; !home; count++) {
    let created
    try {
      created = createPrototype(
        {
          root,
          prototypesFolder: context.prototypesFolder,
          contributorsFolder: context.contributorsFolder,
          configFile: context.configFile,
          fileTypes,
        },
        { title: count === 1 ? name : `${name} ${count}`, system },
      )
    } catch (error) {
      if (
        error instanceof FileServiceError &&
        error.code === 'exists' &&
        count < MAX_TITLES
      )
        continue
      throw error
    }
    home = access.prototypeOf(created.id)
    firstView = created.artifact
  }
  const refusal = access.refusalFor(home.contributor, home.meta)
  if (refusal) throw fail(403, refusal.message)

  const view = fileTypes.find(({ id }) => id === VIEW)
  if (!view) throw fail(500, 'No installed module provides views.')
  const marker = versionMarker(version.marker)
  const release = identityLock(root)
  try {
    // A new prototype's empty starting view becomes the first version.
    const starting = firstView ? path.join(home.dir, STARTING_VIEW) : null
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
    const content = view.identity.write(
      `${marker}\n${version.source}`,
      artifact,
    )
    if (starting && existsSync(starting)) {
      // Moved, then written over: only one file ever holds its permanent ID.
      renameSync(starting, file)
      writeFileSync(file, content)
    } else writeFileSync(file, content, { flag: 'wx' })
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
