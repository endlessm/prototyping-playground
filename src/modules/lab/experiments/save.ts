// Saving a Breakdown's unsaved changes into a Lab experiment's own file, on
// Node: the dev server's handler (`../server/save.ts`) runs it for the page,
// and Save as experiment and Save as my experiment run `applyChanges` on the
// experiment they make (`./service.ts`). It checks, in order, that the view
// is an experiment, that you may change its prototype (the studio's own
// refusals, as `canEdit`), that the file is the version the page read, and
// that each value is one the theme offers; then each change is written into
// its piece's tag (`./writer.ts`). Imports only Node, `tooling/` and the Lab.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  fileAccess,
  FileServiceError,
  versionOf,
} from '../../../../tooling/files/source.ts'
import { experimentOf } from '../../../../tooling/manifest/experiments.ts'
import {
  CONFIG_FILE,
  readConfig,
} from '../../../../tooling/modules/registry.ts'
import {
  KNOB_FAMILIES,
  knobClass,
  knobTheme,
  knobValues,
  type KnobFamily,
} from '../../../../tooling/preview/knobs.ts'
import { isBreakdownNodeId } from '../../../../tooling/preview/protocol.ts'
import {
  fileTags,
  nuxtUiCatalog,
} from '../../../../tooling/systems/breakdown.ts'
import { systemCatalog } from '../../../../tooling/systems/catalog.ts'
import {
  loadSystems,
  systemsFolder,
  type InstalledSystem,
} from '../../../../tooling/systems/registry.ts'
import type { ExperimentsContext } from './service.ts'
import { writeBreakdownChanges, type SourceChange } from './writer.ts'

/** One unsaved change as the page sends it: a knob's new value on a piece. */
export interface RequestedChange {
  node: string
  slot: string
  family: KnobFamily
  value: string
}

/** A change left unsaved, as the page finds it among its own. */
export type SkippedChange = Pick<RequestedChange, 'node' | 'slot' | 'family'>

export interface SavedChanges {
  /** How many changes were written. */
  saved: number
  /** Changes to pieces the file doesn't hold (inside a file it imports). */
  skipped: SkippedChange[]
}

const MAX_CHANGES = 500
// A `ui` key as Nuxt UI's themes name their slots, or the tag's own class.
const SLOT = /^[A-Za-z][A-Za-z0-9]*$/

const invalid = (message = 'Invalid changes to save.') =>
  new FileServiceError(400, 'invalid', message)
const gone = () =>
  new FileServiceError(404, 'not_found', 'This experiment no longer exists.')

/** The changes of a request, or a refusal when any isn't one. */
export function changesOf(value: unknown): RequestedChange[] {
  if (!Array.isArray(value) || value.length > MAX_CHANGES) throw invalid()
  return value.map((change: unknown) => {
    const { node, slot, family, value } = (change ?? {}) as Record<
      string,
      unknown
    >
    if (
      !isBreakdownNodeId(node) ||
      typeof slot !== 'string' ||
      !SLOT.test(slot) ||
      typeof family !== 'string' ||
      !Object.hasOwn(KNOB_FAMILIES, family) ||
      typeof value !== 'string'
    )
      throw invalid()
    return { node, slot, family: family as KnobFamily, value }
  })
}

/** A system by its permanent ID, as the studio has it installed. */
export async function systemOf(context: ExperimentsContext, id: string) {
  const config = readConfig(
    path.resolve(context.root, context.configFile ?? CONFIG_FILE),
  )
  const { systems } = await loadSystems(
    context.root,
    config,
    context.systemsFolder ?? systemsFolder(),
  )
  const system = systems.find((each) => each.id === id)
  if (!system)
    throw new FileServiceError(
      404,
      'not_found',
      'This experiment’s system is no longer installed.',
    )
  return system
}

/**
 * The source of the view at `file` with the changes written into its
 * pieces' tags, refusing a value its system's theme doesn't offer.
 */
export function applyChanges(
  source: string,
  options: {
    file: string
    system: InstalledSystem
    root: string
    changes: RequestedChange[]
  },
) {
  const { file, system, root } = options
  const theme = knobTheme(systemCatalog(system, root))
  const changes: SourceChange[] = options.changes.map((change) => {
    if (!knobValues(change.family, theme).includes(change.value))
      throw invalid('A knob value isn’t one the theme offers.')
    return {
      node: change.node,
      slot: change.slot,
      family: change.family,
      className: knobClass(change, change.value),
    }
  })
  const found = fileTags(source, file, {
    system,
    nuxtUi: nuxtUiCatalog(system, root),
    follow: () => false,
  })
  if (!found.tags)
    throw new FileServiceError(
      422,
      'unreadable',
      `This experiment’s template can’t be read: ${found.problem}`,
    )
  const written = writeBreakdownChanges(source, changes, {
    tags: found.tags,
    theme,
  })
  return {
    source: written.source,
    saved: written.written.length,
    skipped: written.skipped.map(({ node, slot, family }) => ({
      node,
      slot,
      family,
    })),
  }
}

/**
 * Writes the changes into an experiment's file, saved over the version the
 * page read (`base`), and answers its new version.
 */
export async function saveExperiment(
  context: ExperimentsContext,
  request: {
    prototype: unknown
    artifact: unknown
    base: unknown
    changes: unknown
  },
): Promise<SavedChanges & { version: string }> {
  const changes = changesOf(request.changes)
  if (typeof request.base !== 'string') throw invalid()
  const access = fileAccess(context)
  const found = access.prototypeOf(String(request.prototype ?? ''))
  const { file } = access.artifactOf(found.dir, String(request.artifact ?? ''))
  const refusal = access.refusalFor(found.contributor, found.meta)
  if (refusal) throw new FileServiceError(403, refusal.code, refusal.message)
  const source = readFileSync(file, 'utf8')
  const marker = experimentOf(source, found.meta)
  if (!marker) throw gone()
  if (versionOf(source) !== request.base)
    throw new FileServiceError(
      409,
      'changed',
      'This file changed on disk since you opened it.',
    )
  const system = await systemOf(context, marker.systemId)
  const written = applyChanges(source, {
    file,
    system,
    root: context.root,
    changes,
  })
  if (written.source !== source) writeFileSync(file, written.source)
  return {
    version: versionOf(written.source),
    saved: written.saved,
    skipped: written.skipped,
  }
}
