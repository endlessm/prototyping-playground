// Making Lab experiments, on Node: the dev server's handler (`../server/
// experiments.ts`) runs it for the page. Each person's experiments of one
// component live in one prototype of theirs, "<Component> experiments", with
// the component's system, made the first time through the studio's own
// prototype creation; each experiment is a view in it, marked with the
// component it explores (`tooling/manifest/experiments.ts`). New experiment
// starts the view from the component's rendering source (`./source.ts`);
// Duplicate copies anyone's experiment into your own, with fresh permanent
// IDs. Only registered contributors make experiments, refused with the
// studio's own sentences, and a failure leaves nothing behind. Imports only
// Node, `tooling/` and the Lab.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readContributors } from '../../../../tooling/contributors/profiles.ts'
import { refusalMessage } from '../../../../tooling/contributors/roles.ts'
import { newStudioId } from '../../../../tooling/contributors/studio-ids.ts'
import { identityLock } from '../../../../tooling/identity/assign.ts'
import {
  auditIdentities,
  identitiesInUse,
} from '../../../../tooling/identity/audit.ts'
import type { IdentityFileType } from '../../../../tooling/identity/file-types.ts'
import {
  createPrototype,
  localDate,
} from '../../../../tooling/files/prototypes.ts'
import {
  defaultIdentify,
  fileAccess,
  FileServiceError,
  type FileServiceOptions,
} from '../../../../tooling/files/source.ts'
import { nameProblem } from '../../../../tooling/files/tree.ts'
import {
  readExperiment,
  writeExperiment,
  type ExperimentMarker,
} from '../../../../tooling/manifest/experiments.ts'
import {
  PROTOTYPES_FOLDER,
  treeFiles,
} from '../../../../tooling/manifest/build.ts'
import {
  CONFIG_FILE,
  readConfig,
} from '../../../../tooling/modules/registry.ts'
import { systemCatalog } from '../../../../tooling/systems/catalog.ts'
import { stemOf } from '../../../../tooling/systems/components.ts'
import {
  loadSystems,
  systemsFolder,
} from '../../../../tooling/systems/registry.ts'
import {
  applyChanges,
  changesOf,
  type RequestedChange,
  type SavedChanges,
} from './save.ts'
import { experimentSource } from './source.ts'

export interface ExperimentsContext {
  /** The studio's root folder. */
  root: string
  /** Relative to the root; `src/prototypes` by default. */
  prototypesFolder?: string
  /** Relative to the root or absolute; `contributors` by default. */
  contributorsFolder?: string
  /** Relative to the root; `studio.config.json` by default. */
  configFile?: string
  /** Relative to the root; the studio's systems folder by default. */
  systemsFolder?: string
  /** Every installed file type, so no identity is handed out twice. */
  fileTypes: IdentityFileType[]
  /** Who is working; your Git identity by default. */
  identify?: FileServiceOptions['identify']
}

/** A new experiment: its prototype's and its view's permanent IDs. */
export interface MadeExperiment {
  prototype: string
  artifact: string
}

/** An experiment made with a Breakdown's changes written into it. */
export type SavedExperiment = MadeExperiment & Partial<SavedChanges>

const VIEW = 'view'
const EXTENSION = '.vue'

const refuse = (status: number, code: string, message: string) =>
  new FileServiceError(status, code, message)
const gone = () => refuse(404, 'not_found', 'This experiment no longer exists.')

/** The registered contributor working, or the studio's refusal. */
function contributorOf(context: ExperimentsContext) {
  const { contributors } = readContributors(
    context.root,
    context.contributorsFolder,
  )
  const identity = (context.identify ?? defaultIdentify(context.root))(
    contributors,
  )
  const profile = identity.key ? contributors[identity.key] : undefined
  if (!identity.key || !profile)
    throw refuse(
      403,
      'identity',
      refusalMessage('identity', {
        email: identity.email,
        hint: identity.hint,
      }),
    )
  return { key: identity.key, studioId: profile.studioId }
}

function viewType(context: ExperimentsContext) {
  const type = context.fileTypes.find(({ id }) => id === VIEW)
  if (!type)
    throw refuse(
      500,
      'unavailable',
      'Experiments are views, and no installed module provides views.',
    )
  return type
}

