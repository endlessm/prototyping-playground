import urls from 'virtual:studio-module-data'
import type {
  CatalogDocument,
  CatalogSkill,
  SystemCatalog,
  TokenGroup,
} from '../../../../tooling/systems/catalog'

export type { CatalogDocument, CatalogSkill, SystemCatalog, TokenGroup }

// The systems' catalogs and their Context and Skills text, built by the
// module's build data (`module.ts`). Each is fetched once for the page and,
// in development, fetched again when the dev server says its files changed.
// Pages await them, so a page is ready before it shows.
function shared<T>(key: string) {
  const value = shallowRef<T>()
  let pending: Promise<T> | undefined
  const fetchValue = async () => {
    const response = await fetch(urls[key]!)
    if (!response.ok) throw new Error(`Build data ${key} failed to load.`)
    return (await response.json()) as T
  }
  return async () => {
    pending ??= fetchValue().then((first) => {
      value.value = first
      const reload = () =>
        void fetchValue().then((next) => (value.value = next))
      import.meta.hot?.on('studio:data', (event: { key: string }) => {
        if (event.key === key) reload()
      })
      // Changes while the socket was down are not replayed.
      import.meta.hot?.on('vite:ws:connect', reload)
      return first
    })
    pending.catch(() => (pending = undefined))
    await pending
    return value as Ref<T>
  }
}

const loadCatalog = shared<{ systems: SystemCatalog[] }>('systems/catalog')
const loadDocuments = shared<Record<string, string>>('systems/documents')

/** Every system the area shows, and one by its permanent ID. */
export async function useSystemCatalog() {
  const catalog = await loadCatalog()
  const systems = computed(() => catalog.value.systems)
  return {
    systems,
    systemOf: (id: string) => systems.value.find((system) => system.id === id),
  }
}

/** The Context and Skills Markdown, by repository path. */
export async function useSystemDocuments() {
  return loadDocuments()
}
