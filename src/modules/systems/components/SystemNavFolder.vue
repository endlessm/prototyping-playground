<script setup lang="ts">
import SystemNavBranch from './SystemNavBranch.vue'
import SystemNavFolder from './SystemNavFolder.vue'
import SystemNavItem, { type SystemNavLink } from './SystemNavItem.vue'

export interface NavFolder {
  /** Inside the section, such as `flows`. */
  path: string
  name: string
  /** Repository-relative, for its hover text. */
  file: string
  folders: NavFolder[]
  items: SystemNavLink[]
}

// The inside of a Context folder: its folders, then its documents. While
// searching, only what matches shows, with its folders open; otherwise each
// folder stays as it was left.
const props = defineProps<{
  folder: NavFolder
  /** Whether an entry shows; everything when nothing is searched. */
  shows: (item: SystemNavLink) => boolean
  searching: boolean
}>()
const folders = defineModel<Record<string, boolean>>('folders', {
  required: true,
})

const holds = (folder: NavFolder): boolean =>
  folder.items.some(props.shows) || folder.folders.some(holds)
const shown = computed(() =>
  props.searching ? props.folder.folders.filter(holds) : props.folder.folders,
)
</script>

<template>
  <SystemNavBranch
    v-for="child in shown"
    :key="child.path"
    :label="child.name"
    :path="child.file"
    icon="i-lucide-folder"
    :open="searching || folders[child.path] !== false"
    @update:open="(open) => !searching && (folders[child.path] = open)"
  >
    <SystemNavFolder
      v-model:folders="folders"
      :folder="child"
      :shows="shows"
      :searching="searching"
    />
  </SystemNavBranch>
  <template v-for="item in folder.items" :key="item.to">
    <SystemNavItem v-if="shows(item)" :item="item" />
  </template>
</template>
