import { appHead } from '#build/nuxt.config.mjs'
import { IDENTITY_TAG } from '../../tooling/restart/names'
import { devServer } from '../../tooling/settings/restart'

/**
 * The dev server whose code this application runs. Nuxt's configuration
 * module carries the identity tag, so it names the server that served the
 * application even when the page itself came from another one.
 */
export const appServer: string =
  (appHead.meta as { name?: string; content?: string }[] | undefined)?.find(
    (tag) => tag.name === IDENTITY_TAG,
  )?.content ?? ''

// The application has started: a page waiting out a restart needn't load
// again for want of one (`awaitApplication`).
if (import.meta.client && appServer)
  document.documentElement.dataset.studioApp = appServer

export const studioServer = devServer(IDENTITY_TAG, appServer)
