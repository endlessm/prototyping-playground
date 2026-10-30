import { useEventListener } from '@vueuse/core'
import { requestJson } from '../../../../app/utils/studioRequest'
import { studioToast } from '../../../../app/utils/toasts'
import CanvasLeaveModal from '../components/CanvasLeaveModal.vue'
import type { CanvasHandle } from '../island/mount'
import { storedLink, stringifyScene } from '../types/canvas/format'
import {
  createCanvasFile,
  type CanvasFile,
  type CanvasSnapshot,
  type SaveState,
} from '../utils/canvasFile'
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

  const read = () =>
    requestJson<{ content: string; version: string }>(
      `${url}?${new URLSearchParams({
        prototype: address.prototype(),
        artifact: address.artifact(),
      })}`,
    )

  /** Starts saving once the editor is open, for a file you may change. */
  function start(handle: CanvasHandle, loaded: CanvasText) {
    if (!import.meta.dev || !loaded.editable || file) return
    path = loaded.path
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
        ),
      read,
      write: (content, base) =>
        requestJson<{ version: string }>(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prototype: address.prototype(),
            artifact: address.artifact(),
            content,
            base,
          }),
        }),
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
  }
}
