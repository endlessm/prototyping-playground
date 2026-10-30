// Sticky notes: filled squares you write on (double-click, or Enter). They are
// the Library's items (drag one onto the canvas) and the N shortcut. Built in
// code, so there's no library file to vendor. Excalidraw can't draw shadows,
// so a thin edge in a darker shade of the note's own colour gives a soft
// paper look.
import {
  convertToExcalidrawElements,
  FONT_FAMILY,
} from '@excalidraw/excalidraw'

const SIZE = 200
const COLORS = [
  { id: 'yellow', fill: '#ffec99', edge: '#ecd67a' },
  { id: 'pink', fill: '#ffc9c9', edge: '#eeaeae' },
  { id: 'blue', fill: '#a5d8ff', edge: '#87c0ec' },
  { id: 'green', fill: '#b2f2bb', edge: '#94dc9f' },
] as const

const note = (color: (typeof COLORS)[number], x = 0, y = 0) =>
  convertToExcalidrawElements(
    [
      {
        type: 'rectangle',
        x,
        y,
        width: SIZE,
        height: SIZE,
        backgroundColor: color.fill,
        fillStyle: 'solid',
        strokeColor: color.edge,
        strokeWidth: 1,
        roughness: 0,
        roundness: null,
        label: {
          text: '',
          strokeColor: '#1e1e1e',
          fontSize: 20,
          fontFamily: FONT_FAMILY.Nunito,
          textAlign: 'left',
          verticalAlign: 'top',
        },
      },
    ],
    { regenerateIds: false },
  )

// Stable IDs, so updating the library on every open doesn't duplicate them.
export const STICKY_LIBRARY = COLORS.map((color) => ({
  id: `sticky-${color.id}`,
  status: 'published' as const,
  created: 0,
  name: `Sticky note (${color.id})`,
  elements: note(color),
}))
export const STICKY_IDS = new Set(STICKY_LIBRARY.map((item) => item.id))

/** A new yellow note centred on a point in the canvas. */
export const noteAt = (point: { x: number; y: number }) =>
  note(COLORS[0], point.x - SIZE / 2, point.y - SIZE / 2)