/** The component, read from its system, refusing an archived system. */
async function componentOf(
  context: ExperimentsContext,
  systemId: unknown,
  slug: unknown,
) {
  const { root } = context
  const config = readConfig(
    path.resolve(root, context.configFile ?? CONFIG_FILE),
  )
  const { systems } = await loadSystems(
    root,
    config,
    context.systemsFolder ?? systemsFolder(),
  )
  const system = systems.find(({ id }) => id === systemId)
  const component = system
    ? systemCatalog(system, root).components.find((each) => each.slug === slug)
    : undefined
  if (!system || !component)
    throw refuse(404, 'not_found', 'This component no longer exists.')
  if (system.spec.status !== 'active')
    throw refuse(
      409,
      'unavailable',
      refusalMessage('unavailable', { system: system.spec.label }),
    )
  if (!component.source)
    throw refuse(
      400,
      'invalid',
      `Experiments start from the component file. Add ${stemOf(component.doc ?? component.examplesFile ?? component.slug)}.vue next to the component first.`,
    )
  const read = (file: string | null) =>
    file
      ? {
          file: path.resolve(root, file),
          source: readFileSync(path.resolve(root, file), 'utf8'),
        }
      : null
  return {
    system,
    component,
    files: {
      component: read(component.source)!,
      examples: read(component.examplesFile),
    },
  }
}

function cleanName(value: unknown) {
  const problem = nameProblem(value)
  if (problem) throw refuse(400, 'invalid', problem)
  return value as string
}

/**
 * Your prototype for a component's experiments: the one holding your
 * experiments of it, else the one named for them, or none yet.
 */
function experimentsPrototype(
  context: ExperimentsContext,
  me: { key: string; studioId: string },
  marker: Pick<ExperimentMarker, 'systemId' | 'component'>,
  title: string,
) {
  const access = fileAccess(context)
  let named: ReturnType<typeof access.prototypeOf> | undefined
  for (const found of access.prototypes()) {
    const { dir, contributor, meta } = found
    const owner =
      typeof meta.ownerContributorId === 'string'
        ? meta.ownerContributorId
        : contributor === me.key
          ? me.studioId
          : null
    if (owner !== me.studioId || meta.systemId !== marker.systemId) continue
    for (const file of treeFiles(dir)) {
      if (!file.toLowerCase().endsWith(EXTENSION)) continue
      const explores = readExperiment(
        readFileSync(path.join(dir, file), 'utf8'),
      )
      if (explores?.component === marker.component) return found
    }
    if (meta.title === title) named ??= found
  }
  return named
}

/**
 * Writes `<name>.vue` into the prototype's folder, its source made with
 * fresh permanent IDs (the first one given, when there is one).
 */
function writeView(
  context: ExperimentsContext,
  dir: string,
  name: string,
  make: (fresh: () => string) => string,
  first?: string,
) {
  const file = path.join(dir, `${name}${EXTENSION}`)
  const taken = () =>
    refuse(
      409,
      'exists',
      `You already have an experiment named “${name}”. Choose a different name.`,
    )
  if (existsSync(file)) throw taken()
  const release = identityLock(context.root)
  try {
    const used = identitiesInUse(
      auditIdentities(context.root, context.fileTypes, {
        prototypesFolder: context.prototypesFolder ?? PROTOTYPES_FOLDER,
        contributorsFolder: context.contributorsFolder,
      }),
    )
    let next = first
    const fresh = () => {
      const id = next ?? newStudioId(used)
      next = undefined
      used.add(id)
      return id
    }
    try {
      writeFileSync(file, make(fresh), { flag: 'wx' })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw taken()
      throw error
    }
  } finally {
    release()
  }
  return file
}

/**
 * Adds an experiment named `name` for the component to your prototype for
 * it, making the prototype first when you have none.
 */
