<script setup lang="ts">
import {
  createDialKit,
  createDialRoot,
  type DialConfig,
  type DialKitController,
  type DialValue,
} from 'dialkit/vanilla'
import 'dialkit/vanilla/styles.css'

// DialKit, inline, holding the Playground's panels: Props, and the selected
// element's classes. DialKit draws and owns its rows; this component builds
// a panel again only when its set of dials changes (`signature`), passes on
// what a dial changes, takes values set from outside, and adds what DialKit
// lacks: each row tagged with its dial's path (`data-lab-dial`), a help line
// under it that its control is described by, rows marked as changing the
// selected element, and which dial the pointer or the keyboard is on, for
// the stage's highlight. DialKit rebuilds rows only for a new set of dials,
// so the tags are added again after each.
export interface DialPanel {
  id: string
  name: string
  config: DialConfig
  /** Changes when the set of dials does; a new one rebuilds the panel. */
  signature: string
  /** A help line under a dial, by its path. */
  help?: Record<string, { name?: string; text: string }>
}

const props = defineProps<{
  panels: DialPanel[]
  /** Dials, as `<panel>:<path>`, outlined as changing the selection. */
  marked?: string[]
  disabled?: boolean
}>()
const emit = defineEmits<{
  change: [panel: string, values: Record<string, DialValue>]
  /** The dials under the pointer or focus, as paths; empty when none. */
  hover: [panel: string | null, paths: string[]]
}>()

const host = useTemplateRef('host')
let root: ReturnType<typeof createDialRoot> | undefined
const kits = new Map<
  string,
  { kit: DialKitController<DialConfig>; signature: string }
>()
// Values set from outside come back through DialKit's subscription; they
// aren't changes.
let applying = false

// DialKit's look, from the studio's own tokens, so it reads as part of it.
const LOOK: Record<string, string> = {
  '--dial-glass-bg': 'var(--ui-bg)',
  '--dial-dropdown-bg': 'var(--ui-bg)',
  '--dial-border': 'var(--ui-border)',
  '--dial-border-hover': 'var(--ui-border-accented)',
  '--dial-surface': 'var(--ui-bg-elevated)',
  '--dial-surface-hover': 'var(--ui-bg-accented)',
  '--dial-surface-active': 'var(--ui-bg-accented)',
  '--dial-text-root': 'var(--ui-text-highlighted)',
  '--dial-text-section': 'var(--ui-text-toned)',
  '--dial-text-label': 'var(--ui-text-muted)',
  '--dial-text-primary': 'var(--ui-text)',
  '--dial-text-focus': 'var(--ui-text-highlighted)',
  '--dial-focus-ring': 'var(--ui-primary)',
  '--dial-shadow': 'none',
  '--dial-backdrop-blur': '0px',
  '--dial-radius': 'calc(var(--ui-radius) * 2)',
  'font-family': 'inherit',
}

function sync() {
  const wanted = new Set(props.panels.map((panel) => panel.id))
  for (const [id, entry] of kits)
    if (!wanted.has(id)) {
      entry.kit.destroy()
      kits.delete(id)
    }
  for (const panel of props.panels) {
    const entry = kits.get(panel.id)
    if (entry?.signature === panel.signature) continue
    entry?.kit.destroy()
    const kit = createDialKit(panel.name, panel.config, { id: panel.id })
    kit.subscribe((values) => {
      if (!applying)
        emit('change', panel.id, values as Record<string, DialValue>)
    }, false)
    kits.set(panel.id, { kit, signature: panel.signature })
  }
}

/** Sets a dial's value without it counting as a change. */
function setValue(panel: string, path: string, value: DialValue) {
  const kit = kits.get(panel)?.kit
  if (!kit) return
  applying = true
  try {
    kit.setValue(path, value)
  } finally {
    applying = false
  }
}
/** A panel's current values, by path. */
const valuesOf = (panel: string) =>
  (kits.get(panel)?.kit.getValues() ?? {}) as Record<string, DialValue>
defineExpose({ setValue, valuesOf })

// --- Tagging DialKit's rows ---

const folderTitle = (folder: Element) =>
  folder
    .querySelector(':scope > .dialkit-folder-header .dialkit-folder-title')
    ?.textContent?.trim()
const bodyOf = (folder: Element) =>
  folder.querySelector(
    ':scope > .dialkit-folder-content > .dialkit-folder-inner',
  )

// Each control mounts one node in its folder's body, in the config's
// order, among DialKit's own (its versions strip) and the help lines.
const ROW =
  ':scope > :is(.dialkit-folder, .dialkit-labeled-control, .dialkit-text-control, .dialkit-select-row, .dialkit-slider-wrapper, .dialkit-color-control, .dialkit-button)'
function tagRows(
  panel: DialPanel,
  body: Element,
  config: DialConfig,
  prefix: string,
) {
  const keys = Object.keys(config).filter((key) => key !== '_collapsed')
  const nodes = [...body.querySelectorAll<HTMLElement>(ROW)]
  const wanted = new Set<string>()
  keys.forEach((key, index) => {
    const node = nodes[index]
    if (!node) return
    const path = prefix ? `${prefix}.${key}` : key
    const value = config[key]
    const folder =
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !('type' in value)
    const tag = `${panel.id}:${path}`
    if (node.dataset.labDial !== tag) node.dataset.labDial = tag
    if (folder) {
      const inner = bodyOf(node)
      if (inner) tagRows(panel, inner, value as DialConfig, path)
      return
    }
    if (describe(panel, node, path)) wanted.add(tag)
  })
  // Help lines whose row DialKit rebuilt or removed.
  for (const line of body.querySelectorAll<HTMLElement>(
    ':scope > [data-lab-help]',
  )) {
    const row = line.previousElementSibling as HTMLElement | null
    if (
      !wanted.has(line.dataset.labHelp!) ||
      row?.dataset.labDial !== line.dataset.labHelp
    )
      line.remove()
  }
}

