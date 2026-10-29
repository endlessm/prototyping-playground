<script setup lang="ts">
import type { ContextMenuItem, DropdownMenuItem } from '@nuxt/ui'
import { artifactTitle } from '../../../tooling/manifest/titles'
import {
  filterNodes,
  findNode,
  folderPaths,
  parentsOf,
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
// Creating and renaming use an inline name field. What happens to the
// files is the caller's: it passes the changes as functions, and the menu
// actions for each row.
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
  newOptions?: NewFileOption[]
  /** Rows that can't be renamed or deleted, such as meta.json. */
  fixed?: (node: FileNode) => boolean
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
  /** A file that isn't an artifact was chosen. */
  openFile?: (node: FileNode) => void
}>()

const { t } = useI18n()
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

const titleOf = (node: FileNode) =>
  props.entries.get(node.path)?.title ??
  (node.dir && !node.name.startsWith('_')
    ? artifactTitle(node.name)
    : node.name)

// Filtering.
const filterOpen = ref(false)
const query = ref('')
const filtering = computed(() => Boolean(query.value.trim()))
const filterInput = useTemplateRef<{ inputRef?: HTMLInputElement }>('filter')
const shown = computed(() => filterNodes(props.nodes, query.value, titleOf))
async function toggleFilter() {
  filterOpen.value = !filterOpen.value
  if (!filterOpen.value) return void (query.value = '')
  await nextTick()
  filterInput.value?.inputRef?.focus()
}
function clearFilter() {
  query.value = ''
  filterInput.value?.inputRef?.focus()
}
function onFilterKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  if (query.value) query.value = ''
  else filterOpen.value = false
}

// Editing names.
const creating = shallowRef<{ parent: string; type: string }>()
const renaming = ref<string>()

// Folds: folders start open; the ones you close stay closed.
const closed = ref(new Set(treeFolds.get(props.memory) ?? []))
watch(closed, (value) => treeFolds.set(props.memory, value))
const allFolders = computed(() => folderPaths(props.nodes))
const open = (paths: string[]) => {
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
watch(currentPath, (path) => path && open(parentsOf(path)), {
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
// own rows, such as a view's states, are always listed.
const expanded = computed(() => {
  const keys = filtering.value
    ? folderPaths(shown.value)
    : allFolders.value.filter((path) => !closed.value.has(path))
  for (const [path, entry] of props.entries)
    if (entry.children?.length) keys.push(path)
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
  if (!row.node?.dir) event.preventDefault()
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
  query.value = ''
  if (parent) open([parent])
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

const later = (action: () => unknown) =>
  afterMenuCloses(action, () => undefined)
const newItems = (parent: string) =>
  (props.newOptions ?? []).map((option) => ({
    label: option.label,
    icon: option.icon,
    onSelect: later(() => startCreate(parent, option.type)),
  }))

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
  <div class="group/tree flex min-h-0 flex-col gap-1">
    <div class="flex h-7 shrink-0 items-center gap-0.5 pr-0.5 pl-2">
      <p class="min-w-0 flex-1 truncate text-xs font-semibold text-highlighted">
        {{ heading }}
      </p>
      <div
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
      <template v-if="editable && newOptions?.length">
        <UTooltip v-if="newOptions.length === 1" :text="t('files.new')">
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            :aria-label="t('files.new')"
            @click="startCreate('', newOptions[0]!.type)"
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
    <UInput
      v-if="filterOpen"
      ref="filter"
      v-model="query"
      size="sm"
      icon="i-lucide-search"
      :placeholder="t(`files.filterKind.${kind}`)"
      :aria-label="t(`files.filterKind.${kind}`)"
      class="mx-1 shrink-0"
      @keydown="onFilterKeydown"
    >
      <template v-if="query" #trailing>
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
    <p v-if="filtering && !shown.length" class="px-2.5 py-1 text-xs text-muted">
      {{ t(`files.noMatches.${kind}`) }}
    </p>
    <UContextMenu
      :items="menu"
      :content="{ onCloseAutoFocus: keepNameField }"
      :ui="{ content: 'min-w-44' }"
    >
      <div class="min-h-0" @contextmenu.capture="pick">
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
            #item-wrapper="{ item, expanded: isOpen, selected: isSelected, ui }"
          >
            <div
              v-if="item.field || renaming === item.node?.path"
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
              :class="
                ui.link({
                  class: 'gap-1.5',
                  selected: isSelected,
                  disabled: false,
                })
              "
              @keydown="onRowKeydown(item, $event)"
            >
              <UIcon
                v-if="item.entry"
                :name="item.entry.icon"
                class="size-4 shrink-0 text-muted"
              />
              <NuxtLink
                :to="(item.entry ?? item.child)!.to"
                tabindex="-1"
                :title="item.node?.name"
                :aria-current="isSelected ? 'page' : undefined"
                class="min-w-0 flex-1 truncate outline-none after:absolute after:inset-0"
              >
                {{ item.label }}
              </NuxtLink>
            </div>
            <div
              v-else-if="item.node?.dir"
              :data-tree-path="item.node.path"
              :title="item.node.name"
              :class="
                ui.link({
                  class: 'gap-1.5 cursor-default font-medium',
                  selected: false,
                  disabled: false,
                })
              "
              @keydown="onRowKeydown(item, $event)"
            >
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
              :class="
                ui.link({
                  class: 'gap-1.5 text-muted',
                  selected: false,
                  disabled: false,
                })
              "
              @keydown="onRowKeydown(item, $event)"
            >
              <UIcon name="i-lucide-file" class="size-4 shrink-0 opacity-70" />
              <span class="min-w-0 flex-1 truncate"
                >{{ extension(item.label)[0]
                }}<span class="text-dimmed">{{
                  extension(item.label)[1]
                }}</span></span
              >
            </div>
          </template>
        </UTree>
      </div>
    </UContextMenu>
  </div>
</template>
