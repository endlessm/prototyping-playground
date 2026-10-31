// What the canvas tools know about the studio around a canvas, built from
// the manifest: its own prototype's artifacts and named states, by their
// permanent addresses. The command line and the open canvas build it the
// same way, so the tools answer the same in both. Imports only types, so
// Node runs it as is.
import type { ManifestArtifact } from '../../../../tooling/manifest/build.ts'
import type { ArtifactInfo, Ctx } from './tools.ts'

export interface ToolContextOptions {
  /** The canvas's prototype: its permanent ID and its folder. */
  prototype: { id: string; folder: string }
  /** Its artifacts, as the manifest has them now. */
  artifacts: () => readonly ManifestArtifact[]
  /** A file type's label, and whether it shows as a live preview on a canvas. */
  typeOf: (type: string) => { label: string; preview: boolean } | undefined
}

const ADDRESS = /\/prototypes\/([^/?#]+)\/artifacts\/([^/?#]+)\/?$/

/**
 * The permanent address of an artifact a link names, or null: an address
 * itself, or a whole URL into a studio under any base path.
 */
export function addressOf(link: string): string | null {
  let pathname = link
  if (!link.startsWith('/')) {
    try {
      pathname = new URL(link).pathname
    } catch {
      return null
    }
  } else if (link.startsWith('//')) return null
  const found = ADDRESS.exec(pathname.replace(/[?#].*$/, ''))
  return found ? `/prototypes/${found[1]}/artifacts/${found[2]}` : null
}

export function toolContext(options: ToolContextOptions): Ctx {
  const base = `/prototypes/${options.prototype.id}`
  const prefix = `${options.prototype.folder}/`
  const address = (id: string) => `${base}/artifacts/${id}`

  const infoOf = (
    artifact: ManifestArtifact,
    path = address(artifact.id),
    state?: string,
  ): ArtifactInfo => {
    const type = options.typeOf(artifact.type)
    return {
      path,
      sourcePath: artifact.file.startsWith(prefix)
        ? artifact.file.slice(prefix.length)
        : artifact.path,
      title: artifact.title,
      type: artifact.type,
      typeLabel: type?.label ?? 'File',
      preview: type?.preview ?? false,
      ...(state !== undefined ? { state } : {}),
      ...(artifact.states?.length
        ? {
            states: artifact.states.map((each) => ({
              title: each.title,
              path: address(each.id),
            })),
          }
        : {}),
    }
  }

  const ctx: Ctx = {
    base,
    artifact(path) {
      // A canvas shows only its own prototype's artifacts.
      if (!path.startsWith(`${base}/artifacts/`)) return null
      const id = path.slice(`${base}/artifacts/`.length)
      for (const artifact of options.artifacts()) {
        if (artifact.unavailable) continue
        if (artifact.id === id) return infoOf(artifact, path)
        // A view's named state resolves to its view, as that state.
        const state = artifact.states?.find((each) => each.id === id)
        if (state) return infoOf(artifact, path, state.title)
      }
      return null
    },
    artifacts: () =>
      options
        .artifacts()
        .filter((artifact) => !artifact.unavailable)
        .map((artifact) => infoOf(artifact)),
    linkPath: addressOf,
  }
  return ctx
}
