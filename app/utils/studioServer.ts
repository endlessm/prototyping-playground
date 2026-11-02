import { appHead } from '#build/nuxt.config.mjs'
import { devServer, INSTANCE_META } from '../../tooling/settings/restart'

// The dev server whose modules this application runs. Nuxt's configuration
// module carries the instance tag, so it names the server that served the
// application even when the page itself came from another one.
const own: string =
  (appHead.meta as { name?: string; content?: string }[] | undefined)?.find(
    (tag) => tag.name === INSTANCE_META,
  )?.content ?? ''

export const studioServer = devServer(INSTANCE_META, own)
