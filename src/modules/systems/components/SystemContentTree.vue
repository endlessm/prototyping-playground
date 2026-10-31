<script setup lang="ts">
import type { ContextMenuItem } from '@nuxt/ui'
import FileTree from '../../../../app/components/files/FileTree.vue'
import type {
  FileNode,
  FileTreeEntry,
  NewFileOption,
} from '../../../../app/utils/fileTree'
import { within } from '../../../../app/utils/fileTree'
import { menuGroups } from '../../../../app/utils/menus'
import { shortcutLabel } from '../../../../app/utils/shortcuts'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import {
  contentProblem,
  creatableIn,
  isSkillFile,
  isSkillFolder,
  type ContentSection,
  type NewKind,
} from '../../../../tooling/systems/content-rules'
import { isBinaryFile } from '../../../../tooling/systems/text-files'
import { useCopy } from '../composables/useCopy'
import { useSystemCatalog } from '../composables/useSystemCatalog'
import type { SystemTreeOperation } from '../composables/useSystemTree'
import { systemAddress } from '../utils/pages'
import { followed, sectionAddress } from '../utils/trees'

// A system's Context or Skills in its navigation: the shared file tree as a
// branch, its heading linking to the section's page. Documents (and a
// skill's text files) open their pages; each skill is its folder, standing
// for its SKILL.md. Locally, an Admin or one of the system's maintainers
// makes documents and folders in Context, skills through New skill, and
// files and folders inside a skill; renames, drags rows into folders of the
// same section, and deletes to the computer's trash, as the sections' rules
// allow (`tooling/systems/content-rules.ts`). The open page follows its
// file. Changes go through the dev server's file service.
const props = defineProps<{
  system: SystemCatalog
  section: ContentSection
  nodes: FileNode[]
  entries: Map<string, FileTreeEntry>
  /** Whether you may change the files: locally, once the service says so. */
  editable: boolean
  change: <T>(operation: SystemTreeOperation) => Promise<T>
  reload: () => Promise<void>
  query?: string
}>()
const open = defineModel<boolean>('open', { required: true })
const closed = defineModel<string[]>('closed', { required: true })

const { t } = useI18n()
const route = useRoute()
const toast = useStudioToast()
const copy = useCopy()
const { reload: reloadCatalog } = await useSystemCatalog()

const label = computed(() => t(`systems.pages.${props.section}`))
const folder = computed(() => `${props.system.folder}/${props.section}/`)
const repoPath = (node: FileNode) => `${folder.value}${node.path}`

// The New skill dialog, made when first opened, only in development.
const overlay = import.meta.dev ? useOverlay() : undefined
let skillModal: ReturnType<NonNullable<typeof overlay>['create']> | undefined
async function newSkill() {
  skillModal ??= overlay!.create(
    defineAsyncComponent(() => import('./SystemSkillModal.vue')),
  )
  const path = (await skillModal.open({
    create: async (name: string, description: string) =>
      (await props.change<{ path: string }>({ op: 'skill', name, description }))
        .path,
  }).result) as string | undefined
  if (!path) return
  await settled()
  await navigateTo(sectionAddress(props.system, 'skills', path))
}

const KINDS: Record<NewKind, { label: string; icon: string }> = {
  document: { label: 'systems.tree.newDocument', icon: 'i-lucide-file-plus' },
  folder: { label: 'files.newFolder', icon: 'i-lucide-folder-plus' },
  file: { label: 'systems.tree.newFile', icon: 'i-lucide-file-plus' },
  skill: { label: 'systems.tree.newSkill', icon: 'i-lucide-wand-sparkles' },
}
const newOptions = (parent: string): NewFileOption[] =>
  creatableIn(props.section, parent).map((kind) => ({
    type: kind,
    label: t(KINDS[kind].label),
    icon: KINDS[kind].icon,
    ...(kind === 'skill' ? { onSelect: () => void newSkill() } : {}),
  }))

