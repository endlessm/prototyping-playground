<script setup lang="ts">
import type { ContextMenuItem, DropdownMenuItem } from '@nuxt/ui'
import { parentOf, place } from '../../../tooling/manifest/order'
import { artifactTitle } from '../../../tooling/manifest/titles'
import {
  filterNodes,
  findNode,
  folderPaths,
  parentsOf,
  within,
  type FileNode,
  type FileTreeEntry,
  type NewFileOption,
} from '../../utils/fileTree'
import { afterMenuCloses, menuGroups } from '../../utils/menus'
import FileDeleteModal from './FileDeleteModal.vue'
import FileNameField from './FileNameField.vue'
import { treeFolds } from '../../composables/useFileTree'

// A tree of files and folders, built on Nuxt UI's tree: artifacts open in
// the studio and show readable names (the file name is the tooltip), the
// open one current, its folders opened. A filter, "Expand all" / "Collapse
// all" and, where you may change the files, "+" (New) sit in the header.
// Rows have right-click menus; F2 renames and Delete asks, then deletes.
// Creating and renaming use an inline name field. Rows are dragged before
// or after another, into a folder, or below the rows to the top level, and
// Alt+↑/↓ moves the focused one; an artifact's row dragged out carries its
// web address. What happens to the files is the caller's: it passes the
// changes as functions, and the menu actions for each row.
//
// As a branch (`branch`), it is a collapsible group inside another
// navigation, such as a system's Context: its heading folds it, "Empty
// folder" shows when it has nothing, and the navigation around it filters it
// (`query`) and may keep its folds (`v-model:closed`). Where order isn't
// kept (`unordered`), rows only move into folders.
const props = defineProps<{
  /** "Artifacts" or "Files": the heading and the tree's name. */
  heading: string
  /** What the filter speaks of. */
  kind: 'artifacts' | 'files'
  /** What to show, in order. */
  nodes: FileNode[]
  /** The artifacts among them, by path. */
  entries: Map<string, FileTreeEntry>
  /** The artifact (or one of its child rows) open now. */
  current?: string
  /** Where the tree's folds are remembered, such as a prototype's ID. */
  memory: string
  /** Whether you may create, rename and delete here. */
  editable?: boolean
  /** What "+" makes: the same in every folder, or by folder ('' the top). */
  newOptions?: NewFileOption[] | ((folder: string) => NewFileOption[])
  /** Rows that can't be renamed or deleted, such as meta.json. */
  fixed?: (node: FileNode) => boolean
  /** Rows that can't be dragged to move, such as a skill's folder. */
  movable?: (node: FileNode) => boolean
  /** Whether a row may move into a folder ('' for the top level). */
  canMoveTo?: (node: FileNode, folder: string) => boolean
  /** Rows aren’t put in order where none is kept: they only move. */
  unordered?: boolean
  /** A collapsible group inside another navigation, with this heading. */
  branch?: {
    label: string
    /** The folder it shows, for its hover text. */
    path: string
    /** Its own page, if it has one. */
    to?: string
    icon?: string
  }
  /** A row's hover text; its file's name by default. */
  hoverOf?: (node: FileNode) => string
  /** The surrounding navigation's filter, in place of the tree's own. */
  query?: string
  /** A row's menu items: reaching it, then changing it. */
  actions?: (node: FileNode) => {
    reach: ContextMenuItem[]
    change: ContextMenuItem[]
  }
  /** Files inside a folder the tree isn't showing, for its delete. */
  hiddenIn?: (node: FileNode) => string[]
  trash?: 'recycle-bin' | 'trash'
  create?: (parent: string, type: string, name: string) => Promise<unknown>
  rename?: (node: FileNode, name: string) => Promise<unknown>
  remove?: (node: FileNode) => Promise<unknown>
  /**
   * Moves a row into the folder `to` ('' for the top level) and, with
   * `before`, puts it before that sibling there ('' for last).
   */
  arrange?: (node: FileNode, to: string, before?: string) => Promise<unknown>
  /** An address in the app as a full web address, for rows dragged out. */
  linkOf?: (to: string) => string
  /** A file that isn't an artifact was chosen. */
  openFile?: (node: FileNode) => void
}>()

/** As a branch: whether it is unfolded. */
const branchOpen = defineModel<boolean>('open', { default: true })
/** Folders closed, when the surrounding navigation keeps them. */
const folds = defineModel<string[]>('closed')
const { t } = useI18n()
const route = useRoute()
const deleteModal = useOverlay().create(FileDeleteModal)

