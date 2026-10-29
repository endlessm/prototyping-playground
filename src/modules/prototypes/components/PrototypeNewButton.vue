<script setup lang="ts">
import PrototypeNewModal from './PrototypeNewModal.vue'

// "New prototype": only while the studio runs locally, and only for a
// registered contributor. The deployed site never shows it.
const { t } = useI18n()
const { me } = useMe()
const { systems, defaultSystem } = await useSystems()
const modal = useOverlay().create(PrototypeNewModal)
const local = import.meta.dev

function open() {
  void modal.open({
    systems: systems.value
      .filter(({ status }) => status === 'active')
      .map(({ id, label }) => ({ id, label })),
    defaultSystem: defaultSystem.value,
  })
}
</script>

<template>
  <UButton
    v-if="local && me.key"
    icon="i-lucide-plus"
    :label="t('prototypes.new.button')"
    @click="open"
  />
</template>
