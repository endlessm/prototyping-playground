import type { Ref } from 'vue'
import { fromPath, pathTo, rectBox, type Box } from '../utils/boxes'

type View = Window & typeof globalThis

// Inspect on the Playground's stage. The stage is the system's preview
// document in a same-origin iframe, so the studio reaches into it directly,
// as it already does to measure it: listeners on its window, read-only DOM
// reads, and nothing of the studio's loaded into it. Its overlay is drawn
// by the studio, over the frame (`LabStageOverlay`).
// While Inspect is on, hovering shows a thin box, and a click selects an
// element instead of reaching the component: its pointer, mouse and click
// events stop before the component's own handlers (menus open on
// pointerdown, fields take focus on mousedown). The selection is kept as
// child indexes from the document's body, so it survives the component
// re-rendering or hot updates; Escape clears it.
// It also tells which elements a prop changes: those holding its text, and
// those that changed the last time it did.
export function useStageInspector(inspecting: Ref<boolean>) {
  const view = shallowRef<View | null>(null)
  /** Bumped after anything that may move what the overlay draws. */
  const version = ref(0)
  const hoverBox = shallowRef<Box | null>(null)
  const selectedPath = shallowRef<number[] | null>(null)
  const selected = shallowRef<Element | null>(null)

  const body = () => view.value?.document.body ?? null
  const stageBox = () =>
    view.value?.document.querySelector<HTMLElement>('[data-playground]') ?? null

  let queued = false
  function redraw() {
    if (queued || !view.value) return
    queued = true
    view.value.requestAnimationFrame(() => {
      queued = false
      const root = body()
      const next =
        root && selectedPath.value ? fromPath(root, selectedPath.value) : null
      if (next !== selected.value) selected.value = next
      version.value++
    })
  }

  // The element an event is on, if it is one Inspect can select: anything
  // the component renders, its icons whole rather than one of their paths.
  function targetOf(event: Event) {
    const target = event.target as Element | null
    const root = body()
    const stage = stageBox()
    if (!target || !root || target.nodeType !== 1 || !root.contains(target))
      return null
    if (target === root || target === stage) return null
    return target.closest('svg') ?? target
  }

  function select(element: Element | null) {
    const root = body()
    selectedPath.value = element && root ? pathTo(element, root) : null
    selected.value = element
    version.value++
  }
  const clear = () => select(null)

  const block = (event: Event) => {
    if (!inspecting.value || !targetOf(event)) return
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  function click(event: MouseEvent) {
    if (!inspecting.value) return
    const element = targetOf(event)
    event.preventDefault()
    event.stopImmediatePropagation()
    select(element)
  }
  function move(event: PointerEvent) {
    const element = inspecting.value ? targetOf(event) : null
    hoverBox.value = element
      ? rectBox(element.getBoundingClientRect(), 'hover')
      : null
  }
  const out = () => (hoverBox.value = null)
  function key(event: KeyboardEvent) {
    if (event.key === 'Escape' && selected.value) clear()
  }

  // Changes since a prop last changed, for `changedBy`.
  const changes = new Map<string, Element[]>()
  let recording: { prop: string; until: number } | null = null
  function record(mutations: MutationRecord[]) {
    if (!recording || performance.now() > recording.until) return
    const list = changes.get(recording.prop) ?? []
    for (const mutation of mutations) {
      const element =
        mutation.target.nodeType === 1
          ? (mutation.target as Element)
          : mutation.target.parentElement
      if (element && element !== body() && element !== stageBox())
        list.push(element)
    }
    changes.set(recording.prop, list)
  }

  const listeners: [string, EventListener, boolean][] = [
    ['pointerdown', block, true],
    ['mousedown', block, true],
    ['pointerup', block, true],
    ['mouseup', block, true],
    ['dblclick', block, true],
    ['click', click as EventListener, true],
    ['pointermove', move as EventListener, true],
    ['pointerleave', out, false],
    ['keydown', key as EventListener, true],
    ['scroll', redraw, true],
    ['resize', redraw, false],
  ]
  let observer: MutationObserver | undefined
  let resized: ResizeObserver | undefined

  function detach() {
    const current = view.value
    if (current)
      for (const [type, listener, capture] of listeners)
        current.removeEventListener(type, listener, capture)
    observer?.disconnect()
    resized?.disconnect()
    view.value = null
  }

  /** Starts on a newly loaded stage document. */
  function attach(next: View) {
    detach()
    view.value = next
    for (const [type, listener, capture] of listeners)
      next.addEventListener(type, listener, capture)
    observer = new next.MutationObserver((mutations) => {
      record(mutations)
      redraw()
    })
    observer.observe(next.document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    })
    resized = new next.ResizeObserver(redraw)
    resized.observe(next.document.body)
    redraw()
  }
  onBeforeUnmount(detach)

  watch(inspecting, (on) => {
    if (!on) hoverBox.value = null
  })

  /** The changes in the next moment are what this prop changed. */
  function recordChangesFor(prop: string) {
    changes.set(prop, [])
    recording = { prop, until: performance.now() + 500 }
  }

  /** The elements holding this text, nearest first. */
  function holdingText(text: string) {
    const root = body()
    if (!root || !text.trim()) return []
    const found = new Set<Element>()
    const walker = root.ownerDocument.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
    )
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement
      if (
        parent &&
        !['SCRIPT', 'STYLE', 'TEMPLATE'].includes(parent.tagName) &&
        node.textContent?.includes(text)
      )
        found.add(parent)
    }
    return [...found]
  }

  /** The elements that changed the last time this prop did, still there. */
  const changedBy = (prop: string) =>
    [...new Set(changes.get(prop) ?? [])].filter(
      (element) => element.isConnected && element.getClientRects().length,
    )

  /** The component's own root elements on the stage. */
  const roots = () => [...(stageBox()?.children ?? [])]

  return {
    view,
    version,
    hoverBox,
    selected,
    attach,
    select,
    clear,
    recordChangesFor,
    holdingText,
    changedBy,
    roots,
  }
}

export type StageInspector = ReturnType<typeof useStageInspector>