interface Row {
  key: string
  label: string
  node?: FileNode
  entry?: FileTreeEntry
  child?: { id: string; title: string; to: string }
  /** The name field for something new. */
  field?: boolean
  children?: Row[]
}

const hover = (node: FileNode) => props.hoverOf?.(node) ?? node.name
const titleOf = (node: FileNode) =>
  props.entries.get(node.path)?.title ??
  (node.dir && !node.name.startsWith('_')
    ? artifactTitle(node.name)
    : node.name)

// Filtering.
const filterOpen = ref(false)
const typed = ref('')
const words = computed(() => props.query ?? typed.value)
const filtering = computed(() => Boolean(words.value.trim()))
const filterInput = useTemplateRef<{ inputRef?: HTMLInputElement }>('filter')
const shown = computed(() => filterNodes(props.nodes, words.value, titleOf))
async function toggleFilter() {
  filterOpen.value = !filterOpen.value
  if (!filterOpen.value) return void (typed.value = '')
  await nextTick()
  filterInput.value?.inputRef?.focus()
}
function clearFilter() {
  typed.value = ''
  filterInput.value?.inputRef?.focus()
}
function onFilterKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  if (typed.value) typed.value = ''
  else filterOpen.value = false
}

// Editing names.
const creating = shallowRef<{ parent: string; type: string }>()
const renaming = ref<string>()

// Folds: folders start open; the ones you close stay closed, here or in
// the surrounding navigation.
const remembered = ref(new Set(treeFolds.get(props.memory) ?? []))
watch(remembered, (value) => treeFolds.set(props.memory, value))
const closed = computed<Set<string>>({
  get: () => (folds.value ? new Set(folds.value) : remembered.value),
  set: (value) => {
    if (folds.value) folds.value = [...value]
    else remembered.value = value
  },
})
// A folder that is an artifact (a skill) always shows what is in it.
const allFolders = computed(() =>
  folderPaths(props.nodes).filter((path) => !props.entries.has(path)),
)
const openFolders = (paths: string[]) => {
  if (!paths.some((path) => closed.value.has(path))) return
  closed.value = new Set(
    [...closed.value].filter((path) => !paths.includes(path)),
  )
}
const currentPath = computed(() => {
  for (const [path, entry] of props.entries)
    if (
      entry.id === props.current ||
      entry.children?.some(({ id }) => id === props.current)
    )
      return path
  return undefined
})
watch(currentPath, (path) => path && openFolders(parentsOf(path)), {
  immediate: true,
})
const allOpen = computed(() =>
  allFolders.value.every((path) => !closed.value.has(path)),
)
function toggleAll() {
  closed.value = allOpen.value ? new Set(allFolders.value) : new Set()
}

function rowsOf(nodes: FileNode[], parent: string): Row[] {
  const rows: Row[] = nodes.map((node) => {
    const entry = props.entries.get(node.path)
    const children = node.dir
      ? rowsOf(node.children ?? [], node.path)
      : entry?.children?.map((child) => ({
          key: `child:${child.id}`,
          label: child.title,
          child,
        }))
    return {
      key: node.path,
      label: titleOf(node),
      node,
      entry,
      ...(children?.length ? { children } : {}),
    }
  })
  if (creating.value?.parent === parent)
    rows.unshift({ key: '\0new', label: '', field: true })
  return rows
}
const rows = computed(() => rowsOf(shown.value, ''))

// Folders open unless closed (all of them while filtering); an artifact's
// own rows, such as a view's states or a skill's files, are always listed.
const expanded = computed(() => {
  const keys = filtering.value
    ? folderPaths(shown.value)
    : allFolders.value.filter((path) => !closed.value.has(path))
  for (const [path, entry] of props.entries)
    if (entry.children?.length || findNode(props.nodes, path)?.dir)
      keys.push(path)
  return keys
})
function onExpanded(keys: string[]) {
  if (filtering.value) return
  const opened = new Set(keys)
  closed.value = new Set(allFolders.value.filter((path) => !opened.has(path)))
}

const selected = computed(() => {
  const find = (list: Row[]): Row | undefined => {
    for (const row of list) {
      if (row.entry?.id === props.current || row.child?.id === props.current)
        return row
      const inner = row.children && find(row.children)
      if (inner) return inner
    }
    return undefined
  }
  return find(rows.value)
})

