// Saving a Breakdown's unsaved changes into a Lab experiment's own file, on
// Node: the dev server's handler (`../server/save.ts`) runs it for the page,
// and Save as experiment and Save as my experiment run `applyChanges` on the
// experiment they make (`./service.ts`). It checks, in order, that the view
// is an experiment, that you may change its prototype (the studio's own
// refusals, as `canEdit`), that the file is the version the page read, and
// that each value is one the theme offers; then each change is written into
// its piece's tag, and each of the dial panel's props on its tag when the
// tag is the Lab's component (`./writer.ts`). Imports only Node, `tooling/`
// and the Lab.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileAccess, versionOf } from '../../../../tooling/files/source.ts'
import { experimentOf } from '../../../../tooling/manifest/experiments.ts'
import {
  KNOB_FAMILIES,
  knobClass,
  knobTheme,
  knobValues,
  type KnobFamily,
} from '../../../../tooling/preview/knobs.ts'
import {
  isBreakdownNodeId,
  isSettableProp,
} from '../../../../tooling/preview/protocol.ts'
import {
  fileTags,
  nuxtUiCatalog,
} from '../../../../tooling/systems/breakdown.ts'
import { systemCatalog } from '../../../../tooling/systems/catalog.ts'
import type { InstalledSystem } from '../../../../tooling/systems/registry.ts'
import {
  gone,
  installedSystems,
  refuse,
  type ExperimentsContext,
} from './context.ts'
import { componentInstances, IGNORED_PROPS } from './instances.ts'
import {
  writeBreakdownChanges,
  writePropChanges,
  type PropChange,
  type SourceChange,
} from './writer.ts'

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
  /** Props left unsaved: bound to code on their tags, or not the component's. */
  skippedProps?: SkippedProp[]
}

/** One prop the dial panel set on an instance of the Lab's component. */
export type RequestedProp = PropChange
/** A prop left unsaved, as the page finds it among its own. */
export type SkippedProp = Pick<PropChange, 'node' | 'prop'>

const MAX_CHANGES = 500
// A `ui` key as Nuxt UI's themes name their slots, or the tag's own class.
const SLOT = /^[A-Za-z][A-Za-z0-9]*$/
const MAX_TEXT = 2000

const invalid = (message = 'Invalid changes to save.') =>
  refuse(400, 'invalid', message)

/** The props of a request (none when left out), or a refusal. */
export function propsOf(value: unknown): RequestedProp[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > MAX_CHANGES) throw invalid()
  return value.map((change: unknown) => {
    const { node, prop, value } = (change ?? {}) as Record<string, unknown>
    const fits =
      value === null ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value)) ||
      (typeof value === 'string' && value.length <= MAX_TEXT)
    if (
      !isBreakdownNodeId(node) ||
      !isSettableProp(prop) ||
      IGNORED_PROPS.has(prop) ||
      !fits
    )
      throw invalid()
    return { node, prop, value: value as RequestedProp['value'] }
  })
}

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
  const system = (await installedSystems(context)).find(
    (each) => each.id === id,
  )
  if (!system)
    throw refuse(
      404,
      'not_found',
      'This experiment’s system is no longer installed.',
    )
  return system
}

/**
 * The source of the view at `file` with the changes written into its
 * pieces' tags, refusing a value its system's theme doesn't offer, then the
 * props written on the tags that are the Lab's `component`; a prop on any
 * other tag, or one its tag binds to code, is left unsaved.
 */
export function applyChanges(
  source: string,
  options: {
    file: string
    system: InstalledSystem
    root: string
    changes: RequestedChange[]
    props?: RequestedProp[]
    /** The Lab component the experiment explores, by its address. */
    component?: string
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
  const nuxtUi = nuxtUiCatalog(system, root)
  const tagsOf = (text: string) => {
    const found = fileTags(text, file, {
      system,
      nuxtUi,
      follow: () => false,
    })
    if (!found.tags)
      throw refuse(
        422,
        'unreadable',
        `This experiment’s template can’t be read: ${found.problem}`,
      )
    return found.tags
  }
  const written = writeBreakdownChanges(source, changes, {
    tags: tagsOf(source),
    theme,
  })
  // The props go on after the classes, over the tags as they now read.
  const props = options.props ?? []
  let next = written.source
  let savedProps: RequestedProp[] = []
  let skippedProps: RequestedProp[] = props
  if (props.length && options.component) {
    const tags = tagsOf(next)
    const instances = new Set(
      componentInstances(tags, options.component).map(({ node }) => node),
    )
    const own = props.filter(({ node }) => instances.has(node))
    const result = writePropChanges(next, own, { tags })
    next = result.source
    savedProps = result.written
    skippedProps = [
      ...props.filter(({ node }) => !instances.has(node)),
      ...result.skipped,
    ]
  }
  return {
    source: next,
    saved: written.written.length + savedProps.length,
    skipped: written.skipped.map(({ node, slot, family }) => ({
      node,
      slot,
      family,
    })),
    skippedProps: skippedProps.map(({ node, prop }) => ({ node, prop })),
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
    props?: unknown
  },
): Promise<SavedChanges & { version: string }> {
  const changes = changesOf(request.changes)
  const props = propsOf(request.props)
  if (typeof request.base !== 'string') throw invalid()
  const access = fileAccess(context)
  const found = access.prototypeOf(String(request.prototype ?? ''))
  const { file } = access.artifactOf(found.dir, String(request.artifact ?? ''))
  const refusal = access.refusalFor(found.contributor, found.meta)
  if (refusal) throw refuse(403, refusal.code, refusal.message)
  const source = readFileSync(file, 'utf8')
  const marker = experimentOf(source, found.meta)
  if (!marker) throw gone()
  if (versionOf(source) !== request.base)
    throw refuse(
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
    props,
    component: marker.component,
  })
  if (written.source !== source) writeFileSync(file, written.source)
  return {
    version: versionOf(written.source),
    saved: written.saved,
    skipped: written.skipped,
    ...(written.skippedProps.length
      ? { skippedProps: written.skippedProps }
      : {}),
  }
}
