import { appHead } from '#build/nuxt.config.mjs'
import { devServer, INSTANCE_META } from '../../tooling/settings/restart'

// The dev server whose modules this application runs. Nuxt's configuration
// module carries the instance tag, so it names the server that served the
// application even when the page itself came from another one.
const own: string =
  (appHead.meta as { name?: string; content?: string }[] | undefined)?.find(
    (tag) => tag.name === INSTANCE_META,
  )?.content ?? ''

// The application has started: a page waiting out a restart needn't load
// again for want of one (`awaitApplication`).
if (import.meta.client && own) document.documentElement.dataset.studioApp = own

export const studioServer = devServer(INSTANCE_META, own)
