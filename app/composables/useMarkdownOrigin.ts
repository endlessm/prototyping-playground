import types from '#studio/file-types'
import type { InjectionKey } from 'vue'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../tooling/manifest/build'
import { embedPresentation, resolveReference } from '../utils/artifactReference'

/** The prototype artifact a Markdown reader shows, for its links and embeds. */
export interface MarkdownOrigin {
  prototype: ManifestPrototype
  artifact: ManifestArtifact
  /** The prototype's artifacts. */
  artifacts: ManifestArtifact[]
}

const ORIGIN: InjectionKey<() => MarkdownOrigin | undefined> =
  Symbol('markdown-origin')

const extensions = Object.values(types).flatMap((type) => type.extensions)

/** Gives the reader below this component its document's prototype. */
export function provideMarkdownOrigin(
  origin: () => MarkdownOrigin | undefined,
) {
  provide(ORIGIN, origin)
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
        presentation: (type) => embedPresentation(types[type], 'document'),
      })
    },
  }
}
