import type { Manifest, ManifestArtifact } from '../../tooling/manifest/build'
import type { ModulePaletteEntry } from '../../tooling/modules/contract'
import { systemMenu, type SystemActionId } from '../../tooling/systems/menu'

/** The changes to a system the palette offers, as its "…" menu does. */
const SYSTEM_CHANGES: SystemActionId[] = [
  'rename',
  'setDefault',
  'archive',
  'restore',
  'delete',
]

/** Who is working, as far as the palette needs to know. */
export interface PaletteMe {
  admin: boolean
  /** The systems they maintain, by permanent ID. */
  maintains: string[]
}

export interface PaletteModule {
  id: string
  label: string
  palette: ModulePaletteEntry[]
  paletteOrder?: number
  paletteSource?: 'prototypes' | 'systems'
}

export function paletteGroups(
  modules: PaletteModule[],
  manifest: Manifest,
  artifacts: ManifestArtifact[],
  current: { path: string; prototype?: string },
  local: boolean,
  labels: {
    places: string
    home: string
    settings: string
    /** "Rename Harbor" and the like. */
    systemAction?: (id: SystemActionId, name: string) => string
  },
  me: PaletteMe = { admin: false, maintains: [] },
) {
  const entry = ({ localOnly, adminOnly, ...item }: ModulePaletteEntry) => ({
    ...item,
    disabled: item.to === current.path,
  })
  // Entries for actions are offered only where, and to whom, they work.
  const offered = (item: ModulePaletteEntry) =>
    (!item.localOnly || local) && (!item.adminOnly || (local && me.admin))
  const places = [
    entry({ label: labels.home, to: '/', keywords: ['overview'] }),
    ...(local
      ? [
          entry({
            label: labels.settings,
            to: '/settings',
            keywords: ['configuration', 'modules', 'contributors', 'admins'],
          }),
        ]
      : []),
    ...modules.flatMap((module) =>
      module.palette
        .filter((item) => !item.group || item.group === 'Places')
        .filter(offered)
        .map(entry),
    ),
  ]
  const groups = [{ id: 'places', label: labels.places, items: places }]
  for (const module of [...modules].sort(
    (a, b) => (a.paletteOrder ?? 50) - (b.paletteOrder ?? 50),
  )) {
    const items = module.palette
      .filter((item) => item.group && item.group !== 'Places')
      .filter(offered)
      .map(entry)
    if (module.paletteSource === 'systems') {
      // The system you are in: what its "…" menu lets you change.
      const here = manifest.systems.find(
        ({ id }) =>
          current.path === `/systems/${id}` ||
          current.path.startsWith(`/systems/${id}/`),
      )
      if (here && local && labels.systemAction)
        items.push(
          ...systemMenu(
            {
              local,
              admin: me.admin,
              maintainer: me.admin || me.maintains.includes(here.id),
              archived: here.status === 'archived',
              isDefault: manifest.defaultSystem === here.id,
            },
            (id) => id,
          )
            .flat()
            .filter((id) => SYSTEM_CHANGES.includes(id))
            .map((id) =>
              entry({
                label: labels.systemAction!(id, here.label),
                to: `/systems/${here.id}?action=${id}`,
              }),
            ),
        )
      items.push(
        ...manifest.systems
          .filter((s) => local || s.status !== 'archived')
          .map((system) => ({
            ...entry({
              label: `${system.label} system`,
              to: `/systems/${system.id}`,
              keywords: [system.key],
            }),
            disabled:
              current.path === `/systems/${system.id}` ||
              current.path.startsWith(`/systems/${system.id}/`),
          })),
      )
    }
    if (module.paletteSource === 'prototypes') {
      items.push(
        ...manifest.prototypes
          .filter((p) => local || p.status !== 'archived')
          .sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''))
          .map((prototype) => {
            const name =
              manifest.contributors.find((c) => c.id === prototype.owner)
                ?.name ?? prototype.contributor
            return {
              ...entry({
                label: prototype.title,
                to: `/prototypes/${prototype.id}`,
                keywords: [name, prototype.contributor, prototype.folder],
              }),
              suffix: name.split(' ')[0],
              disabled: prototype.id === current.prototype,
            }
          }),
      )
      const prefix = `/prototypes/${current.prototype}/artifacts/`
      items.push(
        ...artifacts
          .filter((a) => !a.unavailable)
          .flatMap((artifact) => [
            entry({
              label: artifact.title,
              to: prefix + artifact.id,
              keywords: [artifact.path],
            }),
            ...(artifact.states ?? []).map((state) =>
              entry({
                label: state.title,
                to: prefix + state.id,
                keywords: [artifact.title, artifact.path],
              }),
            ),
          ]),
      )
    }
    if (items.length) groups.push({ id: module.id, label: module.label, items })
  }
  return groups
}
