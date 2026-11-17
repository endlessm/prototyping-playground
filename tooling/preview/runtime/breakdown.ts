// Runs inside the preview document for a Breakdown: the `$lab` the
// instrumented copies of the component's files call (`tooling/preview/
// breakdown.ts`). Each instrumented tag registers the component it renders
// under its node ID, so the runtime can find the elements of every piece,
// mark them with `data-lab-node`, report where they and their theme slots
// are, and outline the pieces the studio highlights. Each tag's `ui` and
// `class` go through the override store, which nothing feeds yet: the
// studio's overrides arrive here later (node ID → slot → classes), and the
// pieces re-render from it without a reload.
import { reactive, type ComponentInternalInstance, type VNode } from 'vue'
import type { NodeBox, NodeBoxes } from '../protocol.ts'

/** The root of the tree: the file the Breakdown mounts. */
export const ROOT_NODE = 'root'
/** Node ID → slot (a theme slot, or `class`) → classes. */
export type BreakdownOverrides = Record<string, Record<string, string>>

type Hook = ((vnode: VNode) => void) & { labId: string }
type UiObject = Record<string, unknown>

// Highlights are drawn in the studio's blue, the same for every system.
const HOVER =
  'outline: 2px dashed rgb(59 130 246); outline-offset: 1px; background: rgb(59 130 246 / 0.12);'
const SELECTED = 'outline: 2px solid rgb(37 99 235); outline-offset: 1px;'

// The node ID a component was rendered under: the hook its parent's
// instrumented tag gave its vnode, or the root for the mounted file.
function nodeOf(instance: ComponentInternalInstance | null) {
  const hook = instance?.vnode.props?.onVnodeMounted as
    Hook | Hook[] | undefined
  const found = (Array.isArray(hook) ? hook : [hook]).find(
    (entry) => typeof entry === 'function' && 'labId' in entry,
  )
  return found?.labId ?? ROOT_NODE
}

/** The DOM elements a rendered vnode is made of, through components and fragments. */
function elementsOf(vnode: VNode | null | undefined): Element[] {
  if (!vnode) return []
  if (vnode.component) return elementsOf(vnode.component.subTree)
  if (vnode.suspense) return elementsOf(vnode.suspense.activeBranch)
  if (typeof vnode.type === 'string')
    return vnode.el instanceof Element ? [vnode.el] : []
  if (Array.isArray(vnode.children))
    return (vnode.children as VNode[]).flatMap((child) =>
      typeof child === 'object' && child ? elementsOf(child) : [],
    )
  return []
}

const box = (element: Element): NodeBox | null => {
  const { x, y, width, height } = element.getBoundingClientRect()
  if (width === 0 && height === 0) return null
  const round = (value: number) => Math.round(value * 100) / 100
  return {
    x: round(x + window.scrollX),
    y: round(y + window.scrollY),
    width: round(width),
    height: round(height),
  }
}
const boxes = (elements: Element[]) =>
  elements.map(box).filter((found): found is NodeBox => found !== null)

export interface Breakdown {
  /** What the instrumented templates call, as `$lab`. */
  api: {
    ui: (
      instance: ComponentInternalInstance,
      local: string,
      original?: unknown,
    ) => unknown
    cls: (instance: ComponentInternalInstance, local: string) => unknown
    hook: (
      instance: ComponentInternalInstance,
      local: string,
      slotted?: number,
    ) => Hook
    drop: (instance: ComponentInternalInstance, local: string) => Hook
  }
  /**
   * Vnode hooks for the mounted component's own props, so the root piece
   * is found like the others.
   */
  rootHooks: Record<
    'onVnodeMounted' | 'onVnodeUpdated' | 'onVnodeBeforeUnmount',
    Hook
  >
  /** Replaces the overrides; the pieces re-render from them. */
  setOverrides: (next: BreakdownOverrides) => void
  /** The pieces to outline, by node ID (`<node>#<slot>` for a theme slot). */
  highlight: (hover: string | null, selected: string | null) => void
  /** Reports where the pieces are again, even when nothing moved. */
  report: () => void
  dispose: () => void
}

/**
 * The Breakdown runtime of one mounted component. `post` receives where
 * every rendered piece is, whenever that changes.
 */