type TreeEvent = CustomEvent<{ originalEvent: Event }>
// Selecting doesn't change the tree's own selection (the open artifact is
// the selection): from the keyboard it opens the row.
function onSelect(event: TreeEvent, row: Row) {
  event.preventDefault()
  const keyboard = event.detail.originalEvent.type === 'keydown'
  const to = row.entry?.to ?? row.child?.to
  if (to) {
    if (keyboard) void navigateTo(to)
  } else if (row.node?.dir) {
    if (keyboard) onExpanded(toggled(row.node.path))
  } else if (row.node) props.openFile?.(row.node)
}
const toggled = (path: string) =>
  expanded.value.includes(path)
    ? expanded.value.filter((key) => key !== path)
    : [...expanded.value, path]
// An artifact with rows of its own stays open.
function onToggle(event: TreeEvent, row: Row) {
  if (!row.node?.dir || row.entry) event.preventDefault()
}

const changeable = (node: FileNode) =>
  Boolean(props.editable) && !props.fixed?.(node)

function onRowKeydown(row: Row, event: KeyboardEvent) {
  const node = row.node
  if (!node || !changeable(node)) return
  if (event.key === 'F2') {
    event.preventDefault()
    renaming.value = node.path
  } else if (
    event.key === 'Delete' ||
    (event.key === 'Backspace' && event.metaKey)
  ) {
    event.preventDefault()
    void confirmDelete(node)
  }
}

function startCreate(parent: string, type: string) {
  typed.value = ''
  if (parent) openFolders([parent])
  creating.value = { parent, type }
}
async function created(name: string | null) {
  const target = creating.value
  creating.value = undefined
  if (target && name) await props.create?.(target.parent, target.type, name)
}
async function renamed(node: FileNode, name: string | null) {
  renaming.value = undefined
  if (name && name !== node.name) await props.rename?.(node, name)
}
async function confirmDelete(node: FileNode) {
  const remove = await deleteModal.open({
    name: titleOf(node),
    folder: node.dir,
    hidden: node.dir ? (props.hiddenIn?.(node) ?? []) : [],
    trash: props.trash ?? 'trash',
  }).result
  if (remove) await props.remove?.(node)
}

// Arranging. Not while filtering: the rows shown then aren't a folder's own,
// so only moving into a folder works, as it does where order isn't kept.
type Where = 'before' | 'after' | 'inside'
const dragged = shallowRef<FileNode>()
const dropping = ref<{ path: string; where: Where } | 'end'>()
const container = useTemplateRef<HTMLElement>('container')
const ordering = computed(() => !props.unordered && !filtering.value)
const movesTo = (node: FileNode, folder: string) =>
  props.canMoveTo?.(node, folder) ?? true

const arrangeable = (node?: FileNode): node is FileNode =>
  Boolean(
    node &&
    props.arrange &&
    changeable(node) &&
    (props.movable?.(node) ?? true),
  )
const siblingsOf = (folder: string) =>
  (folder ? findNode(props.nodes, folder)?.children : props.nodes) ?? []

/** Where a drop on this row would put the dragged one, if anywhere. */
function whereOn(row: Row, event: DragEvent): Where | undefined {
  const source = dragged.value
  const node = row.node
  if (!source || !node || within(node.path, source.path)) return undefined
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const y = (event.clientY - box.top) / box.height
  const inOrder = ordering.value
  if (!node.dir) return inOrder ? (y < 0.5 ? 'before' : 'after') : undefined
  // An open folder's contents follow it, so its lower edge is inside it.
  const open = Boolean(row.children) && expanded.value.includes(node.path)
  if (inOrder && y < 0.25) return 'before'
  if (inOrder && y > 0.75 && !open) return 'after'
  return parentOf(source.path) === node.path || !movesTo(source, node.path)
    ? undefined
    : 'inside'
}

