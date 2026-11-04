import { useEventListener } from '@vueuse/core'
import { requestJson } from '../../../../app/utils/studioRequest'
import { studioToast } from '../../../../app/utils/toasts'
import CanvasLeaveModal from '../components/CanvasLeaveModal.vue'
import type { CanvasHandle } from '../island/mount'
import {
  parseCanvas,
  storedImageType,
  storedLink,
  stringifyScene,
  type StoredImage,
} from '../types/canvas/format'
import {
  createCanvasFile,
  type CanvasFile,
  type CanvasSnapshot,
  type SaveState,
} from '../utils/canvasFile'
import { missingImages, pruneImages, storeImage } from '../utils/canvasImages'
import type { CanvasText } from '../utils/readCanvas'

/**
 * Saving an open canvas (dev only, and only when you may change it), and
 * taking in changes made to its file on disk. Edits save by themselves
 * through the file service; the dev server's change notices bring in
 * outside edits. Hiding the tab or leaving saves right away; leaving while
 * a save can't finish asks first, and a reload or closing the tab warns.
 */
export function useCanvasFile(address: {
  base: string
  prototype: () => string
  artifact: () => string
}) {
  const { t } = useI18n()
  const toast = useToast()
  const overlay = useOverlay()
  // Made when first needed: an overlay made at setup renders with the page
  // and holds up the canvas's first paint.
  let leaveModal:
    ReturnType<typeof overlay.create<typeof CanvasLeaveModal>> | undefined
  const url = `${address.base}_studio/files/source`

  const state = ref<SaveState>('saved')
  // Whether the pill shows: an editable canvas that is saving.
  const active = ref(false)
  let file: CanvasFile | undefined
  let path = ''
  // Excalidraw reports changes from its first paint, before the editor's
  // handle arrives: the last one is kept for when saving starts.
  let early: [CanvasSnapshot, number] | undefined
  // Pictures: every one a version of the file named (stored beside it), the
  // ones the file on disk names now, and the pictures the editor holds, for
  // storing new ones before the file names them, so a saved canvas never
  // shows a picture that isn't stored.
  const stored = new Map<string, StoredImage>()
  let named = new Set<string>()
  let pictures: CanvasSnapshot['files'] = {}
  const namedIn = (content: string) => {
    try {
      return parseCanvas(content).files
    } catch {
      // Not a canvas yet: the next read brings it.
      return null
    }
  }
  const remember = (content: string) => {
    const files = namedIn(content)
    if (!files) return
    for (const image of Object.values(files)) stored.set(image.id, image)
    named = new Set(Object.keys(files))
  }

  // The stored pictures, and those the editor holds for its images.
  function filesOf(snapshot: CanvasSnapshot) {
    const files = Object.fromEntries(stored)
    for (const element of snapshot.elements) {
      const id = element.fileId
      if (element.type !== 'image' || typeof id !== 'string') continue
      const picture = snapshot.files?.[id]
      if (picture && !files[id])
        files[id] = { id, mimeType: storedImageType(picture.mimeType) }
    }
    return files
  }

  // Stores the pictures a canvas's text names that aren't stored, asking
  // the dev server each time: a picture this page stored before may have
  // been pruned since (taken off the canvas, then brought back by Undo).
  async function storePictures(content: string) {
    const images = Object.values(parseCanvas(content).files)
    const missing = await missingImages(
      address.base,
      address.prototype(),
      images,
    )
    for (const id of missing) {
      const picture = pictures?.[id]
      if (!picture)
        throw new Error('A picture on this canvas hasn’t loaded yet.')
      await storeImage(address.base, address.prototype(), {
        id,
        mimeType: picture.mimeType,
        dataURL: picture.dataURL,
        created: Date.now(),
      })
    }
  }

  // After a save that stopped showing a picture, the prototype's pictures
  // no canvas shows are removed. A failure leaves them for the next one.
  function written(content: string) {
    const before = named
    remember(content)
    if ([...before].some((id) => !named.has(id)))
      pruneImages(address.base, address.prototype()).catch(() => {})
  }

  const read = async () => {
    const text = await requestJson<{ content: string; version: string }>(
      `${url}?${new URLSearchParams({
        prototype: address.prototype(),
        artifact: address.artifact(),
      })}`,
    )
    remember(text.content)
    return text
  }

  /** Starts saving once the editor is open, for a file you may change. */
  function start(handle: CanvasHandle, loaded: CanvasText) {
    if (!import.meta.dev || !loaded.editable || file) return
    path = loaded.path
    remember(loaded.text)
    // Pictures left by a canvas that was deleted, or by an edit made
    // elsewhere, go when a canvas of the prototype opens for editing.
    pruneImages(address.base, address.prototype()).catch(() => {})
    file = createCanvasFile({
      initial: {
        content: loaded.text,
        version: loaded.version,
        sceneVersion: handle.loadedVersion,
      },
      editable: () => true,
      serialize: (snapshot, studioId) =>
        stringifyScene(
          snapshot.elements,
          snapshot.appState,
          (link) => storedLink(link, window.location.origin, address.base),
          studioId,
          filesOf(snapshot),
        ),
      read,
      write: async (content, base) => {
        await storePictures(content)
        const saved = await requestJson<{ version: string }>(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prototype: address.prototype(),
            artifact: address.artifact(),
            content,
            base,
          }),
        })
        written(content)
        return saved
      },
      take: handle.take,
      onState: (next) => (state.value = next),
      // The notice sits over the status at the bottom right, so it offers
      // Retry too.
      notify: (notice) =>
        toast.add({
          ...studioToast(
            'error',
            t(
              notice === 'keepsChanging'
                ? 'canvas.save.keepsChanging'
                : 'canvas.save.retrying',
            ),
          ),
          actions: [
            {
              label: t('canvas.save.retry'),
              color: 'neutral',
              variant: 'outline',
              onClick: () => file?.retry(),
            },
          ],
        }),
    })
    active.value = true
    if (early) file.changed(...early)
    early = undefined
  }

  function changed(snapshot: CanvasSnapshot, sceneVersion: number) {
    if (snapshot.files) pictures = snapshot.files
    if (file) file.changed(snapshot, sceneVersion)
    else early = [snapshot, sceneVersion]
  }

  if (import.meta.hot) {
    const hot = import.meta.hot
    const onSource = ({ files }: { files: string[] }) => {
      if (file && files.includes(path)) void file.fileChanged()
    }
    // Changes made while the connection was down are not replayed.
    const onConnect = () => void file?.fileChanged()
    hot.on('studio:source', onSource)
    hot.on('vite:ws:connect', onConnect)
    onScopeDispose(() => {
      hot.off('studio:source', onSource)
      hot.off('vite:ws:connect', onConnect)
    })
  }

  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') file?.flush()
  })
  useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
    if (file?.pending()) event.preventDefault()
  })

  // Leaving for another page first finishes saving; if that fails, you
  // choose between staying to retry and discarding the edits.
  async function mayLeave() {
    if (!file?.pending() || (await file.persist())) return true
    leaveModal ??= overlay.create(CanvasLeaveModal)
    const discard = Boolean(await leaveModal.open().result)
    if (discard) file.discard()
    return discard
  }
  onBeforeRouteLeave(mayLeave)
  onBeforeRouteUpdate(mayLeave)

  onScopeDispose(() => {
    file?.flush()
    file?.dispose()
  })

  return {
    state: readonly(state),
    active: readonly(active),
    start,
    changed,
    retry: () => file?.retry(),
    /** Writes the file now; resolves whether nothing is left unsaved. */
    persist: async () => (file ? file.persist() : false),
  }
}
