// Shared by the preview build, the document's runtime and the studio's pages.

/** The URL segment, under the studio's base path, of preview documents. */
export const PREVIEW_ROUTE = '_preview/'
/** The document of prototypes with no system. */
export const NO_SYSTEM = 'none'
/** The message channel between the studio and a preview document. */
export const PREVIEW_CHANNEL = 'studio-preview'
/** The development address, under a document, that explains why a view failed to compile. */
export const COMPILE_ROUTE = '__studio/compile'

/** Where the studio keeps its color mode: `system`, `light` or `dark`. */
export const COLOR_MODE_KEY = 'design-studio:color-mode'

/**
 * Runs first in a preview document's head. The studio is light only (ADR
 * 0005): a view renders light before its first paint, whatever its system
 * declares or the computer prefers.
 */
export const LIGHT_ONLY_SCRIPT = `document.documentElement.style.colorScheme = 'light'`
