import {
  OPENING_FRAME_FALLBACK_MS,
  OPENING_STATUS_DELAY_MS,
  OPENING_WAIT_MS,
  openingReady,
  settledEmbeds,
} from '../utils/opening'

/**
 * A canvas's opening: one quiet surface hides the scene while it is set up,
 * its "Opening canvas" status shows after 200 ms, and the scene reveals
 * once. The reveal waits for the opening camera to paint, then for the live
 * previews visible in the first view (`expected`, read once the editor is
 * `ready`), never more than 2 s. Hidden scenes still lay out and load their
 * previews; later changes never hide the scene again.
 */
export function useCanvasOpening(
  container: Readonly<Ref<HTMLElement | null | undefined>>,
  ready: Readonly<Ref<boolean>>,
  expected: () => string[],
) {
  const revealed = ref(false)
  const statusVisible = ref(false)
  const cleanups: (() => void)[] = []
  const clean = () => cleanups.splice(0).forEach((stop) => stop())

  const status = window.setTimeout(
    () => (statusVisible.value = true),
    OPENING_STATUS_DELAY_MS,
  )
  cleanups.push(() => window.clearTimeout(status))

  function finish() {
    if (revealed.value) return
    revealed.value = true
    clean()
  }

  let waiting = false
  watch(
    [ready, container],
    ([isReady, root]) => {
      if (waiting || !isReady || !root || revealed.value) return
      waiting = true
      const started = Date.now()
      let waitingFor: string[] | undefined
      const check = () => {
        if (
          waitingFor &&
          openingReady(waitingFor, settledEmbeds(root), Date.now() - started)
        )
          finish()
      }
      const observer = new MutationObserver(check)
      observer.observe(root, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          'data-preview-state',
          'data-artifact-phase',
          'data-diagram-state',
          'role',
        ],
      })
      const cameraPainted = () => {
        if (waitingFor || revealed.value) return
        waitingFor = expected()
        check()
      }
      let second = 0
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(cameraPainted)
      })
      // Hidden tabs may not run animation frames.
      const frameTimer = window.setTimeout(
        cameraPainted,
        OPENING_FRAME_FALLBACK_MS,
      )
      const deadline = window.setTimeout(finish, OPENING_WAIT_MS)
      cleanups.push(() => {
        observer.disconnect()
        cancelAnimationFrame(first)
        cancelAnimationFrame(second)
        window.clearTimeout(frameTimer)
        window.clearTimeout(deadline)
      })
    },
    { immediate: true, flush: 'post' },
  )

  onScopeDispose(clean)
  return { revealed, statusVisible }
}
