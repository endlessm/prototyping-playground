<script setup lang="ts">
// The row for anything in a collection, in the list view and on Home: an
// icon tile, the title and a small line of detail, with an optional menu on
// the right. The link is named by the title and described by the detail.
const props = defineProps<{
  to: string
  icon: string
  title: string
  /** Small detail after the title, such as who made it and when. */
  meta?: string
  archived?: boolean
}>()
defineSlots<{ menu?: () => unknown }>()
const metaId = useId()
</script>

<template>
  <li class="group/card relative" :class="{ 'opacity-60': archived }">
    <ULink
      :to="props.to"
      :aria-label="props.title"
      :aria-describedby="props.meta ? metaId : undefined"
      class="flex min-w-0 items-center gap-2.5 rounded-md py-1 pr-10 pl-1.5 text-sm text-default outline-none hover:bg-elevated/50 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span
        class="grid size-7 shrink-0 place-items-center rounded-md bg-elevated text-toned"
        aria-hidden="true"
      >
        <UIcon :name="props.icon" class="size-3.5" />
      </span>
      <span class="truncate font-medium">{{ props.title }}</span>
      <span v-if="props.meta" :id="metaId" class="shrink-0 text-xs text-muted">
        {{ props.meta }}
      </span>
    </ULink>
    <div v-if="$slots.menu" class="absolute top-1/2 right-1.5 -translate-y-1/2">
      <slot name="menu" />
    </div>
  </li>
</template>
