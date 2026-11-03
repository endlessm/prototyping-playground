// The artifact surface: what an artifact page offers to tools drawn over it,
// such as the comment tool. It knows nothing about comments. A page answers
// questions about what it shows (what is under a point, where something is
// now) in the coordinates of the studio's own window, so a tool draws in the
// studio, never inside the page's content. Each file type's page registers
// one through `useArtifactSurfaceProvider`; a page without one offers none.

/** A box in the studio window's coordinates, as `getBoundingClientRect`. */
export interface SurfaceBox {
  left: number
  top: number
  width: number
  height: number
}

export interface SurfacePoint {
  x: number
  y: number
}

/**
 * How a page finds something again: JSON that the page records and reads
 * back. Every anchor has a kind, a readable label and `at`, where on the
 * target's box the point sits, as fractions of its width and height. Each
 * file type adds what it needs to find the target again.
 */
export interface SurfaceAnchor {
  kind: string
  label: string
  at: SurfacePoint
  quote?: string
  [field: string]: unknown
}

/** What a point is over: what it would comment on, and where that is. */
export interface SurfaceTarget {
  anchor: SurfaceAnchor
  label: string
  box: SurfaceBox
}

/**
 * Where an anchor is now: in sight, scrolled out of sight, or not found (its
 * target was removed or changed). Worked out each time, never stored.
 */
export type SurfaceLocation =
  | { state: 'shown'; box: SurfaceBox; point: SurfacePoint }
  | { state: 'offscreen'; box: SurfaceBox; point: SurfacePoint }
  | { state: 'missing' }

/** What a tool hears while it takes the pointer over the page. */
export interface SurfaceInput {
  /** The pointer moved to `point`. */
  move: (point: SurfacePoint) => void
  /** The pointer pressed at `point`; the page itself never hears it. */
  press: (point: SurfacePoint) => void
  /** The pointer left the page. */
  leave: () => void
  /** A key the tool handles, such as Escape, pressed while the page has focus. */
  key: (event: KeyboardEvent) => void
}

export interface ArtifactSurface {
  /** The element the page's content covers in the studio. */
  element: HTMLElement
  /** What a point in the studio window is over, or null. */
  targetAt: (point: SurfacePoint) => SurfaceTarget | null
  locate: (anchor: SurfaceAnchor) => SurfaceLocation
  /** Scrolls, pans or zooms an anchor's target into view. */
  reveal: (anchor: SurfaceAnchor) => void
  /**
   * Calls `listener` when things may have moved: scrolling, panning,
   * zooming, resizing, a re-render or a file update, at most once an
   * animation frame. Returns the function that stops it.
   */
  onChange: (listener: () => void) => () => void
  /**
   * Takes the pointer over the page until the returned function is called:
   * presses reach the tool and never the page. A page adds to its content
   * only while this lasts, and removes everything it added after.
   */
  intercept: (input: SurfaceInput) => () => void
}
