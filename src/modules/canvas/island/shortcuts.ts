// Canvas shortcuts on top of Excalidraw's:
//   ⌘. / Ctrl+.    hide or show the canvas's controls
//   ⌘⇧' / Ctrl+⇧'  the grid (⌘' alone is the studio's: the canvas's source)
//   N              a new sticky note at the pointer (or the middle of the
//                  view); only on a canvas you can edit
import { CaptureUpdateAction } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { artifactShortcut } from '../../../../app/utils/shortcuts'
import { noteAt } from './stickyNotes'

// Open menus and dialogs keep the keys. The colour pickers in the style
// panel call themselves dialogs, but they are part of the page.
const overlayOpen = (element: HTMLElement) =>
  [...element.querySelectorAll('[role="dialog"], [role="menu"]')].some(
    (overlay) => !overlay.closest('.selected-shape-actions'),
  )

const typing = (target: EventTarget | null) =>
  (target as HTMLElement | null)?.closest?.(
    'input, textarea, [contenteditable="true"]',
  )

export function useCanvasShortcuts(
  api: ExcalidrawImperativeAPI | null,
  container: RefObject<HTMLElement | null>,
  { editable }: { editable: boolean },
) {
  const [controlsHidden, setControlsHidden] = useState(false)
  const toggleControls = useCallback(
    () => setControlsHidden((hidden) => !hidden),
    [],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== '.' ||
        !(event.metaKey || event.ctrlKey) ||
        typing(event.target)
      )
        return
      event.preventDefault()
      toggleControls()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleControls])

  // The unshifted apostrophe is the studio's (source); the shifted one is
  // handled before Excalidraw, which otherwise takes both for its grid.
  useEffect(() => {
    const element = container.current
    if (!element || !api) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      const action = artifactShortcut(event)
      if (!action || typing(event.target) || overlayOpen(element)) return
      if (action === 'source') {
        // Excalidraw doesn't get it; the studio's own listener already ran.
        event.stopImmediatePropagation()
        return
      }
      event.preventDefault()
      event.stopImmediatePropagation()
      api.updateScene({
        appState: {
          gridModeEnabled: !api.getAppState().gridModeEnabled,
          objectsSnapModeEnabled: false,
        },
        captureUpdate: CaptureUpdateAction.EVENTUALLY,
      })
    }
    element.addEventListener('keydown', onKeyDown, true)
    return () => element.removeEventListener('keydown', onKeyDown, true)
  }, [api, container])

  // The last pointer position in canvas coordinates, for placing notes.
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const onPointerUpdate = useCallback(
    ({ pointer: at }: { pointer: { x: number; y: number } }) => {
      pointer.current = at
    },
    [],
  )

  useEffect(() => {
    const element = container.current
    if (!element || !api || !editable) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'n' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        typing(event.target)
      )
        return
      const state = api.getAppState()
      if (state.editingTextElement) return
      event.preventDefault()
      const zoom = state.zoom.value || 1
      const note = noteAt(
        pointer.current ?? {
          x: -state.scrollX + state.width / zoom / 2,
          y: -state.scrollY + state.height / zoom / 2,
        },
      )
      api.updateScene({
        elements: [...api.getSceneElementsIncludingDeleted(), ...note],
        appState: { selectedElementIds: { [note[0]!.id]: true } },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      })
    }
    element.addEventListener('keydown', onKeyDown, true)
    return () => element.removeEventListener('keydown', onKeyDown, true)
  }, [api, container, editable])

  return { controlsHidden, toggleControls, onPointerUpdate }
}