async function arrangeIn(node: FileNode, to: string, before: string) {
  if (to === parentOf(node.path)) {
    const siblings = siblingsOf(to).map(({ path }) => path)
    const next = place(siblings, node.path, before)
    if (next.every((path, index) => path === siblings[index])) return
  }
  await props.arrange?.(node, to, before)
}
function dropOn(source: FileNode, target: FileNode | null, where: Where) {
  if (!target)
    return !ordering.value
      ? parentOf(source.path) &&
          movesTo(source, '') &&
          props.arrange?.(source, '')
      : arrangeIn(source, '', '')
  if (where === 'inside') return props.arrange?.(source, target.path)
  const folder = parentOf(target.path)
  const others = siblingsOf(folder)
    .map(({ path }) => path)
    .filter((path) => path !== source.path)
  const before =
    where === 'before'
      ? target.path
      : (others[others.indexOf(target.path) + 1] ?? '')
  return arrangeIn(source, folder, before)
}

/** Where the line showing a drop sits on a row: before it, after it, or nowhere. */
function lineOn(row: Row): 'before' | 'after' | undefined {
  const drop = dropping.value
  // A row without a file (a view's state) is never a drop's place.
  if (!row.node || !drop || drop === 'end' || drop.path !== row.node.path)
    return undefined
  return drop.where === 'inside' ? undefined : drop.where
}

/** A row's dragging: out with its address, and within the tree. */
function dragging(row: Row) {
  const to = row.entry?.to ?? row.child?.to
  const href = to && props.linkOf?.(to)
  const node = row.node
  const drop = dropping.value
  const leave = () => {
    const now = dropping.value
    if (now && now !== 'end' && now.path === node?.path)
      dropping.value = undefined
  }
  return {
    draggable: Boolean(href) || arrangeable(node),
    'data-drop':
      drop && drop !== 'end' && drop.path === node?.path
        ? drop.where
        : undefined,
    onDragstart(event: DragEvent) {
      const data = event.dataTransfer
      if (!data) return
      if (href) {
        data.setData('text/uri-list', href)
        data.setData('text/plain', href)
      }
      if (arrangeable(node)) {
        dragged.value = node
        if (!href) data.setData('text/plain', node.name)
      }
      data.effectAllowed = 'all'
    },
    onDragover(event: DragEvent) {
      event.stopPropagation()
      const where = whereOn(row, event)
      if (!where) return leave()
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
      dropping.value = { path: node!.path, where }
    },
    onDragleave(event: DragEvent) {
      const into = event.relatedTarget as Node | null
      if (!into || !(event.currentTarget as Element).contains(into)) leave()
    },
    onDrop(event: DragEvent) {
      event.stopPropagation()
      const where = whereOn(row, event)
      const source = dragged.value
      dragged.value = undefined
      dropping.value = undefined
      if (!where || !source) return
      event.preventDefault()
      void dropOn(source, node!, where)
    },
    onDragend() {
      dragged.value = undefined
      dropping.value = undefined
    },
  }
}
const endDrop = {
  onDragover(event: DragEvent) {
    if (!dragged.value || !movesTo(dragged.value, '')) return
    event.preventDefault()
    dropping.value = 'end'
  },
  onDragleave() {
    if (dropping.value === 'end') dropping.value = undefined
  },
  onDrop(event: DragEvent) {
    const source = dragged.value
    dragged.value = undefined
    dropping.value = undefined
    if (!source) return
    event.preventDefault()
    void dropOn(source, null, 'inside')
  },
}

// A row moved from the keyboard keeps the focus while the tree is drawn
// again, which happens more than once as the change comes back from the
// dev server, until you do something else.
let keepFocus: string | undefined
function refocus() {
  if (keepFocus === undefined) return
  const element = container.value?.querySelector<HTMLElement>(
    `[data-tree-path="${CSS.escape(keepFocus)}"]`,
  )
  if (element && document.activeElement !== element) element.focus()
}
watch(rows, () => nextTick(refocus), { flush: 'post' })
const letFocusGo = () => (keepFocus = undefined)

// Alt+↑/↓ on a row, before the tree moves the focus with the arrows.
async function onArrangeKey(event: KeyboardEvent) {
  if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown'))
    return letFocusGo()
  const path = (event.target as Element | null)
    ?.closest('[data-tree-path]')
    ?.getAttribute('data-tree-path')
  const node = path == null ? undefined : findNode(props.nodes, path)
  if (!arrangeable(node) || !ordering.value) return
  event.preventDefault()
  event.stopPropagation()
  const folder = parentOf(node.path)
  const siblings = siblingsOf(folder)
  const at = siblings.findIndex((sibling) => sibling.path === node.path)
  const up = event.key === 'ArrowUp'
  if (up ? at <= 0 : at < 0 || at >= siblings.length - 1) return
  keepFocus = node.path
  await arrangeIn(
    node,
    folder,
    up ? siblings[at - 1]!.path : (siblings[at + 2]?.path ?? ''),
  )
  await nextTick()
  refocus()
}

