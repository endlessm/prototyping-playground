// The map's arrows, computed from the layout, never from the page: one per story step (an invitation or a creation)
// and one from each Cohort to the Program it runs. Each arrow is a cubic curve leaving the side of its source that
// faces its target, with a label pill at its midpoint. Routes are chosen by trying every pair of sides and a few
// points along them, and scoring each: length, plus heavy costs for crossing a tile, the shelf or the legend, for a
// label covering any of them, a tab or another label, and lighter ones for passing behind a tab or crossing an arrow.

import { anchor, LEGEND, shelfId, shelfRow, tabRect, textWidth, type MapLayout, type Rect, type Side } from './layout'
import { shelfPrograms } from './programs'
import { mapRoles, nodeTitle, organizationOf, placeStep, type NodeId, type PlaceId, type Story } from './story'

/** What an arrow says: someone invites to a role, creates a place, or a Cohort runs a Program. */
export type ArrowKind = 'invite' | 'create' | 'runs'
/** How an arrow is drawn: its kind, or the current step's (`now`) or the next step's (`next`) look. */
export type ArrowLook = ArrowKind | 'now' | 'next'

export interface Point {
  x: number
  y: number
}

export interface MapArrow {
  /** `step-N` for a story step, `runs:<place>` for a Cohort's Program. */
  id: string
  kind: ArrowKind
  /** The story step that draws it (1-based); a Program arrow belongs to the step that creates its Cohort. */
  step: number
  /** The tile or place it starts from, and the tile or place it reaches. */
  from: NodeId | PlaceId
  to: NodeId | PlaceId
  /** The curve: start, two control points, end (the arrowhead's tip). */
  curve: [Point, Point, Point, Point]
  label: { verb: string; object: string; rect: Rect }
}

const SIDES: Side[] = ['right', 'left', 'bottom', 'top']
const OFFSETS = [0.5, 0.3, 0.7, 0.15, 0.85]
const BENDS = [0.42, 0.28]
const SAMPLES = 28
/** How much of a curve must show outside its label, so the label never hides its arrow. */
const MIN_SEEN = 36
const REROUTES = 1
const NORMAL: Record<Side, Point> = { right: { x: 1, y: 0 }, left: { x: -1, y: 0 }, top: { x: 0, y: -1 }, bottom: { x: 0, y: 1 } }

/** A label pill's size, estimated from its text: a small verb over the role, place or Program. */
export function labelSize(verb: string, object: string): { width: number; height: number } {
  return { width: Math.ceil(Math.max(textWidth(verb, 12), textWidth(object, 12, 'semibold')) + 20), height: 35 }
}

const grow = (r: Rect, by: number): Rect => ({ x: r.x - by, y: r.y - by, width: r.width + 2 * by, height: r.height + 2 * by })
const inside = (p: Point, r: Rect) => p.x > r.x && p.x < r.x + r.width && p.y > r.y && p.y < r.y + r.height
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
const centre = (r: Rect): Point => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 })

function bezier([p0, p1, p2, p3]: MapArrow['curve'], t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y }
}

const sample = (curve: MapArrow['curve']) => Array.from({ length: SAMPLES + 1 }, (_, i) => bezier(curve, i / SAMPLES))

function box(points: Point[]): Rect {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

const turn = (p: Point, q: Point, r: Point) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))

/** How many times two sampled curves cross; `bounds` is the second curve's box, to skip segments far from it. */
function crosses(a: Point[], b: Point[], bounds: Rect): number {
  const near = grow(bounds, 1)
  let count = 0
  for (let i = 1; i < a.length; i++) {
    const [p, q] = [a[i - 1], a[i]]
    if (Math.max(p.x, q.x) < near.x || Math.min(p.x, q.x) > near.x + near.width) continue
    if (Math.max(p.y, q.y) < near.y || Math.min(p.y, q.y) > near.y + near.height) continue
    for (let j = 1; j < b.length; j++) {
      const [r, t] = [b[j - 1], b[j]]
      if (turn(p, q, r) * turn(p, q, t) < 0 && turn(r, t, p) * turn(r, t, q) < 0) count++
    }
  }
  return count
}

interface Obstacles {
  /** Things no curve may cross and no label may cover: tiles, the shelf, the legend. */
  solid: Rect[]
  /** Area tabs: a curve may pass behind one at a cost, a label may not cover one. */
  tabs: Rect[]
}

interface Placed {
  points: Point[]
  bounds: Rect
  box: Rect
  anchors: string[]
}

interface Request {
  id: string
  kind: ArrowKind
  step: number
  from: NodeId | PlaceId
  to: NodeId | PlaceId
  source: Rect
  target: Rect
  /** Obstacles this arrow may touch, such as the shelf around the Program it reaches. */
  own: Rect[]
  /** More rects to stay clear of, such as the shelf's other rows. */
  avoid: Rect[]
  verb: string
  object: string
}

