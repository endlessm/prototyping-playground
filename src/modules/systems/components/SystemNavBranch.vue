<script setup lang="ts">
// A folder in a system's navigation: a fixed branch (Context, Skills,
// Theme, Assets, Components) or a folder inside Context. Its chevron folds
// it; hovering shows the folder it stands for. A branch with a page of its
// own (Context and Skills) links to it beside the chevron.
const props = defineProps<{
  label: string
  /** The folder or file it shows, repository-relative. */
  path: string
  /** Its own page, if it has one. */
  to?: string
  icon?: string
}>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
const route = useRoute()
</script>

<template>
  <div>
    <div class="flex h-7 min-w-0 items-center">
      <UButton
        v-if="props.to"
        :icon="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        :aria-label="t('systems.nav.toggle', { name: props.label })"
        :aria-expanded="open"
        class="shrink-0"
        @click.stop.prevent="() => void (open = !open)"
      />
      <ULink
        v-if="props.to"
        :to="props.to"
        :title="props.path"
        :aria-current="route.path === props.to ? 'page' : undefined"
        :class="[
          'flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary',
          route.path === props.to
            ? 'bg-elevated text-highlighted'
            : 'text-default hover:bg-elevated/50',
        ]"
      >
        <UIcon
          v-if="props.icon"
          :name="props.icon"
          class="size-3.5 shrink-0 text-muted"
        />
        <span class="truncate">{{ props.label }}</span>
      </ULink>
      <button
        v-else
        type="button"
        :title="props.path"
        :aria-expanded="open"
        class="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 text-left text-xs font-medium text-default outline-none hover:bg-elevated/50 focus-visible:ring-2 focus-visible:ring-primary"
        @click="open = !open"
      >
        <UIcon
          :name="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
          class="size-3.5 shrink-0 text-muted"
        />
        <UIcon
          v-if="props.icon"
          :name="props.icon"
          class="size-3.5 shrink-0 text-muted"
        />
        <span class="truncate">{{ props.label }}</span>
      </button>
    </div>
    <div v-show="open" class="space-y-0.5 pl-4">
      <slot />
    </div>
  </div>
</template>