const later = (action: () => unknown) =>
  afterMenuCloses(action, () => undefined)
const optionsIn = (folder: string) =>
  typeof props.newOptions === 'function'
    ? props.newOptions(folder)
    : (props.newOptions ?? [])
/** Makes something: inline with a name field, or through its own dialog. */
const make = (parent: string, option: NewFileOption) =>
  option.onSelect ? option.onSelect() : startCreate(parent, option.type)
const newItems = (parent: string) =>
  optionsIn(parent).map((option) => ({
    label: option.label,
    icon: option.icon,
    onSelect: later(() => make(parent, option)),
  }))
const topOptions = computed(() => optionsIn(''))

// The menu of the row it opened on.
const target = shallowRef<FileNode>()
function menuOf(node: FileNode): ContextMenuItem[][] {
  const { reach, change } = props.actions?.(node) ?? { reach: [], change: [] }
  const mutable = changeable(node)
  return menuGroups<ContextMenuItem>([
    node.dir && props.editable ? newItems(node.path) : [],
    reach,
    [
      ...change,
      mutable && {
        label: t('files.rename'),
        icon: 'i-lucide-pencil',
        onSelect: later(() => (renaming.value = node.path)),
      },
    ],
    [
      mutable && {
        label: t('files.delete.action'),
        icon: 'i-lucide-trash-2',
        color: 'error' as const,
        onSelect: later(() => confirmDelete(node)),
      },
    ],
  ])
}
const menu = computed(() => (target.value ? menuOf(target.value) : []))
// Before the menu opens: a row with nothing to offer keeps the browser's.
function pick(event: MouseEvent) {
  const path = (event.target as Element | null)
    ?.closest('[data-tree-path]')
    ?.getAttribute('data-tree-path')
  const node =
    path === null || path === undefined
      ? undefined
      : findNode(props.nodes, path)
  if (!node || !menuOf(node).length) {
    event.stopPropagation()
    return
  }
  target.value = node
}

const newMenu = computed<DropdownMenuItem[]>(() => newItems(''))
// A closing menu gives focus back to where it opened, unless a name field
// it started has it: leaving the field would confirm the name.
const keepNameField = (event: Event) => {
  if (creating.value || renaming.value) event.preventDefault()
}
const extension = (name: string) => {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, '']
}
</script>

