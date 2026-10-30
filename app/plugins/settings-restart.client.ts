import { earlyRestart } from '../../tooling/settings/restart'
export default defineNuxtPlugin(() => {
  if (!import.meta.dev) return
  const config = useRuntimeConfig()
  const { t } = useNuxtApp().$i18n
  const start = ({ instance }: { instance: string }) => {
    sessionStorage.setItem('design-studio:restart', instance)
    earlyRestart(
      {
        applying: t('settings.applying'),
        preparing: t('settings.preparing'),
        slow: t('settings.slow'),
        reload: t('settings.reloadStudio'),
        fallback: t('settings.fallback'),
      },
      config.app.baseURL,
    )
  }
  import.meta.hot?.on('studio:restarting', start)
  const saved = sessionStorage.getItem('design-studio:settings-saved')
  if (saved) {
    sessionStorage.removeItem('design-studio:settings-saved')
    useToast().add({ title: useNuxtApp().$i18n.t('settings.saved') })
  }
  onNuxtReady(() => {
    if (!sessionStorage.getItem('design-studio:restart-ready')) return
    sessionStorage.removeItem('design-studio:restart-ready')
    sessionStorage.removeItem('design-studio:restart')
    const cover = document.getElementById('studio-restart')
    if (cover) {
      cover.style.opacity = '0'
      setTimeout(
        () => cover.remove(),
        matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150,
      )
    }
    for (const child of document.body.children)
      if (child instanceof HTMLElement) child.inert = false
  })
})
