import { createSharedComposable } from '@vueuse/core'

export interface Me {
  key: string | null
  name?: string
  studioId?: string
  role?: 'admin' | 'contributor' | null
}

// Who is working, from the local dev server: your contributor key, name and
// role, refreshed when a profile or the configuration changes. The deployed
// site identifies nobody.
export const useMe = createSharedComposable(() => {
  const me = shallowRef<Me>({ key: null })
  // Whether the dev server has answered yet; the deployed site knows nobody.
  const known = ref(!import.meta.dev)
  const url = `${useRuntimeConfig().app.baseURL}_studio/me`

  async function load() {
    try {
      const response = await fetch(url)
      if (response.ok) me.value = (await response.json()) as Me
      known.value = true
    } catch {
      // The dev server is restarting; the next connection loads again.
    }
  }

  if (import.meta.dev) {
    onMounted(() => {
      void load()
      import.meta.hot?.on('studio:identity', load)
      // Events sent while the socket was down are not replayed.
      import.meta.hot?.on('vite:ws:connect', load)
    })
    onScopeDispose(() => {
      import.meta.hot?.off('studio:identity', load)
      import.meta.hot?.off('vite:ws:connect', load)
    })
  }

  const firstName = computed(() => me.value.name?.split(/\s+/)[0] ?? '')
  return { me, known, firstName }
})
