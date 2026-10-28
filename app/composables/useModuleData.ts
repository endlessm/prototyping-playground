import urls from 'virtual:studio-module-data'

// Named data a module computes at build time (in development, on the first
// request). It refreshes while the page is open when a watched file changes.
export function useModuleData<T>(module: string, name: string) {
  const key = `${module}/${name}`
  const data = shallowRef<T>()
  const error = shallowRef<Error>()

  async function load() {
    const url = urls[key]
    if (!url) {
      error.value = new Error(`Build data ${key} is unavailable.`)
      return
    }
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Build data ${key} failed to load.`)
      data.value = (await response.json()) as T
      error.value = undefined
    } catch (failure) {
      error.value = failure as Error
    }
  }

  const changed = (event: { key: string }) => {
    if (event.key === key) void load()
  }
  onMounted(() => {
    void load()
    import.meta.hot?.on('studio:data', changed)
    // Watch events sent while the socket was down are not replayed.
    import.meta.hot?.on('vite:ws:connect', load)
  })
  onBeforeUnmount(() => {
    import.meta.hot?.off('studio:data', changed)
    import.meta.hot?.off('vite:ws:connect', load)
  })
  return { data, error }
}
