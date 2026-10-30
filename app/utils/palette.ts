import type { Manifest, ManifestArtifact } from '../../tooling/manifest/build'
import type { ModulePaletteEntry } from '../../tooling/modules/contract'

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
  labels: { places: string; home: string; settings: string },
) {
  const entry = (item: ModulePaletteEntry) => ({
    ...item,
    disabled: item.to === current.path,
  })
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
        .map(entry),
    ),
  ]
  const groups = [{ id: 'places', label: labels.places, items: places }]
  for (const module of [...modules].sort(
    (a, b) => (a.paletteOrder ?? 50) - (b.paletteOrder ?? 50),
  )) {
    const items = module.palette
      .filter((item) => item.group && item.group !== 'Places')
      .map(entry)
    if (module.paletteSource === 'systems') {
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
