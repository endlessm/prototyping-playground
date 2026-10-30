<script setup lang="ts">
// How an artifact appears where it can't be shown itself (a type with no
// preview there, such as a document in a document or on a canvas): its icon, name and
// type, and a link that opens it. Without an artifact, the card says why
// nothing can be shown.
defineProps<{
  title: string
  detail: string
  /** An Iconify name. */
  icon?: string
  /** The artifact's page, for its "Open" link. */
  to?: string
  /** The whole reason, when `detail` is a short form of it. */
  hint?: string
}>()
const { t } = useI18n()
</script>

<template>
  <div
    class="flex min-h-22 w-full items-center gap-3 overflow-hidden rounded-xl border border-default bg-default px-4 text-left"
  >
    <span
      class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted"
    >
      <UIcon :name="icon ?? 'i-lucide-file-x'" class="size-5" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold text-highlighted">{{ title }}</p>
      <p class="truncate text-xs text-muted" :title="hint ?? detail">
        {{ detail }}
      </p>
    </div>
    <UButton
      v-if="to"
      :to="to"
      data-open
      size="xs"
      color="neutral"
      variant="ghost"
      :label="t('embed.open')"
      :aria-label="t('embed.openNamed', { name: title })"
    />
  </div>
</template>
