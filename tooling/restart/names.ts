// Names the dev server, the browser's restart handoff and the tests share, so
// they can't drift apart.

/** The dev server's announcement, over its socket, that it is restarting. */
export const RESTART_EVENT = 'studio:restarting'

/**
 * The dev server's announcement that a change it heard of needs no restart
 * after all: the files are back as it found them.
 */
export const NO_RESTART_EVENT = 'studio:not-restarting'

/**
 * The meta tag naming the dev server that served a page. Nuxt's
 * configuration module carries it too, so the application can name the
 * server its code came from.
 */
export const IDENTITY_TAG = 'studio-instance'

/**
 * The light check, under the studio's base: answers `{ instance }`, the dev
 * server answering now.
 */
export const LIGHT_CHECK = '_studio/settings'

/** Where a page keeps its restart handoff, for the application to drive. */
export const HANDOFF_GLOBAL = '__studioRestartHandoff'

/** The tab's pending handoff, in session storage. */
export const HANDOFF_KEY = 'design-studio:restart'
