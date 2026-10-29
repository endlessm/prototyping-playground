<script setup lang="ts" generic="T">
// A collection's items as the reader chose to see them (useCollectionView):
// a grid of cards, one, two or three across by window width, or a list of
// rows in one card. The page draws each card and row through the slots;
// a row is its own list item (CollectionRow).
defineProps<{
  items: T[]
  keyOf: (item: T) => string
  /** The list's accessible name. */
  label: string
}>()
defineSlots<{
  card: (props: { item: T }) => unknown
  row: (props: { item: T }) => unknown
}>()
const view = useCollectionView()
</script>

<template>
  <UCard v-if="view === 'list'" :ui="{ body: 'p-1.5 sm:p-1.5' }">
    <ul :aria-label="label">
      <template v-for="item in items" :key="keyOf(item)">
        <slot name="row" :item="item" />
      </template>
    </ul>
  </UCard>
  <ul
    v-else
    :aria-label="label"
    class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
  >
    <li v-for="item in items" :key="keyOf(item)">
      <slot name="card" :item="item" />
    </li>
  </ul>
</template>
