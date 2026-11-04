// A canvas inside a document: a fitted, read-only picture of the whole
// scene. The same Excalidraw as the canvas page, with no toolbar, menu,
// saving, remembered camera or agent tools, and no pointer input. Items are
// drawn by the Vue page, all live at once (a document holds few).
import {
  CaptureUpdateAction,
  Excalidraw,
  FONT_FAMILY,
} from '@excalidraw/excalidraw'
import type {
  ExcalidrawElement,
  NonDeleted,
} from '@excalidraw/excalidraw/element/types'
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types'
import {
  createElement as h,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  itemAddress,
  type ParsedCanvas,
  type StoredImage,
} from '../types/canvas/format'
import type { CanvasPicture } from '../utils/canvasImages'
import { initialCamera } from '../utils/camera'
import { openingEmbedIds } from '../utils/embeds'
import {
  addMissingImages,
  ItemBox,
  restored,
  type CanvasItemHost,
} from './Editor'

/** What the Vue page can ask of a preview. */
export interface CanvasPreviewHandle {
  /** The live previews in view, which may hold the reveal for a moment. */
  openingEmbeds: () => string[]
}

export interface CanvasPreviewProps {
  file: ParsedCanvas
  dark: boolean
  /** The app's address, for turning stored links into whole URLs. */
  base: string
  width: number
  height: number
  items: CanvasItemHost
  /** Fetches stored pictures; a missing one is left out. */
  loadImages: (wanted: StoredImage[]) => Promise<CanvasPicture[]>
  onReady: (handle: CanvasPreviewHandle) => void
}

export function CanvasPreview(props: CanvasPreviewProps) {
  const { file, dark, base, width, height, items, onReady, loadImages } = props
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const elements = useMemo(
    () =>
      restored(file.elements, base, items) as NonDeleted<ExcalidrawElement>[],
    [file, base, items],
  )
  // The whole scene, 90% of the frame, never above 100%.
  const camera = useMemo(
    () =>
      initialCamera(elements, null, { width, height }) ?? {
        scrollX: 0,
        scrollY: 0,
        zoom: { value: 1 },
      },
    [elements, width, height],
  )
  const initialData = useRef<ExcalidrawInitialDataState>({
    elements,
    appState: {
      theme: dark ? 'dark' : 'light',
      viewBackgroundColor: file.background,
      currentItemFontFamily: FONT_FAMILY.Nunito,
      ...camera,
    } as ExcalidrawInitialDataState['appState'],
  })

  useEffect(() => {
    if (!api) return
    onReady({
      openingEmbeds: () =>
        openingEmbedIds(
          api.getSceneElements(),
          api.getAppState(),
          items.preview,
        ),
    })
  }, [api, onReady, items])

  // A newer file, or a new size, shows without an opening of its own.
  const first = useRef(true)
  useEffect(() => {
    if (!api) return
    if (first.current) {
      first.current = false
      return
    }
    api.updateScene({
      elements,
      appState: {
        viewBackgroundColor: file.background,
        ...camera,
      } as never,
      captureUpdate: CaptureUpdateAction.NEVER,
    })
  }, [api, elements, camera, file.background])

  // The pictures its images show, as it opens and as its file changes.
  useEffect(() => {
    if (api) addMissingImages(api, file.files, loadImages)
  }, [api, elements, file.files, loadImages])

  const validateEmbeddable = useCallback(
    (link: string) => itemAddress(link, window.location.origin, base) !== null,
    [base],
  )
  const renderEmbeddable = useCallback(
    (element: NonDeleted<ExcalidrawElement>) =>
      h(ItemBox, {
        key: element.id,
        id: element.id,
        host: items,
        link: element.link ?? '',
        width: element.width,
        height: element.height,
        offscreen: false,
        overview: false,
        mounted: true,
      }),
    [items],
  )

  return h(
    'div',
    { className: 'canvas-editor absolute inset-0', 'data-controls-hidden': '' },
    h(Excalidraw, {
      initialData: initialData.current,
      excalidrawAPI: setApi,
      validateEmbeddable,
      renderEmbeddable,
      viewModeEnabled: true,
      zenModeEnabled: true,
      theme: dark ? 'dark' : 'light',
    }),
  )
}
