// The canvas editor: Excalidraw with the studio's menu, shortcuts, sticky
// notes, tooltips and look. The Vue page around it owns the opening, the
// empty hint and the colour mode; this owns the scene. Saving comes with the
// canvas's file service.
import {
  Excalidraw,
  FONT_FAMILY,
  restoreElements,
} from '@excalidraw/excalidraw'
import type {
  ExcalidrawElement,
  NonDeleted,
} from '@excalidraw/excalidraw/element/types'
import type {
  AppState,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  LibraryItems,
} from '@excalidraw/excalidraw/types'
import {
  createElement as h,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import type { Stored } from '../types/canvas/format'
import {
  CAMERA_SAVE_DELAY_MS,
  initialCamera,
  storedCamera,
  type Camera,
} from '../utils/camera'
import { ControlTooltip } from './ControlTooltip'
import { pruneHelpDialog } from './helpDialog'
import { CanvasMenu, UI_OPTIONS, type MenuLabels } from './menu'
import { useCanvasShortcuts } from './shortcuts'
import { STICKY_IDS, STICKY_LIBRARY } from './stickyNotes'

/** What the Vue page can ask of an open editor. */
export interface CanvasHandle {
  /**
   * The live previews visible in the first view, which may hold the reveal
   * for a moment. None until canvases show live previews.
   */
  openingEmbeds: () => string[]
}

export interface CanvasEditorProps {
  /** The stored elements, as the file holds them. */
  elements: Stored[]
  background: string
  gridSize: number | null
  editable: boolean
  dark: boolean
  /** The app's address, for turning stored links into whole URLs. */
  base: string
  /** Where this browser remembers the camera. */
  cameraKey: string
  labels: MenuLabels
  onReady: (handle: CanvasHandle) => void
  onEmptyChange: (empty: boolean) => void
}

// Stored links are addresses in the studio; Excalidraw wants whole URLs.
function withOrigin(elements: Stored[], base: string): Stored[] {
  const prefix = `${window.location.origin}${base.replace(/\/$/, '')}`
  return elements.map((element) =>
    typeof element.link === 'string' &&
    element.link.startsWith('/') &&
    !element.link.startsWith('//')
      ? { ...element, link: `${prefix}${element.link}` }
      : element,
  )
}

const live = (elements: readonly ExcalidrawElement[]) =>
  elements.some((element) => !element.isDeleted)

// Items on a canvas are embeds, not styleable shapes.
const onlyItemsSelected = (
  elements: readonly ExcalidrawElement[],
  state: AppState,
) => {
  const selected = elements.filter(
    (element) => state.selectedElementIds[element.id],
  )
  return (
    selected.length > 0 &&
    selected.every((element) => element.type === 'embeddable')
  )
}

// Remembers the camera a moment after it stops moving, and on leaving.
function useRememberCamera(key: string) {
  const timer = useRef(0)
  const pending = useRef<Camera | null>(null)
  const write = useCallback(() => {
    window.clearTimeout(timer.current)
    const camera = pending.current
    pending.current = null
    if (!camera) return
    try {
      localStorage.setItem(key, storedCamera(camera))
    } catch {
      // Storage is full or off.
    }
  }, [key])
  useEffect(() => write, [write])
  return useCallback(
    (scrollX: number, scrollY: number, zoom: { value: number }) => {
      window.clearTimeout(timer.current)
      pending.current = { scrollX, scrollY, zoom }
      timer.current = window.setTimeout(write, CAMERA_SAVE_DELAY_MS)
    },
    [write],
  )
}

// Excalidraw's own wheel handler ignores HTML links, so gestures over an
// item's linked title bar are passed on to the drawing surface: they pan
// and zoom as they do anywhere else, and a click still opens the item.
function useWheelOverTitleBars(
  container: RefObject<HTMLDivElement | null>,
  api: ExcalidrawImperativeAPI | null,
) {
  useEffect(() => {
    const element = container.current
    if (!element || !api) return undefined
    const onWheel = (event: WheelEvent) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest('[data-canvas-frame] [data-open]')
      )
        return
      const surface = element.querySelector('canvas.interactive')
      if (!surface) return
      event.preventDefault()
      event.stopPropagation()
      surface.dispatchEvent(
        new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          deltaX: event.deltaX,
          deltaY: event.deltaY,
          deltaZ: event.deltaZ,
          deltaMode: event.deltaMode,
          clientX: event.clientX,
          clientY: event.clientY,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
        }),
      )
    }
    element.addEventListener('wheel', onWheel, {
      capture: true,
      passive: false,
    })
    return () => element.removeEventListener('wheel', onWheel, true)
  }, [api, container])
}

