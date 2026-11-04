// The canvas editor: Excalidraw with the studio's menu, shortcuts, sticky
// notes, tooltips and look. The Vue page around it owns the opening, the
// empty hint and saving; this owns the scene, reports its
// changes and takes in the file when it changes on disk.
import {
  CaptureUpdateAction,
  Excalidraw,
  FONT_FAMILY,
  getSceneVersion,
  newElementWith,
  reconcileElements,
  restoreElements,
} from '@excalidraw/excalidraw'
import type {
  ExcalidrawElement,
  NonDeleted,
} from '@excalidraw/excalidraw/element/types'
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  LibraryItems,
} from '@excalidraw/excalidraw/types'
import {
  createElement as h,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import {
  itemAddress,
  type ParsedCanvas,
  type Stored,
  type StoredImage,
} from '../types/canvas/format'
import type { CanvasPicture } from '../utils/canvasImages'
import type { CanvasFileOptions, CanvasSnapshot } from '../utils/canvasFile'
import { normalizedItem, openingEmbedIds, renderFlags } from '../utils/embeds'
import {
  MOUNT_INTERVAL_MS,
  SWEEP_INTERVAL_MS,
  createMountGate,
  pickEvictions,
} from '../utils/liveViews'
import { mergeRemote } from '../utils/mergeRemote'
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
   * for a moment.
   */
  openingEmbeds: () => string[]
  /** The scene version of the file as loaded, before any edit. */
  loadedVersion: number
  /** Puts a newer file into the scene, outside the undo history. */
  take: CanvasFileOptions['take']
  /** Excalidraw's own API, for the agent tools (`agent.ts`). */
  api: ExcalidrawImperativeAPI
}

/** How an item on the canvas is drawn, as the Vue page renders it. */
export interface CanvasItemState {
  /** The item's link, a whole URL into this studio. */
  link: string
  width: number
  height: number
  /** Far off screen: not painted, but still running. */
  offscreen: boolean
  /** Zoomed out too far to read: its name instead. */
  overview: boolean
  /** Its preview is live; before that, a sized placeholder. */
  mounted: boolean
}

/**
 * Where the Vue page draws items: Excalidraw gives each item a box, and the
 * page renders the item into it with the studio's own context (router,
 * i18n, manifest).
 */
export interface CanvasItemHost {
  show: (id: string, box: HTMLElement, state: CanvasItemState) => void
  hide: (id: string, box: HTMLElement) => void
  /** Whether a link shows as a live preview, rather than a card. */
  preview: (link: string) => boolean
}

