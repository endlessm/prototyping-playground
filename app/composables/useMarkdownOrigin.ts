import types from '#studio/file-types'
import type { InjectionKey } from 'vue'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../tooling/manifest/build'
import { resolveReference } from '../utils/artifactReference'

/** The prototype artifact a Markdown reader shows, for its links and embeds. */
export interface MarkdownOrigin {
  prototype: ManifestPrototype
  artifact: ManifestArtifact
  /** The prototype's artifacts. */
  artifacts: ManifestArtifact[]
}

const ORIGIN: InjectionKey<() => MarkdownOrigin | undefined> =
  Symbol('markdown-origin')
const LINKS: InjectionKey<(href: string) => string | undefined> =
  Symbol('markdown-links')

const extensions = Object.values(types).flatMap((type) => type.extensions)

/** Gives the reader below this component its document's prototype. */
export function provideMarkdownOrigin(
  origin: () => MarkdownOrigin | undefined,
) {
  provide(ORIGIN, origin)
}

/**
 * Gives the reader below this component the studio address of a relative
 * link, when it has one: the Manual and Context & Skills open the guidance
 * files they link to in the documentation browser.
 */
export function provideMarkdownLinks(
  resolve: (href: string) => string | undefined,
) {
  provide(LINKS, resolve)
}

/** The studio address its reader gives a relative link, if any. */
export function useMarkdownLinks() {
  return inject(LINKS, () => undefined)
}

/**
 * The document's prototype, if the reader shows one (the Manual's pages have
 * none), and what a link or embed in it points at.
 */
export function useMarkdownOrigin() {
  const origin = inject(ORIGIN, () => undefined)
  return {
    origin: computed(origin),
    resolve(reference: string, extension: 'required' | 'optional') {
      const current = origin()
      if (!current) return undefined
      return resolveReference(reference, current, current.artifacts, {
        extension,
        extensions,
        presentation: (type) => (types[type]?.embed ? 'preview' : 'card'),
      })
    },
  }
}
