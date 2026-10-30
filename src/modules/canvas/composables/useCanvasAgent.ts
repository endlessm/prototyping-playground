import types from '#studio/file-types'
import { embedPresentation } from '../../../../app/utils/artifactReference'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import type { CanvasHandle } from '../island/mount'
import { toolContext } from '../tools/context'

declare global {
  interface Window {
    /** The canvas tools in the open canvas (`island/agent.ts`). */
    __studioCanvas?: import('../island/agent').CanvasAgent
  }
}

/**
 * For an agent with a browser: the canvas tools on `window.__studioCanvas`
 * while this canvas is open, in development only (the deployed site never
 * ships them). They see this prototype's artifacts as the manifest has them
 * now.
 */
export function useCanvasAgent(options: {
  handle: Readonly<Ref<CanvasHandle | undefined>>
  prototype: () => ManifestPrototype
  artifact: () => ManifestArtifact
  artifacts: Readonly<Ref<readonly ManifestArtifact[]>>
  base: string
  editable: () => boolean
  persist: () => Promise<boolean>
}) {
  if (!import.meta.dev) return
  let installed: Window['__studioCanvas']
  let closed = false
  const uninstall = () => {
    if (installed && window.__studioCanvas === installed)
      delete window.__studioCanvas
    installed = undefined
  }
  watch(options.handle, async (handle) => {
    uninstall()
    if (!handle) return
    const { createCanvasAgent } = await import('../island/agent')
    if (closed || options.handle.value !== handle) return
    installed = createCanvasAgent({
      api: handle.api,
      ctx: toolContext({
        prototype: options.prototype(),
        artifacts: () => options.artifacts.value,
        typeOf: (id) => {
          const type = types[id]
          return (
            type && {
              label: type.label,
              preview: embedPresentation(type, 'canvas') === 'preview',
            }
          )
        },
      }),
      file: options.artifact().file,
      base: options.base,
      editable: options.editable,
      persist: options.persist,
    })
    window.__studioCanvas = installed
  })
  onScopeDispose(() => {
    closed = true
    uninstall()
  })
}
