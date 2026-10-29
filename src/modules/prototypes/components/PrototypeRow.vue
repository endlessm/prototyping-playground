<script setup lang="ts">
import CollectionRow from '../../../../app/components/CollectionRow.vue'
import type { ManifestPrototype } from '../../../../app/composables/useManifest'
import { firstName, makerOf, PROTOTYPE_ICON } from '../utils/gallery'
import PrototypeMenu from './PrototypeMenu.vue'

// A prototype's row, in the gallery's list view and on Home. `byline` adds
// who made it; `created` adds when.
const props = withDefaults(
  defineProps<{
    prototype: ManifestPrototype
    byline?: boolean
    created?: boolean
  }>(),
  { byline: true, created: false },
)
const manifest = await useManifest()
const meta = computed(() =>
  [
    props.byline && firstName(makerOf(manifest.value, props.prototype).name),
    props.created && formatDate(props.prototype.created),
  ]
    .filter(Boolean)
    .join(' · '),
)
</script>

<template>
  <CollectionRow
    :to="`/prototypes/${prototype.id}`"
    :icon="PROTOTYPE_ICON"
    :title="prototype.title"
    :meta="meta || undefined"
    :archived="prototype.status === 'archived'"
  >
    <template #menu>
      <PrototypeMenu :prototype="prototype" />
    </template>
  </CollectionRow>
</template>
