import type {
  Manifest,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'

/** The prototypes module's icon: on the rail, cards and rows. */
export const PROTOTYPE_ICON = 'i-lucide-square-mouse-pointer'

/** Newest first by creation date, then by title. */
export const newestFirst = (a: ManifestPrototype, b: ManifestPrototype) =>
  (b.created ?? '').localeCompare(a.created ?? '') ||
  a.title.localeCompare(b.title)

/** Who made a prototype, for its byline: by owner, else by folder. */
export function makerOf(manifest: Manifest, prototype: ManifestPrototype) {
  const found =
    manifest.contributors.find(({ id }) => id === prototype.owner) ??
    manifest.contributors.find(({ key }) => key === prototype.contributor)
  return (
    found ?? { id: '', key: prototype.contributor, name: prototype.contributor }
  )
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? ''

/**
 * Whether a prototype matches a search: its title, its maker's name or key,
 * or its folder's name contain the text, ignoring case.
 */
export function matchesSearch(
  manifest: Manifest,
  prototype: ManifestPrototype,
  text: string,
) {
  const wanted = text.trim().toLowerCase()
  if (!wanted) return true
  const maker = makerOf(manifest, prototype)
  return [
    prototype.title,
    maker.name,
    maker.key,
    prototype.folder.split('/').pop() ?? '',
  ].some((field) => field.toLowerCase().includes(wanted))
}

/** Whether a prototype uses a system, named by folder name or ID. */
export function matchesSystem(
  manifest: Manifest,
  prototype: ManifestPrototype,
  system: string | undefined,
) {
  if (!system) return true
  const found = manifest.systems.find(
    ({ key, id }) => key === system || id === system,
  )
  return Boolean(found) && prototype.systemId === found!.id
}
