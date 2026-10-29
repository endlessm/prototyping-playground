<script setup lang="ts">
// "New prototype": only while the studio runs locally, and only for a
// registered contributor. The dialog is loaded only in development, so the
// deployed site carries neither it nor the file service's address.
const { t } = useI18n()
const { me } = useMe()
const { systems, defaultSystem } = await useSystems()
const local = import.meta.dev
const modal = import.meta.dev
  ? useOverlay().create(
      defineAsyncComponent(() => import('./PrototypeNewModal.vue')),
    )
  : undefined

function open() {
  void modal?.open({
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
