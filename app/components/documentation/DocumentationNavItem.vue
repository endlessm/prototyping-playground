<script setup lang="ts">
import type { DocumentationEntry } from '../../composables/useGuidanceFiles'

// A chapter or guidance document in the documentation navigation, with its
// file actions on right-click. A kind label (Document, Context, Skill)
// shows on hover and keyboard focus.
const props = defineProps<{
  entry: DocumentationEntry
  label: string
  icon?: string
  /** Its kind, shown on hover and focus. */
  detail?: string
}>()
const route = useRoute()
const actions = useDocumentationActions()

const current = computed(() => route.path === props.entry.to)
</script>

<template>
  <UContextMenu :items="actions(entry)">
    <ULink
      :to="entry.to"
      :title="entry.path"
      :aria-current="current ? 'page' : undefined"
      :class="[
        'group flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary',
        current
          ? 'bg-elevated font-medium text-highlighted'
          : 'text-default hover:bg-elevated/50',
      ]"
    >
      <UIcon v-if="icon" :name="icon" class="size-3.5 shrink-0 text-muted" />
      <span class="min-w-0 flex-1 truncate">{{ label }}</span>
      <span
        v-if="detail"
        class="hidden shrink-0 text-xs text-muted group-hover:inline group-focus-visible:inline"
      >
        {{ detail }}
      </span>
    </ULink>
  </UContextMenu>
</template>
