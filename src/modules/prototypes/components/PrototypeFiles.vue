<script setup lang="ts">
import types from '#studio/file-types'
import type { ContextMenuItem } from '@nuxt/ui'
import { useClipboard } from '@vueuse/core'
import FileTree from '../../../../app/components/files/FileTree.vue'
import {
  refreshManifest,
  type ManifestArtifact,
  type ManifestPrototype,
} from '../../../../app/composables/useManifest'
import {
  useFileTree,
  useShowAllFiles,
} from '../../../../app/composables/useFileTree'
import { usePreviewDocument } from '../../../../app/composables/useSystems'
import {
  clashHint,
  findNode,
  hiddenInside,
  nodesFromPaths,
  visibleNodes,
  within,
  type FileNode,
  type FileTreeEntry,
  type NewFileOption,
} from '../../../../app/utils/fileTree'
import { afterMenuCloses } from '../../../../app/utils/menus'
import { onApple, shortcutLabel } from '../../../../app/utils/shortcuts'
import { artifactTitle } from '../../../../tooling/manifest/titles'
import { previewAddress } from '../../../../tooling/preview/protocol'

// A prototype's files in its navigation. Locally, the real files and
// folders, live from the dev server's file service; artifacts open here,
// other files (shown with "Show all files") in your code editor. Where you
// may change the prototype you can create, rename and delete, drag rows to
// arrange or move them (the order is saved in meta.json), and switch a view
// to lo-fi; renames and moves repair the references in other files. On the
// deployed site, the published artifacts with their folders, in order, with
// menus to copy their links and paths. Anywhere, a view's menu opens its
// preview document alone in a new tab (a fresh runtime, for people and
// browser tools), and an artifact's row dragged out carries its web address,
// as for a canvas.
const props = defineProps<{
  prototype: ManifestPrototype
  artifacts: ManifestArtifact[]
  /** The artifact or named state open now. */
  current?: string
}>()

const { t } = useI18n()
const toast = useStudioToast()
const route = useRoute()
const base = useRuntimeConfig().app.baseURL
const { copy } = useClipboard({ legacy: true })
const previewDocument = usePreviewDocument()
const showAll = useShowAllFiles()
const { listing, reload, change } = useFileTree(() => props.prototype.id)

const local = computed(() => import.meta.dev && listing.value !== null)
// Locally, until the file service answers, the tree is the published one.
const loading = computed(() => import.meta.dev && listing.value === null)
const editable = computed(() => local.value && listing.value!.editable)
const folder = computed(() => listing.value?.folder ?? props.prototype.folder)
const pathOf = (artifact: ManifestArtifact) =>
  artifact.file.slice(props.prototype.folder.length + 1)
const address = (id: string) =>
  `/prototypes/${props.prototype.id}/artifacts/${id}`
/** An address in the app as a full web address. */
const webAddress = (to: string) =>
  new URL(`${base}${to.slice(1)}`, location.href).href

const entries = computed(
  () =>
    new Map<string, FileTreeEntry>(
      props.artifacts.map((artifact) => [
        pathOf(artifact),
        {
          id: artifact.id,
          title: artifact.title,
          to: address(artifact.id),
          icon: types[artifact.type]?.icon ?? 'i-lucide-file',
          children: artifact.states?.map((state) => ({
            id: state.id,
            title: state.title,
            to: address(state.id),
          })),
        },
      ]),
    ),
)
const byPath = computed(
  () =>
    new Map(props.artifacts.map((artifact) => [pathOf(artifact), artifact])),
)
const artifactPaths = computed(() => new Set(byPath.value.keys()))

const all = computed(() => listing.value?.nodes ?? [])
const nodes = computed(() => {
  if (!local.value) return nodesFromPaths([...artifactPaths.value])
  return showAll.value
    ? all.value
    : visibleNodes(all.value, artifactPaths.value)
})
const showingAll = computed(() => local.value && showAll.value)

// Views (this module's own type) first, then the other installed types.
const typeOrder = Object.keys(types).sort(
  (a, b) => Number(b === 'view') - Number(a === 'view'),
)
const newOptions = computed<NewFileOption[]>(() => [
  ...typeOrder.map((type) => ({
    type,
    label: t('files.newType', { type: types[type]!.label.toLowerCase() }),
    icon: types[type]!.icon ?? 'i-lucide-file',
  })),
  { type: 'folder', label: t('files.newFolder'), icon: 'i-lucide-folder-plus' },
])

const repoPath = (node: FileNode) => `${folder.value}/${node.path}`
const revealLabel = computed(() => {
  if (onApple()) return t('files.reveal.apple')
  return /Win/.test(navigator.userAgent)
    ? t('files.reveal.windows')
    : t('files.reveal.other')
})

const failed = (message: string) => toast.error(message)
const later = (action: () => unknown) => afterMenuCloses(action, failed)

async function copied(text: string, done: string) {
  await copy(text)
  toast.success(done)
}

async function open(node: FileNode) {
  try {
    const reply = await change<{ opened: boolean; message?: string }>({
      op: 'open',
      path: node.path,
    })
    if (!reply.opened && reply.message) toast.success(reply.message)
  } catch (error) {
    failed((error as Error).message)
  }
}

