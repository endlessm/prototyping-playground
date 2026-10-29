<script setup lang="ts">
import CollectionCard from '../../../../app/components/CollectionCard.vue'
import ContributorAvatar from '../../../../app/components/ContributorAvatar.vue'
import type { ManifestPrototype } from '../../../../app/composables/useManifest'
import { firstName, makerOf, PROTOTYPE_ICON } from '../utils/gallery'
import PrototypeMenu from './PrototypeMenu.vue'

// A prototype's card in the gallery: its icon and title, who made it (photo
// and first name) and when. It opens the prototype.
const props = defineProps<{ prototype: ManifestPrototype }>()
const manifest = await useManifest()
const maker = computed(() => makerOf(manifest.value, props.prototype))
</script>

<template>
  <CollectionCard
    :to="`/prototypes/${prototype.id}`"
    :icon="PROTOTYPE_ICON"
    :title="prototype.title"
    :archived="prototype.status === 'archived'"
  >
    <template #meta>
      <ContributorAvatar
        :name="maker.name"
        :github="maker.github"
        :avatar="maker.avatar"
      />
      <span class="truncate">{{ firstName(maker.name) }}</span>
      <span v-if="prototype.created" class="shrink-0">
        · {{ formatDate(prototype.created) }}
      </span>
    </template>
    <template #menu>
      <PrototypeMenu :prototype="prototype" />
    </template>
  </CollectionCard>
</template>
