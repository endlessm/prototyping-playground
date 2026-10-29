// What a document's link or embed points at. References reach only the
// artifacts of the document's own prototype: a path relative to the
// document (`./flows/Sign in.vue`, `../notes/Brief`) or a permanent address
// (`/prototypes/<prototype-id>/artifacts/<artifact-id>`, a view's named
// state's too). A path leaving the prototype or entering its helpers (`_…`)
// is refused, and so is another prototype's address. Framework-neutral, so
// the rules are tested alone.
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../tooling/manifest/build'

export type ReferenceProblem =
  /** Not a file inside this prototype. */
  | 'invalid_reference'
  /** Inside the prototype, but no such artifact. */
  | 'not_found'
  /** No enabled file type opens a file like it. */
  | 'unavailable'
  /** Its type's module is turned off. */
  | 'inactive_format'
  /** A permanent address in another prototype. */
  | 'elsewhere'

export type ReferenceResolution =
  | {
      state: 'resolved'
      artifact: ManifestArtifact
      /** Whether its type has a preview for documents, or shows as a card. */
      presentation: 'preview' | 'card'
    }
  | { state: 'unavailable'; code: ReferenceProblem }

export interface ReferenceOptions {
  /** Embeds name the file with its extension; links may leave it out. */
  extension: 'required' | 'optional'
  /** How an artifact of each type shows embedded in a document. */
  presentation: (type: string) => 'preview' | 'card'
  /** The enabled file types' extensions, such as `.vue`. */
  extensions: string[]
}

const PERMANENT = /^\/prototypes\/([^/?#]+)\/artifacts\/([^/?#]+)\/?(?:[?#]|$)/

const problem = (code: ReferenceProblem): ReferenceResolution => ({
  state: 'unavailable',
  code,
})

/** The path inside the prototype a relative reference names, or null. */
function insidePath(reference: string, folder: string) {
  const path = reference.replace(/[?#].*$/, '')
  if (!path || path.startsWith('/') || path.includes('\\')) return null
  const parts = folder ? folder.split('/') : []
  for (const raw of path.split('/')) {
    let part: string
    try {
      part = decodeURIComponent(raw)
    } catch {
      return null
    }
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (!parts.length) return null
      parts.pop()
      continue
    }
    if (part.startsWith('_') || /[\\/]/.test(part)) return null
    parts.push(part)
  }
  return parts.length ? parts.join('/') : null
}

export function resolveReference(
  reference: string,
  origin: { prototype: ManifestPrototype; artifact: ManifestArtifact },
  artifacts: ManifestArtifact[],
  options: ReferenceOptions,
): ReferenceResolution {
  const found = (artifact: ManifestArtifact): ReferenceResolution =>
    artifact.unavailable
      ? problem('inactive_format')
      : {
          state: 'resolved',
          artifact,
          presentation: options.presentation(artifact.type),
        }

  const permanent = PERMANENT.exec(reference)
  if (permanent) {
    if (permanent[1] !== origin.prototype.id) return problem('elsewhere')
    const id = permanent[2]
    for (const artifact of artifacts) {
      if (artifact.id === id) return found(artifact)
      // A view's named state shows as its view in that state, which the
      // preview document opens by the state's ID.
      const state = artifact.states?.find((entry) => entry.id === id)
      if (state)
        return found({
          ...artifact,
          id: state.id,
          title: `${artifact.title} · ${state.title}`,
        })
    }
    return problem('not_found')
  }
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(reference))
    return problem('invalid_reference')

  const document = origin.artifact.path
  const folder = document.includes('/')
    ? document.slice(0, document.lastIndexOf('/'))
    : ''
  const inside = insidePath(reference, folder)
  if (!inside) return problem('invalid_reference')
  const extension = /\.[a-z0-9]+$/i.exec(inside)?.[0].toLowerCase()
  if (!extension && options.extension === 'required')
    return problem('invalid_reference')

  const file = `${origin.prototype.folder}/${inside}`
  const artifact = artifacts.find((entry) =>
    extension ? entry.file === file : entry.path === inside,
  )
  if (artifact) return found(artifact)
  return extension && !options.extensions.includes(extension)
    ? problem('unavailable')
    : problem('not_found')
}