<template>
  <div
    :class="['group/tree flex min-h-0 flex-col', branch ? 'gap-0.5' : 'gap-1']"
  >
    <div
      :class="[
        'flex h-7 shrink-0 items-center gap-0.5',
        branch ? 'min-w-0' : 'pr-0.5 pl-2',
      ]"
    >
      <template v-if="branch?.to">
        <UButton
          :icon="
            branchOpen ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'
          "
          color="neutral"
          variant="ghost"
          size="xs"
          square
          :aria-label="t('files.toggle', { name: branch.label })"
          :aria-expanded="branchOpen"
          class="shrink-0"
          @click.stop.prevent="() => void (branchOpen = !branchOpen)"
        />
        <ULink
          :to="branch.to"
          :title="branch.path"
          :aria-current="route.path === branch.to ? 'page' : undefined"
          :class="[
            'flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary',
            route.path === branch.to
              ? 'bg-elevated text-highlighted'
              : 'text-default hover:bg-elevated/50',
          ]"
        >
          <UIcon
            v-if="branch.icon"
            :name="branch.icon"
            class="size-3.5 shrink-0 text-muted"
          />
          <span class="truncate">{{ branch.label }}</span>
        </ULink>
      </template>
      <button
        v-else-if="branch"
        type="button"
        :title="branch.path"
        :aria-expanded="branchOpen"
        class="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 text-left text-xs font-medium text-default outline-none hover:bg-elevated/50 focus-visible:ring-2 focus-visible:ring-primary"
        @click="branchOpen = !branchOpen"
      >
        <UIcon
          :name="
            branchOpen ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'
          "
          class="size-3.5 shrink-0 text-muted"
        />
        <UIcon
          v-if="branch.icon"
          :name="branch.icon"
          class="size-3.5 shrink-0 text-muted"
        />
        <span class="truncate">{{ branch.label }}</span>
      </button>
      <p
        v-else
        class="min-w-0 flex-1 truncate text-xs font-semibold text-highlighted"
      >
        {{ heading }}
      </p>
      <div
        v-if="!branch"
        :class="[
          'flex items-center gap-0.5 transition-opacity',
          !filterOpen &&
            'opacity-0 group-focus-within/tree:opacity-100 group-hover/tree:opacity-100 [@media(hover:none)]:opacity-100',
        ]"
      >
        <UTooltip :text="t('files.filter')">
          <UButton
            icon="i-lucide-search"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :aria-label="t('files.filter')"
            :aria-pressed="filterOpen"
            @click="toggleFilter"
          />
        </UTooltip>
        <UTooltip
          v-if="allFolders.length"
          :text="allOpen ? t('files.collapseAll') : t('files.expandAll')"
        >
          <UButton
            :icon="
              allOpen
                ? 'i-lucide-chevrons-down-up'
                : 'i-lucide-chevrons-up-down'
            "
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :aria-label="
              allOpen ? t('files.collapseAll') : t('files.expandAll')
            "
            @click="toggleAll"
          />
        </UTooltip>
      </div>
      <!-- Always shown, and last, so the tools fading in beside it never
           move it. -->
      <template v-if="editable && topOptions.length">
        <UTooltip v-if="topOptions.length === 1" :text="t('files.new')">
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :aria-label="t('files.new')"
            @click="make('', topOptions[0]!)"
          />
        </UTooltip>
        <UDropdownMenu
          v-else
          :items="newMenu"
          :content="{ align: 'end', onCloseAutoFocus: keepNameField }"
          :ui="{ content: 'min-w-40' }"
        >
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :aria-label="t('files.new')"
          />
        </UDropdownMenu>
      </template>
    </div>
    <div
      v-show="!branch || branchOpen"
      :class="['flex min-h-0 flex-col gap-1', branch && 'pl-4']"
    >
      <UInput
        v-if="filterOpen"
        ref="filter"
        v-model="typed"
        size="sm"
        icon="i-lucide-search"
        :placeholder="t(`files.filterKind.${kind}`)"
        :aria-label="t(`files.filterKind.${kind}`)"
        class="mx-1 shrink-0"
        @keydown="onFilterKeydown"
      >
        <template v-if="typed" #trailing>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="link"
            size="xs"
            square
            :aria-label="t('files.clearFilter')"
            @click="clearFilter"
          />
        </template>
      </UInput>
      <p
        v-if="filtering && !shown.length && !branch"
        class="px-2.5 py-1 text-xs text-muted"
      >
        {{ t(`files.noMatches.${kind}`) }}
      </p>
      <p
        v-if="branch && !filtering && !nodes.length && !creating"
        class="px-2 py-1 text-xs text-muted"
      >
        {{ t('files.emptyFolder') }}
      </p>
      <UContextMenu
        :items="menu"
        :content="{ onCloseAutoFocus: keepNameField }"
        :ui="{ content: 'min-w-44' }"
      >
        <div
          ref="container"
          class="flex min-h-0 flex-col"
          @contextmenu.capture="pick"
          @keydown.capture="onArrangeKey"
          @pointerdown.capture="letFocusGo"
        >
          <UTree
            :items="rows"
            :get-key="(row: Row) => row.key"
            :expanded="expanded"
            :model-value="selected"
            :aria-label="heading"
            color="neutral"
            size="sm"
            :on-select="onSelect"
            :on-toggle="onToggle"
            @update:expanded="onExpanded"
          >
            <template
              #item-wrapper="{
                item,
                expanded: isOpen,
                selected: isSelected,
                ui,
              }"
            >
              <div
                v-if="item.field || (item.node && renaming === item.node.path)"
                :class="
                  ui.link({
                    class: 'gap-1.5 py-0.5',
                    selected: false,
                    disabled: false,
                  })
                "
              >
                <FileNameField
                  v-if="item.field"
                  :initial="
                    creating?.type === 'folder'
                      ? t('files.newFolderName')
                      : t('files.untitled')
                  "
                  @done="created"
                />
                <FileNameField
                  v-else
                  :initial="item.node!.name"
                  @done="renamed(item.node!, $event)"
                />
              </div>
              <div
                v-else-if="item.entry || item.child"
                :data-tree-path="item.node?.path"
                v-bind="dragging(item)"
                :class="
                  ui.link({
                    class: [
                      'relative gap-1.5',
                      dragged && dragged === item.node && 'opacity-50',
                      item.node &&
                        dropping !== 'end' &&
                        dropping?.path === item.node.path &&
                        dropping.where === 'inside' &&
                        'bg-elevated ring-1 ring-inset ring-primary/50',
                    ],
                    selected: isSelected,
                    disabled: false,
                  })
                "
                @keydown="onRowKeydown(item, $event)"
              >
                <span
                  v-if="lineOn(item)"
                  aria-hidden="true"
                  :data-drop-line="lineOn(item)"
                  :class="[
                    'pointer-events-none absolute inset-x-1 z-10 h-0.5 rounded-full bg-primary',
                    lineOn(item) === 'before' ? '-top-px' : '-bottom-px',
                  ]"
                />
                <NuxtLink
                  :to="(item.entry ?? item.child)!.to"
                  tabindex="-1"
                  :title="item.node && hover(item.node)"
                  :aria-current="isSelected ? 'page' : undefined"
                  class="flex min-w-0 flex-1 items-center gap-1.5 outline-none after:absolute after:inset-0"
                >
                  <UIcon
                    v-if="item.entry"
                    :name="item.entry.icon"
                    class="size-4 shrink-0 text-muted"
                  />
                  <span class="min-w-0 truncate">{{ item.label }}</span>
                </NuxtLink>
              </div>
              <div
                v-else-if="item.node?.dir"
                :data-tree-path="item.node.path"
                :title="hover(item.node)"
                v-bind="dragging(item)"
                :class="
                  ui.link({
                    class: [
                      'relative gap-1.5 cursor-default font-medium',
                      dragged && dragged === item.node && 'opacity-50',
                      dropping !== 'end' &&
                        dropping?.path === item.node.path &&
                        dropping.where === 'inside' &&
                        'bg-elevated ring-1 ring-inset ring-primary/50',
                    ],
                    selected: false,
                    disabled: false,
                  })
                "
                @keydown="onRowKeydown(item, $event)"
              >
                <span
                  v-if="lineOn(item)"
                  aria-hidden="true"
                  :data-drop-line="lineOn(item)"
                  :class="[
                    'pointer-events-none absolute inset-x-1 z-10 h-0.5 rounded-full bg-primary',
                    lineOn(item) === 'before' ? '-top-px' : '-bottom-px',
                  ]"
                />
                <UIcon
                  name="i-lucide-chevron-right"
                  :class="[
                    'size-4 shrink-0 text-muted transition-transform',
                    isOpen && 'rotate-90',
                    !item.children && 'opacity-0',
                  ]"
                />
                <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              </div>
              <div
                v-else
                :data-tree-path="item.node?.path"
                :title="t('files.openInEditor')"
                v-bind="dragging(item)"
                :class="
                  ui.link({
                    class: [
                      'relative gap-1.5 text-muted',
                      dragged && dragged === item.node && 'opacity-50',
                    ],
                    selected: false,
                    disabled: false,
                  })
                "
                @keydown="onRowKeydown(item, $event)"
              >
                <span
                  v-if="lineOn(item)"
                  aria-hidden="true"
                  :data-drop-line="lineOn(item)"
                  :class="[
                    'pointer-events-none absolute inset-x-1 z-10 h-0.5 rounded-full bg-primary',
                    lineOn(item) === 'before' ? '-top-px' : '-bottom-px',
                  ]"
                />
                <UIcon
                  name="i-lucide-file"
                  class="size-4 shrink-0 opacity-70"
                />
                <span class="min-w-0 flex-1 truncate"
                  >{{ extension(item.label)[0]
                  }}<span class="text-dimmed">{{
                    extension(item.label)[1]
                  }}</span></span
                >
              </div>
            </template>
          </UTree>
          <!-- Below the rows: the top level, last. In a branch, only while
             dragging, so the navigation around it keeps its spacing. -->
          <div
            v-if="editable && arrange && (!branch || dragged)"
            data-testid="tree-end"
            v-bind="endDrop"
            :class="[
              'relative flex-1',
              branch ? 'min-h-6' : 'min-h-8',
              dropping === 'end' &&
                'before:absolute before:inset-x-1 before:top-0 before:h-0.5 before:rounded-full before:bg-primary',
            ]"
          />
        </div>
      </UContextMenu>
    </div>
  </div>
</template>
