import { appHead } from '#build/nuxt.config.mjs'
import { IDENTITY_TAG } from '../../tooling/restart/names'

/**
 * The dev server whose code this application runs. Nuxt's configuration
 * module carries the identity tag, so it names the server that served the
 * application even when the page itself came from another one.
 */
export const appServer: string =
  (appHead.meta as { name?: string; content?: string }[] | undefined)?.find(
    (tag) => tag.name === IDENTITY_TAG,
  )?.content ?? ''
