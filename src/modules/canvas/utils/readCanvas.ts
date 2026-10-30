import urls from 'virtual:studio-module-data'
import type { ArtifactSource } from '../../../../tooling/files/source'
import { requestJson } from '../../../../app/utils/studioRequest'

export interface CanvasText {
  text: string
  /** The file's version, for saving over it. Empty on the deployed site. */
  version: string
  /** Whether you may change it; the deployed site is always read-only. */
  editable: boolean
}

let bundled: Promise<Record<string, string>> | undefined

/**
 * A canvas's text. Locally the dev server reads the file, so an agent's
 * changes show, and decides whether you may edit it (your own prototype,
 * or any as an Admin). The deployed site has the committed files bundled.
 */
export async function readCanvas(
  base: string,
  prototypeId: string,
  artifactId: string,
): Promise<CanvasText> {
  if (import.meta.dev) {
    const source = await requestJson<ArtifactSource>(
      `${base}_studio/files/source?${new URLSearchParams({
        prototype: prototypeId,
        artifact: artifactId,
      })}`,
    )
    return {
      text: source.content,
      version: source.version,
      editable: source.editable,
    }
  }
  bundled ??= fetch(urls['canvas/files']!).then((response) => {
    if (!response.ok) throw new Error('The studio’s canvases failed to load.')
    return response.json() as Promise<Record<string, string>>
  })
  bundled.catch(() => (bundled = undefined))
  const text = (await bundled)[artifactId]
  if (text === undefined) throw new Error('This canvas isn’t in the build.')
  return { text, version: '', editable: false }
}
