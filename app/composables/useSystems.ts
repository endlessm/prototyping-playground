import { NO_SYSTEM, PREVIEW_ROUTE } from '../../tooling/preview/constants'

/** The address of a system's preview document, without its query. */
export function usePreviewDocument() {
  const base = useRuntimeConfig().app.baseURL
  return (systemId: string | null) =>
    `${base}${PREVIEW_ROUTE}${systemId ?? NO_SYSTEM}/`
}

/** The installed systems, and where a view of each renders. */
export async function useSystems() {
  const previewDocument = usePreviewDocument()
  const manifest = await useManifest()
  const systems = computed(() => manifest.value.systems)
  return {
    systems,
    defaultSystem: computed(() => manifest.value.defaultSystem),
    /** A system by permanent ID, or nothing when it isn't installed. */
    systemOf: (id: string | null) =>
      id === null
        ? null
        : (systems.value.find((system) => system.id === id) ?? undefined),
    previewDocument,
  }
}