export interface CanvasEditorProps {
  /** The stored elements, as the file holds them. */
  elements: Stored[]
  /** The pictures the file names, by file id. */
  files: Record<string, StoredImage>
  /** Fetches stored pictures; a missing one is left out. */
  loadImages: (wanted: StoredImage[]) => Promise<CanvasPicture[]>
  background: string
  gridSize: number | null
  editable: boolean
  /** The app's address, for turning stored links into whole URLs. */
  base: string
  /** Where this browser remembers the camera. */
  cameraKey: string
  labels: MenuLabels
  items: CanvasItemHost
  onReady: (handle: CanvasHandle) => void
  onEmptyChange: (empty: boolean) => void
  /** Every change Excalidraw reports, with its scene version. */
  onSceneChange: (snapshot: CanvasSnapshot, sceneVersion: number) => void
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

const snapshotOf = (
  elements: readonly ExcalidrawElement[],
  state: AppState,
  files: BinaryFiles,
): CanvasSnapshot => ({
  elements: elements as unknown as Stored[],
  appState: {
    viewBackgroundColor: state.viewBackgroundColor,
    gridSize: state.gridSize,
  },
  files,
})

/**
 * Gives Excalidraw the stored pictures its images show and it doesn't hold
 * yet. An image whose picture is missing stays a placeholder; nothing about
 * it changes, so opening a canvas never saves it.
 */
export function addMissingImages(
  api: ExcalidrawImperativeAPI,
  files: Readonly<Record<string, StoredImage>>,
  load: (wanted: StoredImage[]) => Promise<CanvasPicture[]>,
) {
  // A file lists only the pictures its images show. Read from the file, not
  // the scene: right after the editor is ready Excalidraw may not have its
  // first elements yet.
  const held = api.getFiles()
  const wanted = Object.values(files).filter((image) => !held[image.id])
  if (!wanted.length) return
  load(wanted).then(
    (pictures) => {
      try {
        if (pictures.length) api.addFiles(pictures as never)
      } catch {
        // The canvas closed meanwhile.
      }
    },
    () => {
      // Unreachable or not stored: the images stay placeholders.
    },
  )
}

// A file's elements as Excalidraw holds them. Items get their look as
// items (an agent may have written them plainly) without a new version:
// that alone is never an edit.
export const restored = (
  elements: Stored[],
  base: string,
  items: CanvasItemHost,
) =>
  (
    restoreElements(withOrigin(elements, base) as never, null, {
      refreshDimensions: true,
    }) as ExcalidrawElement[]
  ).map((element) => {
    if (element.type !== 'embeddable' || !element.link) return element
    const look = normalizedItem(element, items.preview(element.link), false)
    return look ? ({ ...element, ...look } as ExcalidrawElement) : element
  })

// Takes a newer file into the scene: merged with unsaved edits when
// `lastIds` is given, replacing the scene otherwise.
function takeFile(
  api: ExcalidrawImperativeAPI,
  file: ParsedCanvas,
  lastIds: ReadonlySet<string> | null,
  base: string,
  items: CanvasItemHost,
  fromFile: Set<string>,
  loadImages: CanvasEditorProps['loadImages'],
) {
  const remote = restored(file.elements, base, items)
  for (const element of remote) fromFile.add(element.id)
  let elements = remote
  let needsWriteBack = false
  if (lastIds)
    ({ elements, needsWriteBack } = mergeRemote(
      api.getSceneElementsIncludingDeleted(),
      remote,
      lastIds,
      {
        reconcile: (local, theirs) =>
          // Excalidraw's own elements carry their fractional index.
          reconcileElements(
            local as never,
            theirs as never,
            api.getAppState(),
          ) as ExcalidrawElement[],
        deleted: (element) => newElementWith(element, { isDeleted: true }),
      },
    ))
  api.updateScene({
    elements,
    appState: {
      viewBackgroundColor: file.background,
      gridSize: file.gridSize ?? api.getAppState().gridSize,
    },
    captureUpdate: CaptureUpdateAction.NEVER,
  })
  addMissingImages(api, file.files, loadImages)
  const now = api.getSceneElementsIncludingDeleted()
  return {
    needsWriteBack,
    sceneVersion: getSceneVersion(now),
    snapshot: snapshotOf(now, api.getAppState(), api.getFiles()),
  }
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

// Items get their look as items without an undo step of their own. One the
// person just dropped or pasted is also sized and centered, in the same
// step as its placing, so one undo takes it away. Items that came with the
// file (`fromFile`: on opening, or written by an agent meanwhile) keep their
// place and size and get their look outside the history.
function normalizeItems(
  api: ExcalidrawImperativeAPI,
  items: CanvasItemHost,
  fromFile: ReadonlySet<string>,
) {
  let changed = false
  let placed = false
  const next = api.getSceneElementsIncludingDeleted().map((element) => {
    if (element.type !== 'embeddable' || element.isDeleted || !element.link)
      return element
    const patch = normalizedItem(
      element,
      items.preview(element.link),
      !fromFile.has(element.id),
    )
    if (!patch) return element
    changed = true
    if ('width' in patch) placed = true
    return newElementWith(element, patch as never)
  })
  if (changed)
    api.updateScene({
      elements: next,
      captureUpdate: placed
        ? CaptureUpdateAction.IMMEDIATELY
        : CaptureUpdateAction.NEVER,
    })
}

// The box Excalidraw gives an item. The Vue page draws the item into it.
// It re-renders only when the item's own link, size or flags change, never
// on a pan or zoom frame.
export const ItemBox = memo(function ItemBox(
  props: CanvasItemState & { id: string; host: CanvasItemHost },
) {
  const { id, host, link, width, height, offscreen, overview, mounted } = props
  const box = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    host.show(id, box.current!, {
      link,
      width,
      height,
      offscreen,
      overview,
      mounted,
    })
  }, [id, host, link, width, height, offscreen, overview, mounted])
  useLayoutEffect(() => {
    const element = box.current!
    return () => host.hide(id, element)
  }, [id, host])
  return h('div', {
    ref: box,
    className: 'size-full',
    'data-canvas-embed-id': id,
  })
})

// Previews go live as they come near the view, one every 150 ms, and stay
// live until the canvas holds more than MAX_LIVE; then those seen longest
// ago are unloaded, keeping their sized frame. A still canvas doesn't
// re-render, so what is visible is also read on a timer.
function useLiveItems(api: ExcalidrawImperativeAPI | null) {
  const lastSeen = useRef(new Map<string, number>())
  const gate = useRef(createMountGate())
  const admitTimer = useRef(0)
  const [epoch, setEpoch] = useState(0)

  // An item in view: live if it already is or its turn has come.
  const seen = useCallback((id: string) => {
    const now = Date.now()
    if (lastSeen.current.has(id) || gate.current(now))
      lastSeen.current.set(id, now)
    else if (!admitTimer.current)
      admitTimer.current = window.setTimeout(() => {
        admitTimer.current = 0
        setEpoch((n) => n + 1)
      }, MOUNT_INTERVAL_MS)
  }, [])
  const isLive = useCallback((id: string) => lastSeen.current.has(id), [])

  useEffect(() => {
    if (!api) return undefined
    const timer = window.setInterval(() => {
      const live = lastSeen.current
      const state = api.getAppState()
      const items = api
        .getSceneElements()
        .filter((element) => element.type === 'embeddable')
      const visible = new Set<string>()
      const now = Date.now()
      for (const element of items) {
        const { offscreen, overview } = renderFlags(element, state)
        if (offscreen || overview) continue
        visible.add(element.id)
        if (live.has(element.id)) live.set(element.id, now)
      }
      const evict = pickEvictions({
        lastSeen: live,
        visible,
        onCanvas: new Set(items.map((element) => element.id)),
        now,
      })
      if (!evict.length) return
      for (const id of evict) live.delete(id)
      setEpoch((n) => n + 1)
    }, SWEEP_INTERVAL_MS)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(admitTimer.current)
      admitTimer.current = 0
    }
  }, [api])

  return { epoch, seen, isLive }
}

