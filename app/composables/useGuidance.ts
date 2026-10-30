import urls from 'virtual:studio-module-data'
import type { GuidanceOwner } from '../../tooling/guidance/addresses'
import type { ManualChapter } from '../../src/modules/documentation/manual'

export type { GuidanceOwner }
export type {
  GuidanceDocument,
  GuidanceKind,
} from '../../tooling/guidance/addresses'
export type { ManualChapter }

/** The Manual's build data (the Documentation module's `manual`). */
export interface ManualData {
  /** The module's folder, repository-relative. */
  folder: string
  chapters: ManualChapter[]
  /** What is wrong with skipped chapters, locally. */
  problems: string[]
  /** Each chapter's text, by its slug. */
  texts: Record<string, string>
  /** Every chapter file, broken ones too, locally. */
  files: string[]
}

// Build data the documentation pages share: fetched once for the page and,
// in development, again when the dev server says its files changed, so a
// saved chapter or guidance file updates in place. Pages await them, so a
// page is ready before it shows.
function shared<T>(key: string) {
  const value = shallowRef<T>()
  let pending: Promise<T> | undefined
  const fetchValue = async () => {
    const url = urls[key]
    if (!url) throw new Error(`Build data ${key} is unavailable.`)
    const response = await fetch(url)
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

const loadGuidance = shared<{ owners: GuidanceOwner[] }>('studio/guidance')
const loadTexts = shared<Record<string, string>>('studio/guidance-documents')
const loadManual = shared<ManualData>('documentation/manual')

/** The Platform's and enabled modules' guidance. */
export async function useGuidance() {
  const catalog = await loadGuidance()
  return computed(() => catalog.value.owners)
}

/** The guidance documents' text, by repository path. */
export const useGuidanceTexts = () => loadTexts()

/** Whether the Manual is on. */
export const manualEnabled = () => Boolean(urls['documentation/manual'])

/** The Manual's chapters and text; only while the Manual is on. */
export const useManual = () => loadManual()

/** A chapter's address. */
export const chapterHref = (slug: string) =>
  `/documentation/manual${slug === 'index' ? '' : `/${slug}`}`
