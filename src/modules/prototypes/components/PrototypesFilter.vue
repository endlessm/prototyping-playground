<script setup lang="ts">
// The gallery's filters: an icon button that opens a popover with the
// System choice. The choice lives in the address (`?system=<folder name>`)
// and combines with the search; a dot on the button says a filter is on.
// A system the address names but the studio doesn't have is still offered,
// so you can see what is selected and change it.
const { t } = useI18n()
const route = useRoute()
const { systems } = await useSystems()
const ALL = 'all'

const current = computed(() =>
  typeof route.query.system === 'string' && route.query.system
    ? route.query.system
    : undefined,
)
const items = computed(() => {
  const known = systems.value.map(({ key, label }) => ({ label, value: key }))
  const unknown =
    current.value &&
    !systems.value.some(
      ({ key, id }) => key === current.value || id === current.value,
    )
  return [
    { label: t('prototypes.gallery.allSystems'), value: ALL },
    ...known,
    ...(unknown ? [{ label: current.value!, value: current.value! }] : []),
  ]
})
const selected = computed({
  get: () =>
    systems.value.find(({ id }) => id === current.value)?.key ??
    current.value ??
    ALL,
  set: (value: string) =>
    void navigateTo({
      query: { ...route.query, system: value === ALL ? undefined : value },
    }),
})
const label = computed(() =>
  current.value
    ? t('prototypes.gallery.filtersActive', { count: 1 })
    : t('prototypes.gallery.filters'),
)
</script>

<template>
  <UPopover :content="{ align: 'end', sideOffset: 8 }">
    <UButton
      icon="i-lucide-filter"
      :aria-label="label"
      color="neutral"
      variant="outline"
      square
      class="relative"
    >
      <template v-if="current" #trailing>
        <span
          aria-hidden="true"
          class="absolute top-1 right-1 size-1.5 rounded-full bg-primary"
        />
      </template>
    </UButton>
    <template #content>
      <div class="w-64 space-y-4 p-4">
        <p class="text-sm font-semibold text-highlighted">
          {{ t('prototypes.gallery.filters') }}
        </p>
        <UFormField :label="t('prototypes.gallery.system')" name="system">
          <USelect v-model="selected" :items="items" class="w-full" />
        </UFormField>
      </div>
    </template>
  </UPopover>
</template>