function route(request: Request, obstacles: Obstacles, placed: Placed[]): MapArrow & Placed {
  const size = labelSize(request.verb, request.object)
  const mine = [request.source, request.target, ...request.own]
  const solid = [...obstacles.solid.filter((r) => !mine.includes(r)), ...request.avoid].map((r) => grow(r, 4))
  const tabs = obstacles.tabs.filter((r) => !mine.includes(r))
  const ends = [request.source, request.target].map((r) => grow(r, -2))
  const labels = placed.map((arrow) => grow(arrow.box, 2))
  const blocking = [...obstacles.solid, ...obstacles.tabs]
  const used = new Set(placed.flatMap((arrow) => arrow.anchors))
  const towards = centre(request.target)
  const back = centre(request.source)
  let best: (MapArrow & Placed) | null = null
  let bestCost = Infinity

  const candidates = SIDES.flatMap((fromSide) =>
    SIDES.flatMap((toSide) =>
      OFFSETS.flatMap((fromOffset) =>
        OFFSETS.map((toOffset) => {
          const p0 = anchor(request.source, fromSide, fromOffset)
          const p3 = anchor(request.target, toSide, toOffset)
          const n0 = NORMAL[fromSide]
          const n3 = NORMAL[toSide]
          let cost = 0
          if (n0.x * (towards.x - p0.x) + n0.y * (towards.y - p0.y) <= 0) cost += 1500
          if (n3.x * (back.x - p3.x) + n3.y * (back.y - p3.y) <= 0) cost += 1500
          const keys = [`${request.from}:${fromSide}:${fromOffset}`, `${request.to}:${toSide}:${toOffset}`]
          cost += keys.filter((key) => used.has(key)).length * 800
          cost += (Math.abs(fromOffset - 0.5) + Math.abs(toOffset - 0.5)) * 40
          // The straight line is the shortest any curve between the two points can be.
          const floor = cost + Math.hypot(p3.x - p0.x, p3.y - p0.y)
          return { p0, p3, n0, n3, keys, cost, floor }
        }),
      ),
    ),
  )
  candidates.sort((a, b) => a.floor - b.floor)

  for (const { p0, p3, n0, n3, keys, cost, floor } of candidates) {
    if (floor >= bestCost) break
    const distance = floor - cost
    for (const bend of BENDS) {
      const d = Math.max(24, distance * bend)
      const curve: MapArrow['curve'] = [
        p0,
        { x: p0.x + n0.x * d, y: p0.y + n0.y * d },
        { x: p3.x + n3.x * d, y: p3.y + n3.y * d },
        p3,
      ]
      const points = sample(curve)
      let total = cost + (bend === BENDS[0] ? 0 : 30)
      for (let i = 1; i < points.length; i++) {
        total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
      }
      for (const point of points) {
        if (solid.some((r) => inside(point, r))) total += 400
        if (ends.some((r) => inside(point, r))) total += 400
        if (tabs.some((r) => inside(point, r))) total += 120
        if (labels.some((r) => inside(point, r))) total += 200
      }
      if (total >= bestCost) continue

      const mid = bezier(curve, 0.5)
      const label = { x: mid.x - size.width / 2, y: mid.y - size.height / 2, ...size }
      const clear = grow(label, 6)
      if (blocking.some((r) => overlaps(clear, r))) total += 10000
      let seen = 0
      for (let i = 1; i < points.length; i++) {
        const half = { x: (points[i].x + points[i - 1].x) / 2, y: (points[i].y + points[i - 1].y) / 2 }
        if (!inside(half, label)) seen += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
      }
      if (seen < MIN_SEEN) total += 2500
      const cover = grow(label, 2)
      for (const arrow of placed) {
        if (overlaps(clear, arrow.box)) total += 10000
        if (arrow.points.some((point) => inside(point, cover))) total += 600
      }
      if (total >= bestCost) continue
      for (const arrow of placed) total += crosses(points, arrow.points, arrow.bounds) * 150
      if (total < bestCost) {
        bestCost = total
        best = {
          id: request.id,
          kind: request.kind,
          step: request.step,
          from: request.from,
          to: request.to,
          curve,
          label: { verb: request.verb, object: request.object, rect: label },
          box: label,
          points,
          bounds: box(points),
          anchors: keys,
        }
      }
    }
  }
  if (!best) throw new Error(`No route for the arrow ${request.id}.`)
  return best
}