export function createBreakdown(
  post: (nodes: Record<string, NodeBoxes>) => void,
): Breakdown {
  const overrides = reactive<BreakdownOverrides>({})
  const live = new Map<
    string,
    { instances: Set<ComponentInternalInstance>; slotted: boolean }
  >()
  const hooks = new Map<string, Hook>()
  const full = (instance: ComponentInternalInstance, local: string) =>
    `${nodeOf(instance)}>${local}`

  let last = ''
  let measured: Record<string, NodeBoxes> = {}
  let marked = new Set<Element>()
  let pending = 0
  let lit: { hover: string | null; selected: string | null } = {
    hover: null,
    selected: null,
  }
  const layer = document.createElement('div')
  layer.dataset.labOverlay = ''
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText =
    'position: absolute; inset: 0 auto auto 0; width: 0; height: 0; pointer-events: none; z-index: 2147483647;'
  document.documentElement.append(layer)

  const resized = new ResizeObserver(() => schedule())
  const changed = new MutationObserver((records) => {
    if (
      records.some(
        (record) =>
          !layer.contains(record.target) &&
          record.attributeName !== 'data-lab-node',
      )
    )
      schedule()
  })
  changed.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  })
  const onResize = () => schedule()
  window.addEventListener('resize', onResize)

  function schedule() {
    if (pending) return
    pending = requestAnimationFrame(() => {
      pending = 0
      measure(false)
    })
  }

  // Marks each piece's elements with its node ID (an element can be
  // several pieces, such as a wrapper and the tag it renders), then reads
  // where the pieces and their theme slots are.
  function measure(always: boolean) {
    const elements = new Map<string, Element[]>()
    const marks = new Map<Element, string[]>()
    for (const [id, { instances }] of live) {
      const found = [...instances].flatMap((instance) =>
        elementsOf(instance.subTree),
      )
      elements.set(id, found)
      for (const element of found)
        marks.set(element, [...(marks.get(element) ?? []), id])
    }
    for (const element of marked)
      if (!marks.has(element)) {
        element.removeAttribute('data-lab-node')
        resized.unobserve(element)
      }
    for (const [element, ids] of marks) {
      const value = [...new Set(ids)].join(' ')
      if (element.getAttribute('data-lab-node') !== value)
        element.setAttribute('data-lab-node', value)
      // Observing an element reports it once, so only new ones are added.
      if (!marked.has(element)) resized.observe(element)
    }
    marked = new Set(marks.keys())

    const nodes: Record<string, NodeBoxes> = {}
    for (const [id, found] of elements) {
      const slots: Record<string, NodeBox[]> = {}
      if (live.get(id)!.slotted)
        for (const element of found)
          for (const part of [
            element,
            ...element.querySelectorAll('[data-slot]'),
          ]) {
            const slot = part.getAttribute('data-slot')
            if (!slot) continue
            // A slot of a piece inside this one belongs to that piece.
            const owner = part.closest('[data-lab-node]')
            if (!owner?.getAttribute('data-lab-node')!.split(' ').includes(id))
              continue
            const at = box(part)
            if (at) (slots[slot] ??= []).push(at)
          }
      nodes[id] = { boxes: boxes(found), slots }
    }
    measured = nodes
    draw()
    const text = JSON.stringify(nodes)
    if (always || text !== last) {
      last = text
      post(nodes)
    }
  }

  function boxesOf(id: string) {
    const [node, slot] = id.split('#')
    const found = measured[node!]
    if (!found) return []
    return slot === undefined ? found.boxes : (found.slots[slot] ?? [])
  }

  function draw() {
    const outlines: string[][] = []
    if (lit.hover && lit.hover !== lit.selected)
      outlines.push(...boxesOf(lit.hover).map((at) => [HOVER, place(at)]))
    if (lit.selected)
      outlines.push(...boxesOf(lit.selected).map((at) => [SELECTED, place(at)]))
    layer.replaceChildren(
      ...outlines.map(([look, where]) => {
        const outline = document.createElement('div')
        outline.style.cssText = `position: absolute; box-sizing: border-box; border-radius: 2px; ${where} ${look}`
        return outline
      }),
    )
  }
  const place = ({ x, y, width, height }: NodeBox) =>
    `left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px;`

  function hookFor(id: string, kind: 'hook' | 'drop', slotted: boolean) {
    const key = `${kind}:${id}`
    let hook = hooks.get(key)
    if (!hook) {
      hook = Object.assign(
        (vnode: VNode) => {
          const instance = vnode.component
          if (!instance) return
          let entry = live.get(id)
          if (kind === 'drop') {
            entry?.instances.delete(instance)
            if (entry && !entry.instances.size) live.delete(id)
          } else {
            if (!entry)
              live.set(id, (entry = { instances: new Set(), slotted }))
            entry.instances.add(instance)
          }
          schedule()
        },
        { labId: id },
      )
      hooks.set(key, hook)
    }
    return hook
  }

  return {
    api: {
      ui(instance, local, original) {
        const own = overrides[full(instance, local)]
        if (!own) return original
        const merged: UiObject = {
          ...(original && typeof original === 'object'
            ? (original as UiObject)
            : {}),
        }
        // Nuxt UI merges a slot's `ui` classes over its theme with
        // tailwind-merge, so the later class of a pair wins.
        for (const [slot, classes] of Object.entries(own))
          if (slot !== 'class')
            merged[slot] = [merged[slot], classes].filter(Boolean).join(' ')
        return merged
      },
      cls: (instance, local) => overrides[full(instance, local)]?.class,
      hook: (instance, local, slotted) =>
        hookFor(full(instance, local), 'hook', Boolean(slotted)),
      drop: (instance, local) => hookFor(full(instance, local), 'drop', false),
    },
    rootHooks: {
      onVnodeMounted: hookFor(ROOT_NODE, 'hook', false),
      onVnodeUpdated: hookFor(ROOT_NODE, 'hook', false),
      onVnodeBeforeUnmount: hookFor(ROOT_NODE, 'drop', false),
    },
    setOverrides(next) {
      for (const id of Object.keys(overrides))
        if (!(id in next)) Reflect.deleteProperty(overrides, id)
      Object.assign(overrides, structuredClone(next))
    },
    highlight(hover, selected) {
      lit = { hover, selected }
      draw()
    },
    report: () => measure(true),
    dispose() {
      cancelAnimationFrame(pending)
      resized.disconnect()
      changed.disconnect()
      window.removeEventListener('resize', onResize)
      for (const element of marked) element.removeAttribute('data-lab-node')
      layer.remove()
    },
  }
}
