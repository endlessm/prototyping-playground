import types from '#studio/file-types'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import {
  embedPresentation,
  resolveReference,
  type ReferenceResolution,
} from '../../../../app/utils/artifactReference'
import type { CanvasItemHost, CanvasItemState } from '../island/mount'
import { itemAddress } from '../types/canvas/format'

const extensions = Object.values(types).flatMap((type) => type.extensions)

/**
 * The items on a canvas, as the Vue page draws them into the boxes
 * Excalidraw gives it: what each link shows, and which boxes are there now.
 * Shared by the canvas page and a canvas's preview in a document.
 */
export function useCanvasItems(options: {
  prototype: () => ManifestPrototype
  artifact: () => ManifestArtifact
  artifacts: Readonly<Ref<readonly ManifestArtifact[]>>
  base: string
}) {
  // What each link shows, kept while the prototype's artifacts stay the
  // same, so an item re-renders only when its own artifact changes.
  const resolutions = computed(() => {
    void options.artifacts.value
    void options.prototype()
    return new Map<string, ReferenceResolution>()
  })
  function resolve(link: string): ReferenceResolution {
    const cache = resolutions.value
    let found = cache.get(link)
    if (!found) {
      found = resolveReference(
        itemAddress(link, location.origin, options.base) ?? link,
        { prototype: options.prototype(), artifact: options.artifact() },
        options.artifacts.value as ManifestArtifact[],
        {
          extension: 'required',
          extensions,
          presentation: (type) => embedPresentation(types[type], 'canvas'),
        },
      )
      cache.set(link, found)
    }
    return found
  }

  // The items Excalidraw has boxes for, by element ID.
  const items = shallowReactive(
    new Map<string, CanvasItemState & { box: HTMLElement }>(),
  )
  const same = (a: CanvasItemState, b: CanvasItemState) =>
    (Object.keys(b) as (keyof CanvasItemState)[]).every(
      (key) => a[key] === b[key],
    )
  const host: CanvasItemHost = {
    show(id, box, state) {
      const current = items.get(id)
      if (current?.box === box && same(current, state)) return
      items.set(id, { ...state, box })
    },
    hide(id, box) {
      if (items.get(id)?.box === box) items.delete(id)
    },
    preview(link) {
      const found = resolve(link)
      return found.state === 'resolved' && found.presentation === 'preview'
    },
  }
  return { items, host, resolve, loadPreviews }
}

/**
 * The code of every preview an item may show, loaded before the editor
 * mounts. A preview then goes live the moment its turn comes (CV-79);
 * otherwise the first one's code is still loading when the next ones are
 * admitted, and they all start at once. Code that fails to load is left to
 * the item, which says so and tries again.
 */
function loadPreviews() {
  return Promise.all(
    Object.values(types).flatMap((type) =>
      type.embed && embedPresentation(type, 'canvas') === 'preview'
        ? [type.embed().catch(() => undefined)]
        : [],
    ),
  )
}
