<script setup lang="ts">
// The card for anything in a collection: a neutral tile with the module's
// icon, the title, an optional description and a line of detail, so the
// studio's theme is what gives it colour. The whole card is the link, named
// by the title and described by the detail; the menu (the `menu` slot) sits
// beside it, not inside it.
const props = defineProps<{
  to: string
  icon: string
  title: string
  /** Shown as "No description" when empty; left out when undefined. */
  description?: string
  archived?: boolean
}>()
defineSlots<{ meta?: () => unknown; menu?: () => unknown }>()
const { t } = useI18n()
const metaId = useId()
</script>

<template>
  <div class="group/card relative h-full" :class="{ 'opacity-60': archived }">
    <UPageCard
      :to="props.to"
      :title="props.title"
      :aria-describedby="$slots.meta ? metaId : undefined"
      variant="outline"
      class="h-full hover:bg-elevated/50"
      :ui="{
        container: 'p-4 sm:p-4',
        wrapper: 'gap-3',
        leading: 'mb-0',
        title: 'pr-8 text-sm leading-snug font-semibold',
        description: 'line-clamp-2 text-xs leading-relaxed',
        footer: 'mt-auto pt-0.5',
      }"
    >
      <template #leading>
        <span
          class="grid size-8 place-items-center rounded-lg bg-elevated text-toned"
          aria-hidden="true"
        >
          <UIcon :name="props.icon" class="size-4" />
        </span>
      </template>
      <template v-if="props.description !== undefined" #description>
        {{ props.description || t('collection.noDescription') }}
      </template>
      <template v-if="$slots.meta" #footer>
        <div :id="metaId" class="flex items-center gap-1.5 text-xs text-muted">
          <slot name="meta" />
        </div>
      </template>
    </UPageCard>
    <div v-if="$slots.menu" class="absolute top-2 right-2">
      <slot name="menu" />
    </div>
  </div>
</template>