/** Every arrow of a story, routed once for the whole layout, so arrows don't move as the story plays. */
export function computeArrows(story: Story, layout: MapLayout): MapArrow[] {
  const tabs: Record<PlaceId, Rect> = {}
  for (const id of Object.keys(story.places)) {
    const rect = tabRect(story, layout, id)
    if (rect) tabs[id] = rect
  }
  const shelves = Object.entries(layout.boxes).filter(([id]) => id.startsWith('programs:'))
  const legend = layout.boxes[LEGEND.id]
  const obstacles: Obstacles = {
    solid: [...Object.values(layout.nodes), ...shelves.map(([, rect]) => rect), ...(legend ? [legend] : [])],
    tabs: Object.values(tabs),
  }
  const nodeAt = (id: NodeId) => layout.nodes[id]

  const requests: Request[] = []
  story.steps.forEach((event, index) => {
    const source = nodeAt(event.actor)
    if (!source) return
    if (event.kind === 'award') {
      const target = nodeAt(event.node)
      const node = story.nodes[event.node]
      if (!target || !node) return
      requests.push({
        id: `step-${index + 1}`,
        kind: 'invite',
        step: index + 1,
        from: event.actor,
        to: event.node,
        source,
        target,
        own: [],
        avoid: [],
        verb: event.verb,
        object: node.person ? mapRoles[event.role].label : nodeTitle(node),
      })
    } else {
      const target = tabs[event.place]
      if (!target) return
      requests.push({
        id: `step-${index + 1}`,
        kind: 'create',
        step: index + 1,
        from: event.actor,
        to: event.place,
        source,
        target,
        own: [],
        avoid: [],
        verb: 'creates',
        object: event.object,
      })
    }
  })

  const programs = shelfPrograms(story)
  for (const place of Object.values(story.places)) {
    if (!place.program) continue
    const area = layout.areas[place.id]
    const org = organizationOf(story, place.id)?.id
    if (!org) continue
    const shelf = layout.boxes[shelfId(org)]
    const index = programs.findIndex((program) => program.name === place.program)
    if (!area || !shelf || index < 0) continue
    const row = shelfRow(shelf, index)
    const rows = programs.map((_, i) => shelfRow(shelf, i)).filter((_, i) => i !== index)
    requests.push({
      id: `runs:${place.id}`,
      kind: 'runs',
      step: placeStep(story, place.id),
      from: place.id,
      to: shelfId(org),
      source: area,
      target: row,
      own: [shelf, ...(tabs[place.id] ? [tabs[place.id]] : [])],
      avoid: rows,
      verb: 'runs',
      object: place.program,
    })
  }

  // Invitations first, the map's main thread, then creations and Programs around them; then each arrow is routed
  // again knowing where all the others went.
  const rank: Record<ArrowKind, number> = { invite: 0, create: 1, runs: 2 }
  const order = [...requests].sort((a, b) => rank[a.kind] - rank[b.kind])
  const routes = new Map<string, MapArrow & Placed>()
  for (const request of order) routes.set(request.id, route(request, obstacles, [...routes.values()]))
  for (let round = 0; round < REROUTES; round++) {
    for (const request of order) {
      const others = [...routes.values()].filter((arrow) => arrow.id !== request.id)
      routes.set(request.id, route(request, obstacles, others))
    }
  }
  return requests.map((request) => {
    const { id, kind, step, from, to, curve, label } = routes.get(request.id)!
    return { id, kind, step, from, to, curve, label }
  })
}

/** The SVG path of an arrow's line, stopped short of the tip so the arrowhead covers its end. */
export function arrowPath(arrow: MapArrow, head = 8): string {
  const [p0, p1, p2, p3] = arrow.curve
  const tangent = direction(arrow)
  const end = { x: p3.x - tangent.x * head * 0.6, y: p3.y - tangent.y * head * 0.6 }
  return `M${p0.x} ${p0.y} C${p1.x} ${p1.y} ${p2.x} ${p2.y} ${end.x} ${end.y}`
}

/** The arrowhead: a triangle with its tip at the curve's end, pointing along the curve. */
export function arrowHead(arrow: MapArrow, head = 8): string {
  const tip = arrow.curve[3]
  const t = direction(arrow)
  const base = { x: tip.x - t.x * head, y: tip.y - t.y * head }
  const half = head * 0.5
  const left = { x: base.x - t.y * half, y: base.y + t.x * half }
  const right = { x: base.x + t.y * half, y: base.y - t.x * half }
  return `M${tip.x} ${tip.y} L${left.x} ${left.y} L${right.x} ${right.y} Z`
}

function direction(arrow: MapArrow): Point {
  const [, , p2, p3] = arrow.curve
  const near = bezier(arrow.curve, 0.97)
  const from = Math.hypot(p3.x - near.x, p3.y - near.y) > 0.5 ? near : p2
  const length = Math.hypot(p3.x - from.x, p3.y - from.y) || 1
  return { x: (p3.x - from.x) / length, y: (p3.y - from.y) / length }
}