const CONTROL =
  'textarea, input, .dialkit-select-trigger, [role="radiogroup"], [role="slider"]'
// The help line goes right after its row, as DialKit lays a row's parts out
// in one line. It changes only when its words do, so tagging settles.
function describe(panel: DialPanel, row: HTMLElement, path: string) {
  const help = panel.help?.[path]
  if (!help) return false
  const tag = row.dataset.labDial!
  const id = `lab-dial-help-${tag.replace(/\W/g, '-')}`
  const next = row.nextElementSibling as HTMLElement | null
  let line = next?.dataset.labHelp === tag ? next : null
  if (!line) {
    line = document.createElement('p')
    line.dataset.labHelp = tag
    line.id = id
    line.className = '-mt-1 px-2 pb-1 text-xs text-muted'
    row.after(line)
  }
  const said = `${help.name ?? ''}|${help.text}`
  if (line.dataset.said !== said) {
    line.dataset.said = said
    line.replaceChildren()
    if (help.name) {
      const name = document.createElement('code')
      name.className = 'font-mono text-toned'
      name.textContent = help.name
      line.append(name, help.text ? ' · ' : '')
    }
    line.append(help.text)
  }
  const control = row.querySelector(CONTROL)
  if (control && control.getAttribute('aria-describedby') !== id)
    control.setAttribute('aria-describedby', id)
  return true
}

function tagAll() {
  const panelsRoot = host.value
  if (!panelsRoot) return
  const folders = [...panelsRoot.querySelectorAll('.dialkit-folder')]
  for (const panel of props.panels) {
    const folder = folders.find((entry) => folderTitle(entry) === panel.name)
    const body = folder && bodyOf(folder)
    if (body) tagRows(panel, body, panel.config, '')
  }
  mark()
}

function mark() {
  const marked = new Set(props.marked ?? [])
  for (const row of host.value?.querySelectorAll<HTMLElement>(
    '[data-lab-dial]',
  ) ?? []) {
    const on = marked.has(row.dataset.labDial!)
    if (row.hasAttribute('data-lab-marked') !== on)
      row.toggleAttribute('data-lab-marked', on)
  }
}

let tagging = false
const observer = import.meta.client
  ? new MutationObserver(() => {
      if (tagging) return
      tagging = true
      requestAnimationFrame(() => {
        tagging = false
        tagAll()
      })
    })
  : undefined

// --- Which dial the pointer or keyboard is on ---

let hovered = ''
function pathsAt(target: EventTarget | null): [string | null, string[]] {
  const element = target instanceof Element ? target : null
  const header = element?.closest('.dialkit-folder-header')
  // A folder's header stands for all of its dials.
  const row = header
    ? header.parentElement?.closest<HTMLElement>('[data-lab-dial]')
    : (element?.closest<HTMLElement>('[data-lab-dial]') ??
      (element?.closest<HTMLElement>('[data-lab-help]')
        ?.previousElementSibling as HTMLElement | null))
  if (!row) return [null, []]
  const [panel, path] = row.dataset.labDial!.split(/:(.*)/s) as [string, string]
  if (!header) return [panel, [path]]
  const inside = [...row.querySelectorAll<HTMLElement>('[data-lab-dial]')]
    .map((entry) => entry.dataset.labDial!.split(/:(.*)/s)[1]!)
    .filter((entry) => entry.startsWith(`${path}.`))
  return [panel, inside]
}
function point(target: EventTarget | null) {
  const [panel, paths] = pathsAt(target)
  const key = `${panel}|${paths.join()}`
  if (key === hovered) return
  hovered = key
  emit('hover', panel, paths)
}
function leave() {
  hovered = ''
  emit('hover', null, [])
}

onMounted(() => {
  root = createDialRoot({ target: host.value!, mode: 'inline', theme: 'light' })
  for (const [name, value] of Object.entries(LOOK))
    root.element.style.setProperty(name, value)
  sync()
  observer?.observe(host.value!, { childList: true, subtree: true })
  tagAll()
})
watch(
  () =>
    props.panels
      .map((panel) => `${panel.id}|${panel.signature}|${panel.name}`)
      .join(),
  () => {
    sync()
    void nextTick(tagAll)
  },
)
// Help lines change with the panel's values (the component's own), not
// only with its dials.
watch(
  () => props.panels.map((panel) => panel.help),
  () => void nextTick(tagAll),
  {
    deep: true,
  },
)
watch(() => props.marked, mark)
onBeforeUnmount(() => {
  observer?.disconnect()
  for (const { kit } of kits.values()) kit.destroy()
  kits.clear()
  root?.destroy()
})
</script>

<template>
  <!-- DialKit's own toolbar (copy and versions) has no use here; marked rows
       get the studio's selection outline. -->
  <div
    ref="host"
    class="min-w-0 [&_.dialkit-panel-inner]:rounded-3xl [&_.dialkit-panel-section-toolbar-clip]:hidden! [&_.dialkit-panel-toolbar]:hidden! [&_.dialkit-versions]:hidden! [&_[data-lab-marked]]:rounded-lg [&_[data-lab-marked]]:outline-2 [&_[data-lab-marked]]:-outline-offset-2 [&_[data-lab-marked]]:outline-primary"
    :class="{
      'pointer-events-none opacity-60': disabled,
      // Several panels share a shell DialKit names after itself.
      '[&_.dialkit-folder-title-root]:invisible': panels.length > 1,
    }"
    :inert="disabled"
    @pointerover="point($event.target)"
    @pointerleave="leave"
    @focusin="point($event.target)"
    @focusout="leave"
  />
</template>