// A read-only canvas takes nothing dropped on it.
function useNoDrops(
  container: RefObject<HTMLDivElement | null>,
  editable: boolean,
) {
  useEffect(() => {
    const element = container.current
    if (!element || editable) return undefined
    const refuse = (event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
    }
    element.addEventListener('drop', refuse, true)
    return () => element.removeEventListener('drop', refuse, true)
  }, [container, editable])
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
  const { editable, labels } = props
  const container = useRef<HTMLDivElement>(null)
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const [itemsOnly, setItemsOnly] = useState(false)
  const empty = useRef<boolean | null>(null)
  const onScrollChange = useRememberCamera(props.cameraKey)
  const { controlsHidden, toggleControls, onPointerUpdate } =
    useCanvasShortcuts(api, container, { editable })
  useWheelOverTitleBars(container, api)
  useNoDrops(container, editable)
  useEffect(pruneHelpDialog, [])
  const { items, base } = props
  const { epoch, seen, isLive } = useLiveItems(api)

  // The opening camera needs the container's size, so Excalidraw mounts
  // once that is known.
  const [initialData, setInitialData] =
    useState<ExcalidrawInitialDataState | null>(null)
  const loadedVersion = useRef(0)
  // The elements that came with the file, as opposed to placed here.
  const fromFile = useRef(new Set<string>())
  useLayoutEffect(() => {
    const elements = restored(
      props.elements,
      props.base,
      props.items,
    ) as NonDeleted<ExcalidrawElement>[]
    loadedVersion.current = getSceneVersion(elements)
    for (const element of elements) fromFile.current.add(element.id)
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

  const { onReady, onEmptyChange, onSceneChange, loadImages } = props
  // Until the editor is ready, scene changes are Excalidraw's own loading.
  const ready = useRef(false)
  useEffect(() => {
    if (!api) return
    ready.current = true
    addMissingImages(api, props.files, loadImages)
    onReady({
      openingEmbeds: () =>
        openingEmbedIds(
          api.getSceneElements(),
          api.getAppState(),
          items.preview,
        ),
      loadedVersion: loadedVersion.current,
      api,
      take: (file, lastIds) => {
        try {
          return takeFile(
            api,
            file,
            lastIds,
            base,
            items,
            fromFile.current,
            loadImages,
          )
        } catch {
          // The canvas closed meanwhile.
          return null
        }
      },
    })
  }, [api, onReady, base, loadImages])

  const lastVersion = useRef(0)
  const onChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      state: AppState,
      files: BinaryFiles,
    ) => {
      if (!api) return
      const version = getSceneVersion(elements)
      onSceneChange(snapshotOf(elements, state, files), version)
      // A new or restyled item becomes an item again. Before the editor is
      // ready, changes are Excalidraw's own loading.
      if (editable && ready.current && version !== lastVersion.current) {
        lastVersion.current = version
        normalizeItems(api, items, fromFile.current)
      }
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
    [api, onEmptyChange, onSceneChange, editable, items],
  )

  const validateEmbeddable = useCallback(
    (link: string) => itemAddress(link, window.location.origin, base) !== null,
    [base],
  )
  // Called on every render, including each pan and zoom frame; the item
  // boxes it returns re-render only when their own state changes. A new
  // epoch admits or unloads previews.
  const renderEmbeddable = useCallback(
    (element: NonDeleted<ExcalidrawElement>, state: AppState) => {
      const { offscreen, overview } = renderFlags(element, state)
      if (!offscreen && !overview) seen(element.id)
      return h(ItemBox, {
        key: element.id,
        id: element.id,
        host: items,
        link: element.link ?? '',
        width: element.width,
        height: element.height,
        offscreen,
        overview,
        mounted: isLive(element.id),
      })
    },
    [items, seen, isLive, epoch],
  )

  // Only the studio's sticky notes are in the library: anything else added
  // is dropped.
  const onLibraryChange = useCallback(
    (library: LibraryItems) => {
      if (!api || library.every((entry) => STICKY_IDS.has(entry.id))) return
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
          // Only links to this studio's artifacts are items; the Vue page
          // draws each into the box Excalidraw gives it.
          validateEmbeddable,
          renderEmbeddable,
          UIOptions: UI_OPTIONS,
          viewModeEnabled: !editable,
          theme: 'light',
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
