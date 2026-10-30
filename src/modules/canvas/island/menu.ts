// The canvas's menu and the parts of Excalidraw's UI it keeps. It removes only
// what would do harm ("Open" replaces the canvas with a file, "Reset the
// canvas" wipes it) or has its own control elsewhere (export; light and dark
// follow the studio's colour mode). Help, Undo and Redo live only in this
// menu (their corner buttons are hidden in canvas.css). A canvas you can't
// edit keeps only Hide controls: the rest would change it.
import { MainMenu } from '@excalidraw/excalidraw'
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
} from '@excalidraw/excalidraw/types'
import { createElement as h, useEffect, useState, type ReactNode } from 'react'
import { onApple, shortcutLabel } from '../../../../app/utils/shortcuts'

export const UI_OPTIONS: ExcalidrawProps['UIOptions'] = {
  canvasActions: {
    loadScene: false,
    clearCanvas: false,
    saveToActiveFile: false,
    export: false,
    // Also turns off its shortcut; the `theme` prop follows the studio.
    toggleTheme: false,
  },
  // No images on a canvas: Excalidraw stores an image's bytes inside the
  // canvas file. This one flag also turns off the toolbar button, the 9
  // shortcut, and pasting and dropping images. The other guards: the stored
  // form drops them, and the build's check refuses them.
  tools: { image: false },
}

/** The menu's words, from the studio's locale. */
export interface MenuLabels {
  undo: string
  redo: string
  grid: string
  snap: string
  hideControls: string
  showControls: string
}

const key = (apple: string, other: string) => (onApple() ? apple : other)

// Grid and snap to objects are personal view settings (never saved in the
// file) and mutually exclusive: turning one on turns the other off, as their
// own shortcuts do. Read from the API, so the checks stay right when a
// shortcut is used instead of the menu.
function useAlignment(api: ExcalidrawImperativeAPI | null) {
  const read = () => ({
    grid: Boolean(api?.getAppState().gridModeEnabled),
    snap: Boolean(api?.getAppState().objectsSnapModeEnabled),
  })
  const [modes, setModes] = useState(read)
  useEffect(() => {
    if (!api) return undefined
    setModes(read())
    return api.onChange((_elements, state) => {
      const next = {
        grid: Boolean(state.gridModeEnabled),
        snap: Boolean(state.objectsSnapModeEnabled),
      }
      setModes((previous) =>
        previous.grid === next.grid && previous.snap === next.snap
          ? previous
          : next,
      )
    })
    // `read` only reads the API.
  }, [api])
  return modes
}

// Excalidraw has no undo or redo API; its footer buttons (hidden) still run
// its history, so pressing them keeps its exact rules for what is undoable.
const pressHistory = (testId: string) =>
  document
    .querySelector<HTMLElement>(`.canvas [data-testid="${testId}"]`)
    ?.click()

const svg = (
  paths: ReactNode,
  options: { flip?: boolean; box?: number } = {},
) =>
  h(
    'svg',
    {
      viewBox: `0 0 ${options.box ?? 20} ${options.box ?? 20}`,
      width: 20,
      height: 20,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: options.box ? 1.5 : 1.25,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
      style: options.flip ? { transform: 'scaleX(-1)' } : undefined,
    },
    paths,
  )
const gridIcon = () =>
  svg(
    h('path', {
      d: 'M3.333 3.333h13.334v13.334H3.333zM3.333 8.333h13.334M3.333 12.5h13.334M8.333 3.333v13.334M12.5 3.333v13.334',
    }),
  )
const snapIcon = () =>
  svg(
    h('path', {
      d: 'M4.167 10a5.833 5.833 0 0 1 11.666 0v5.833h-3.333V10a2.5 2.5 0 0 0-5 0v5.833H4.167zM4.167 12.5H7.5M12.5 12.5h3.333',
    }),
  )
const undoIcon = (redo = false) =>
  svg(
    h('path', {
      d: 'M7.5 10.833 4.167 7.5 7.5 4.167M4.167 7.5h9.166a3.333 3.333 0 0 1 0 6.667H12.5',
    }),
    { flip: redo },
  )
const eyeIcon = (off: boolean) =>
  svg(
    [
      h('path', {
        key: 'eye',
        d: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z',
      }),
      h('circle', { key: 'pupil', cx: 12, cy: 12, r: 3 }),
      off ? h('path', { key: 'off', d: 'M4 4l16 16' }) : null,
    ],
    { box: 24 },
  )

export function CanvasMenu({
  api,
  controlsHidden,
  onToggleControls,
  editable,
  labels,
}: {
  api: ExcalidrawImperativeAPI | null
  controlsHidden: boolean
  onToggleControls: () => void
  editable: boolean
  labels: MenuLabels
}) {
  const { grid, snap } = useAlignment(api)
  const hide = h(MainMenu.Item, {
    key: 'hide',
    onSelect: onToggleControls,
    shortcut: key('⌘.', 'Ctrl+.'),
    icon: eyeIcon(!controlsHidden),
    children: controlsHidden ? labels.showControls : labels.hideControls,
  })
  if (!editable) return h(MainMenu, null, hide)
  return h(
    MainMenu,
    null,
    h(MainMenu.Item, {
      onSelect: () => pressHistory('button-undo'),
      shortcut: key('⌘Z', 'Ctrl+Z'),
      icon: undoIcon(),
      children: labels.undo,
    }),
    h(MainMenu.Item, {
      onSelect: () => pressHistory('button-redo'),
      shortcut: key('⇧⌘Z', 'Ctrl+Shift+Z'),
      icon: undoIcon(true),
      children: labels.redo,
    }),
    h(MainMenu.Separator),
    h(MainMenu.Item, {
      onSelect: () =>
        api?.updateScene({
          appState: { gridModeEnabled: !grid, objectsSnapModeEnabled: false },
        }),
      shortcut: shortcutLabel('grid'),
      icon: gridIcon(),
      selected: grid,
      'aria-pressed': grid,
      children: labels.grid,
    }),
    h(MainMenu.Item, {
      onSelect: () =>
        api?.updateScene({
          appState: { objectsSnapModeEnabled: !snap, gridModeEnabled: false },
        }),
      shortcut: key('⌥S', 'Alt+S'),
      icon: snapIcon(),
      selected: snap,
      'aria-pressed': snap,
      children: labels.snap,
    }),
    h(MainMenu.Separator),
    h(MainMenu.DefaultItems.Help),
    hide,
    h(MainMenu.DefaultItems.ChangeCanvasBackground),
  )
}
