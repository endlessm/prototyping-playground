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
 * its i18n key. The bar shows an `app` tab only for an app component.
 */
export const LAB_TABS = [
  { id: 'overview', label: 'lab.tabs.overview', path: '' },
  { id: 'variants', label: 'lab.tabs.variants', path: 'variants' },
  { id: 'playground', label: 'lab.tabs.playground', path: 'playground' },
  { id: 'versions', label: 'lab.tabs.versions', path: 'versions', app: true },
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
  return LAB_TABS.find((tab) => tab.path === rest)
}

/**
 * Every component the Lab lists for a system: its pages, in the Systems
 * navigation's order, then the app components no page presents.
 */
export const labComponents = (
  system: Pick<SystemCatalog, 'components' | 'appComponents'>,
) => [...system.components, ...system.appComponents]

/** The list's groups, in its order. */
export type LabGroup = 'app' | 'system'

/**
 * The list's groups, empty ones left out: the app components (those a page
 * presents and those it doesn't, by their path in the app copy), then the
 * system's other components, such as its Nuxt UI wrappers, in the order
 * given.
 */
export function labGroups<T extends Pick<CatalogComponent, 'app'>>(
  components: T[],
) {
  const app = components
    .filter((component) => component.app)
    .sort((a, b) => a.app!.path.localeCompare(b.app!.path, 'en'))
  const groups: { id: LabGroup; components: T[] }[] = [
    { id: 'app', components: app },
    {
      id: 'system',
      components: components.filter((component) => !component.app),
    },
  ]
  return groups.filter((group) => group.components.length > 0)
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
      (system) =>
        system.status === 'active' && labComponents(system).length > 0,
    ),
    defaultSystem,
  )

/** Where `/lab` opens: the first offered system's first component. */
export function labLanding(
  systems: SystemCatalog[],
  defaultSystem: string | null,
) {
  const [first] = labSystems(systems, defaultSystem)
  return first ? labAddress(first.id, labComponents(first)[0]!.slug) : null
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