function actions(node: FileNode) {
  const entry = props.entries.get(node.path)
  const reach: (ContextMenuItem | false)[] = [
    import.meta.dev &&
      Boolean(entry) && {
        label: t('systems.fileActions.editSource'),
        icon: 'i-lucide-code-xml',
        kbds: [shortcutLabel('source')],
        onSelect: () =>
          navigateTo({ path: entry!.to, query: { mode: 'source' } }),
      },
    Boolean(entry) && {
      label: t('actions.copyLink'),
      icon: 'i-lucide-link',
      onSelect: copy.link(entry!.to),
    },
    import.meta.dev && {
      label: t('actions.copyPath'),
      icon: 'i-lucide-copy',
      onSelect: copy.path(
        isSkillFolder(props.section, node.path, node.dir)
          ? `${repoPath(node)}/`
          : repoPath(node),
      ),
    },
  ]
  return {
    reach: menuGroups<ContextMenuItem>([reach]).flat(),
    change: [],
  }
}

/** The catalog has the change, so the pages it touches show it. */
async function settled() {
  await props.reload()
  await reloadCatalog()
}

/** Runs a change; a refusal shows as a message. */
async function run<T>(operation: SystemTreeOperation) {
  try {
    const reply = await props.change<T>(operation)
    await settled()
    return reply
  } catch (error) {
    toast.error((error as Error).message)
    await props.reload()
    return undefined
  }
}

async function create(parent: string, kind: string, name: string) {
  const made = await run<{ path: string }>({
    op: 'create',
    section: props.section,
    parent,
    name,
    kind: kind as 'document' | 'file' | 'folder',
  })
  // A new document or text file opens right away.
  if (made && kind !== 'folder' && !isBinaryFile(made.path))
    await navigateTo(sectionAddress(props.system, props.section, made.path))
}

/** The open page follows its file, or a folder it is in. */
async function follow(from: string, to: string, dir: boolean) {
  const next = followed(route.path, props.system, props.section, {
    from,
    to,
    dir,
  })
  if (next)
    await navigateTo({ path: next, query: route.query }, { replace: true })
}

async function rename(node: FileNode, name: string) {
  const reply = await run<{ path: string }>({
    op: 'rename',
    section: props.section,
    path: node.path,
    name,
  })
  if (reply) await follow(node.path, reply.path, node.dir)
}

async function arrange(node: FileNode, to: string) {
  const reply = await run<{ path: string; moved: boolean }>({
    op: 'move',
    section: props.section,
    path: node.path,
    to,
  })
  if (reply?.moved) await follow(node.path, reply.path, node.dir)
}

async function remove(node: FileNode) {
  const name = props.entries.get(node.path)?.title ?? node.name
  const page = sectionAddress(props.system, props.section, node.path)
  const showing = node.dir
    ? route.path.startsWith(`${page}/`)
    : route.path === page
  const reply = await run<{ trashedTo: 'recycle-bin' | 'trash' }>({
    op: 'delete',
    section: props.section,
    path: node.path,
  })
  if (!reply) return
  toast.success(
    t('files.deleted', { name, place: t(`files.trash.${reply.trashedTo}`) }),
  )
  // Leave a deleted page for its section.
  if (showing)
    await navigateTo(systemAddress(props.system.id, props.section), {
      replace: true,
    })
}

const movable = (node: FileNode) =>
  !isSkillFolder(props.section, node.path, node.dir)
const canMoveTo = (node: FileNode, to: string) =>
  !within(to, node.path) &&
  !contentProblem(props.section, {
    op: 'move',
    path: node.path,
    to,
    dir: node.dir,
  })
const trash = /Win/.test(navigator.userAgent) ? 'recycle-bin' : 'trash'
</script>

<template>
  <FileTree
    v-model:open="open"
    v-model:closed="closed"
    :heading="label"
    kind="files"
    :branch="{
      label,
      path: folder,
      to: systemAddress(system.id, section),
      icon:
        section === 'context'
          ? 'i-lucide-notebook-text'
          : 'i-lucide-wand-sparkles',
    }"
    :query="query"
    :nodes="nodes"
    :entries="entries"
    :current="route.path"
    :memory="`${system.id}:${section}`"
    :editable="editable"
    :new-options="newOptions"
    :fixed="(node: FileNode) => isSkillFile(section, node.path)"
    :movable="movable"
    :can-move-to="canMoveTo"
    unordered
    :hover-of="(node: FileNode) => repoPath(node) + (node.dir ? '/' : '')"
    :actions="actions"
    :trash="trash"
    :create="create"
    :rename="rename"
    :remove="remove"
    :arrange="arrange"
  />
</template>
