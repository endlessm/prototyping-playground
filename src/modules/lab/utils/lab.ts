// The Lab's addresses, tabs, systems and component search: plain functions
// over the Systems catalog, so the pages, the list and the tab bar agree.
import type {
  CatalogComponent,
  SystemCatalog,
} from '../../../../tooling/systems/catalog'
import { inSystemOrder } from '../../systems/utils/pages'

/**
 * A component's tabs, in the tab bar's order. Each is a child page of the
 * component's address; its `path` continues that address, and `label` is
 * its i18n key. A `nested` tab also has pages under its address.
 */
export const LAB_TABS = [
  { id: 'overview', label: 'lab.tabs.overview', path: '' },
  { id: 'variants', label: 'lab.tabs.variants', path: 'variants' },
  { id: 'playground', label: 'lab.tabs.playground', path: 'playground' },
  { id: 'breakdown', label: 'lab.breakdown.tab', path: 'breakdown' },
  {
    id: 'experiments',
    label: 'lab.experiments.tab',
    path: 'experiments',
    nested: true,
  },
] as const

export type LabTab = (typeof LAB_TABS)[number]

/** `/lab`, `/lab/<system id>`, `/lab/<system id>/<slug>[/<tab>]`. */
export const labAddress = (systemId?: string, slug?: string, tab = '') =>
  ['/lab', systemId, slug, tab].filter(Boolean).join('/')

/** The tab an address inside a component shows; none for any other. */
export function tabAt(path: string, systemId: string, slug: string) {
  const base = labAddress(systemId, slug)
  if (path !== base && !path.startsWith(`${base}/`)) return undefined
  const rest = path.slice(base.length).replace(/^\/|\/$/g, '')
  return LAB_TABS.find(
    (tab) =>
      tab.path === rest || ('nested' in tab && rest.startsWith(`${tab.path}/`)),
  )
}

/**
 * The systems the Lab offers: active ones with components, the default
 * first, then by name.
 */
export const labSystems = (
  systems: SystemCatalog[],
  defaultSystem: string | null,
) =>
  inSystemOrder(
    systems.filter(
      ({ status, components }) => status === 'active' && components.length > 0,
    ),
    defaultSystem,
  )

/** Where `/lab` opens: the first offered system's first component. */
export function labLanding(
  systems: SystemCatalog[],
  defaultSystem: string | null,
) {
  const [first] = labSystems(systems, defaultSystem)
  return first ? labAddress(first.id, first.components[0]!.slug) : null
}

/**
 * The components whose title or address holds the search's words, then
 * those whose description does, each in the list's order.
 */
export function matchingComponents<
  T extends Pick<CatalogComponent, 'slug' | 'title'> & {
    description?: string | null
  },
>(components: T[], query: string) {
  const words = query.trim().toLowerCase()
  if (!words) return components
  const holds = (value: string | null | undefined) =>
    Boolean(value?.toLowerCase().includes(words))
  const named = components.filter(
    ({ slug, title }) => holds(slug) || holds(title),
  )
  const described = components.filter(
    (component) => !named.includes(component) && holds(component.description),
  )
  return [...named, ...described]
}
