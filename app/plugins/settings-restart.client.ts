import { earlyRestart, studioServer } from '../../tooling/settings/restart'
export default defineNuxtPlugin(() => {
  if (!import.meta.dev) return
  const config = useRuntimeConfig()
  const { t } = useNuxtApp().$i18n
  // This page heard the restart: it loads again whichever server served it.
  let announced = false
  const start = ({ instance }: { instance: string }) => {
    announced = true
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
      studioServer,
      true,
    )
  }
  import.meta.hot?.on('studio:restarting', start)
  onNuxtReady(() => {
    const from = sessionStorage.getItem('design-studio:restart')
    if (from && announced) return
    // An application from the server that is restarting keeps the cover and
    // loads again once the new one answers, also when the page itself came
    // from the new one.
    if (from && !studioServer.since(from))
      return studioServer.reloadFrom(from, config.app.baseURL, () =>
        Boolean(sessionStorage.getItem('design-studio:restart')),
      )
    sessionStorage.removeItem('design-studio:restart')
    if (sessionStorage.getItem('design-studio:settings-saved')) {
      sessionStorage.removeItem('design-studio:settings-saved')
      useToast().add({ title: t('settings.saved') })
    }
    const cover = document.getElementById('studio-restart')
    if (!cover) return
    cover.style.opacity = '0'
    setTimeout(
      () => cover.remove(),
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150,
    )
    for (const child of document.body.children)
      if (child instanceof HTMLElement) child.inert = false
  })
})