export function CanvasEditor(props: CanvasEditorProps) {
  const { editable, dark, labels } = props
  const container = useRef<HTMLDivElement>(null)
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const [itemsOnly, setItemsOnly] = useState(false)
  const empty = useRef<boolean | null>(null)
  const onScrollChange = useRememberCamera(props.cameraKey)
  const { controlsHidden, toggleControls, onPointerUpdate } =
    useCanvasShortcuts(api, container, { editable })
  useWheelOverTitleBars(container, api)
  useEffect(pruneHelpDialog, [])

  // The opening camera needs the container's size, so Excalidraw mounts
  // once that is known.
  const [initialData, setInitialData] =
    useState<ExcalidrawInitialDataState | null>(null)
  useLayoutEffect(() => {
    const elements = restoreElements(
      withOrigin(props.elements, props.base) as never,
      null,
      { refreshDimensions: true },
    ) as NonDeleted<ExcalidrawElement>[]
    const rect = container.current?.getBoundingClientRect()
    let saved: string | null = null
    try {
      saved = localStorage.getItem(props.cameraKey)
    } catch {
      // Storage is off: fit instead.
    }
    const camera = initialCamera(elements, saved, {
      width: rect?.width ?? 0,
      height: rect?.height ?? 0,
    })
    setInitialData({
      elements,
      appState: {
        theme: dark ? 'dark' : 'light',
        viewBackgroundColor: props.background,
        gridSize: props.gridSize ?? undefined,
        currentItemFontFamily: FONT_FAMILY.Nunito,
        ...camera,
      } as ExcalidrawInitialDataState['appState'],
      // Only the studio's own items: sticky notes.
      libraryItems: STICKY_LIBRARY as unknown as LibraryItems,
    })
    // The editor opens once; a new file starts a new editor.
  }, [])

  const { onReady, onEmptyChange } = props
  useEffect(() => {
    if (api) onReady({ openingEmbeds: () => [] })
  }, [api, onReady])

  const onChange = useCallback(
    (elements: readonly ExcalidrawElement[], state: AppState) => {
      if (!api) return
      // Previews are pictures: never activate one for interaction.
      if (state.activeEmbeddable)
        api.updateScene({ appState: { activeEmbeddable: null } })
      setItemsOnly(onlyItemsSelected(elements, state))
      const now = !live(elements)
      if (empty.current !== now) {
        empty.current = now
        onEmptyChange(now)
      }
    },
    [api, onEmptyChange],
  )

  // Only the studio's sticky notes are in the library: anything else added
  // is dropped.
  const onLibraryChange = useCallback(
    (items: LibraryItems) => {
      if (!api || items.every((entry) => STICKY_IDS.has(entry.id))) return
      void api.updateLibrary({
        libraryItems: STICKY_LIBRARY as unknown as LibraryItems,
        merge: false,
      })
    },
    [api],
  )

  return h(
    'div',
    {
      ref: container,
      className: 'canvas-editor absolute inset-0',
      'data-items-only': itemsOnly ? '' : undefined,
      'data-controls-hidden': controlsHidden ? '' : undefined,
    },
    initialData &&
      h(
        Excalidraw,
        {
          initialData,
          excalidrawAPI: setApi,
          onChange,
          onPointerUpdate,
          onScrollChange,
          onLibraryChange,
          // Live previews and cards come with canvas embeds; until then an
          // item shows as a quiet placeholder rather than a page of its own.
          validateEmbeddable: true,
          renderEmbeddable: () =>
            h('div', {
              className: 'size-full rounded-md border border-default bg-muted',
            }),
          UIOptions: UI_OPTIONS,
          viewModeEnabled: !editable,
          theme: dark ? 'dark' : 'light',
        },
        h(CanvasMenu, {
          api,
          controlsHidden,
          onToggleControls: toggleControls,
          editable,
          labels,
        }),
      ),
    h(ControlTooltip, { container }),
  )
}
