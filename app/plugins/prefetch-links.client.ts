// Hovering or focusing a link to a studio page starts loading that page, so
// the click feels instant. Nuxt UI renders its links itself (NuxtLink's
// `custom` mode), which skips NuxtLink's own prefetching, so this covers
// every link in one place.
export default defineNuxtPlugin(() => {
  const router = useRouter()
  const base = useRuntimeConfig().app.baseURL
  const seen = new Set<string>()

  function preload(event: Event) {
    const link = (event.target as Element | null)?.closest?.('a[href]')
    if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') return
    const url = new URL(link.href, location.href)
    if (url.origin !== location.origin || !url.pathname.startsWith(base)) return
    const path = `/${url.pathname.slice(base.length)}`
    if (seen.has(path)) return
    seen.add(path)
    void preloadRouteComponents(router.resolve(path), router)
  }

  document.addEventListener('pointerover', preload, { passive: true })
  document.addEventListener('focusin', preload)
})