async function addExperiment(
  context: ExperimentsContext,
  request: { system: unknown; component: unknown; name: unknown },
  make: (made: {
    target: string
    files: Awaited<ReturnType<typeof componentOf>>['files']
    marker: ExperimentMarker
    fresh: () => string
  }) => string,
  changes?: RequestedChange[],
): Promise<SavedExperiment> {
  const me = contributorOf(context)
  const name = cleanName(request.name)
  const { system, component, files } = await componentOf(
    context,
    request.system,
    request.component,
  )
  // The Breakdown's changes go into the source before it is written, so a
  // change that can't be written leaves nothing behind.
  let saved: SavedChanges | undefined
  const finish = (source: string, target: string) => {
    if (!changes) return source
    const written = applyChanges(source, {
      file: target,
      system,
      root: context.root,
      changes,
    })
    saved = { saved: written.saved, skipped: written.skipped }
    return written.source
  }
  const view = viewType(context)
  const marker = {
    systemId: system.id,
    component: component.slug,
    created: localDate(),
  }
  const title = `${component.title} experiments`
  const found = experimentsPrototype(context, me, marker, title)
  if (found) {
    const refusal = fileAccess(context).refusalFor(
      found.contributor,
      found.meta,
    )
    if (refusal) throw refuse(403, refusal.code, refusal.message)
    let artifact = ''
    writeView(context, found.dir, name, (fresh) => {
      const target = path.join(found.dir, `${name}${EXTENSION}`)
      const source = finish(make({ target, files, marker, fresh }), target)
      artifact = view.identity.read(source)!
      return source
    })
    return { prototype: found.meta.studioId as string, artifact, ...saved }
  }
  const created = createPrototype(
    { ...context, fileTypes: context.fileTypes },
    { title, system: system.id },
  )
  const dir = path.resolve(context.root, created.folder)
  try {
    // The experiment replaces the empty starting view and takes its identity.
    rmSync(path.join(dir, `Prototype${EXTENSION}`))
    const target = path.join(dir, `${name}${EXTENSION}`)
    writeView(
      context,
      dir,
      name,
      (fresh) => finish(make({ target, files, marker, fresh }), target),
      created.artifact,
    )
  } catch (error) {
    rmSync(dir, { recursive: true, force: true })
    throw error
  }
  return { prototype: created.id, artifact: created.artifact, ...saved }
}

/**
 * A new experiment of a component, from its rendering source, with a
 * Breakdown's changes written into it when there are any (Save as
 * experiment).
 */
export function createExperiment(
  context: ExperimentsContext,
  request: { system: unknown; component: unknown; name: unknown },
  changes?: unknown,
) {
  const view = viewType(context)
  return addExperiment(
    context,
    request,
    ({ target, files, marker, fresh }) =>
      view.identity.write(
        writeExperiment(experimentSource({ ...files, target }), marker),
        fresh(),
      ),
    changes === undefined ? undefined : changesOf(changes),
  )
}

/**
 * Anyone's experiment, copied into your own with fresh permanent IDs, with
 * a Breakdown's changes written into it when there are any (Save as my
 * experiment).
 */
export async function duplicateExperiment(
  context: ExperimentsContext,
  request: { experiment: unknown; name: unknown },
  changes?: unknown,
) {
  contributorOf(context)
  const wantedChanges = changes === undefined ? undefined : changesOf(changes)
  const view = viewType(context)
  const access = fileAccess(context)
  const wanted = String(request.experiment ?? '')
  let original: { source: string; marker: ExperimentMarker } | undefined
  for (const { dir, meta } of access.prototypes()) {
    let file: string
    try {
      file = access.artifactOf(dir, wanted).file
    } catch {
      continue
    }
    const source = readFileSync(file, 'utf8')
    const marker = readExperiment(source)
    if (marker && marker.systemId === meta.systemId)
      original = { source, marker }
    break
  }
  if (!original) throw gone()
  const { source, marker } = original
  const ids = [
    wanted,
    ...(view.identity.children?.read(source) ?? []).flatMap(({ studioId }) =>
      studioId ? [studioId] : [],
    ),
  ]
  return addExperiment(
    context,
    {
      system: marker.systemId,
      component: marker.component,
      name: request.name,
    },
    (made) => {
      const renewed = new Map(ids.map((id) => [id, made.fresh()]))
      const copied = source.replace(
        new RegExp(`(?<![0-9a-z])(${ids.join('|')})(?![0-9a-z])`, 'g'),
        (id) => renewed.get(id)!,
      )
      return writeExperiment(copied, made.marker)
    },
    wantedChanges,
  )
}