function actions(node: FileNode) {
  const artifact = byPath.value.get(node.path)
  const reach: (ContextMenuItem | false)[] = [
    local.value &&
      Boolean(artifact) && {
        label: editable.value
          ? t('artifact.editSource')
          : t('artifact.viewSource'),
        icon: 'i-lucide-code-xml',
        kbds: [shortcutLabel('source')],
        onSelect: later(() =>
          navigateTo({
            path: address(artifact!.id),
            query: { mode: 'source' },
          }),
        ),
      },
    artifact?.type === 'view' &&
      !props.prototype.systemMissing && {
        label: t('prototypes.openInTab'),
        icon: 'i-lucide-external-link',
        to: previewAddress(
          previewDocument(props.prototype.systemId),
          artifact.id,
        ),
        target: '_blank',
        external: true,
      },
    local.value &&
      !node.dir && {
        label: t('files.openInEditor'),
        icon: 'i-lucide-square-pen',
        onSelect: later(() => open(node)),
      },
    local.value && {
      label: revealLabel.value,
      icon: 'i-lucide-folder-open',
      onSelect: later(() => change({ op: 'reveal', path: node.path })),
    },
    Boolean(artifact) && {
      label: t('actions.copyLink'),
      icon: 'i-lucide-link',
      onSelect: later(() =>
        copied(webAddress(address(artifact!.id)), t('actions.linkCopied')),
      ),
    },
    {
      label: t('actions.copyPath'),
      icon: 'i-lucide-copy',
      onSelect: later(() => copied(repoPath(node), t('actions.pathCopied'))),
    },
  ]
  const change_: (ContextMenuItem | false)[] = [
    editable.value &&
      Boolean(artifact && types[artifact.type]?.fidelity) && {
        label: artifact!.lofi
          ? t('prototypes.makeHifi')
          : t('prototypes.makeLofi'),
        icon: 'i-lucide-paintbrush',
        onSelect: later(() =>
          change({ op: 'lofi', artifact: artifact!.id, lofi: !artifact!.lofi }),
        ),
      },
  ]
  return {
    reach: reach.filter((item): item is ContextMenuItem => Boolean(item)),
    change: change_.filter((item): item is ContextMenuItem => Boolean(item)),
  }
}

/** Runs a change; a refusal shows as a message, with a hint if needed. */
async function run<T>(operation: Parameters<typeof change>[0]) {
  try {
    const reply = await change<T>(operation)
    await reload()
    return reply
  } catch (error) {
    const message = (error as Error).message
    failed(
      clashHint(message, all.value, nodes.value)
        ? `${message} ${t('files.hiddenHint')}`
        : message,
    )
    await reload()
    return undefined
  }
}

async function create(parent: string, type: string, name: string) {
  const created = await run<{ path: string; artifact?: string }>({
    op: 'create',
    parent,
    name,
    type,
  })
  // A new artifact opens right away.
  if (created?.artifact) {
    await refreshManifest()
    await navigateTo(address(created.artifact))
  }
}

// The open page's address is its permanent ID, so it stays across renames
// and moves, wherever they are made.
async function rename(node: FileNode, name: string) {
  const reply = await run<{ relinked: number }>({
    op: 'rename',
    path: node.path,
    name,
  })
  if (reply?.relinked) toast.success(t('files.renamedRelinked'))
}

async function arrange(node: FileNode, to: string, before?: string) {
  const reply = await run<{ moved: boolean; relinked: number }>(
    before === undefined
      ? { op: 'move', path: node.path, to }
      : { op: 'reorder', path: node.path, to, before },
  )
  if (reply?.moved && reply.relinked) toast.success(t('files.movedRelinked'))
}

async function remove(node: FileNode) {
  const name =
    byPath.value.get(node.path)?.title ??
    (node.dir && !node.name.startsWith('_')
      ? artifactTitle(node.name)
      : node.name)
  const open = props.artifacts.find(
    (artifact) =>
      artifact.id === props.current ||
      artifact.states?.some(({ id }) => id === props.current),
  )
  const reply = await run<{ trashedTo: 'recycle-bin' | 'trash' }>({
    op: 'delete',
    path: node.path,
  })
  if (!reply) return
  toast.success(
    t('files.deleted', { name, place: t(`files.trash.${reply.trashedTo}`) }),
  )
  // Leave a deleted artifact for the prototype's first one.
  if (open && within(pathOf(open), node.path) && route.params.artifactId)
    await navigateTo(`/prototypes/${props.prototype.id}`, { replace: true })
}
const trash = /Win/.test(navigator.userAgent) ? 'recycle-bin' : 'trash'
</script>

<template>
  <nav
    :aria-label="prototype.title"
    :aria-busy="loading || undefined"
    class="flex min-h-0 flex-col"
  >
    <FileTree
      :heading="showingAll ? t('files.files') : t('files.artifacts')"
      :kind="showingAll ? 'files' : 'artifacts'"
      :nodes="nodes"
      :entries="entries"
      :current="current"
      :memory="prototype.id"
      :editable="editable"
      :new-options="newOptions"
      :fixed="(node: FileNode) => node.path === 'meta.json'"
      :actions="actions"
      :hidden-in="
        (node: FileNode) => {
          const full = findNode(all, node.path)
          return showingAll || !full ? [] : hiddenInside(full, artifactPaths)
        }
      "
      :trash="trash"
      :create="create"
      :rename="rename"
      :remove="remove"
      :arrange="arrange"
      :link-of="webAddress"
      :open-file="open"
    />
  </nav>
</template>
