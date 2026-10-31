<script setup lang="ts">
// "New system": only while the studio runs locally, and only for an Admin.
// The dialog is loaded only in development, so the deployed site carries
// neither it nor the file service's address.
const { t } = useI18n()
const { me } = useMe()
const local = import.meta.dev
const modal = import.meta.dev
  ? useOverlay().create(
      defineAsyncComponent(() => import('./SystemNewModal.vue')),
    )
  : undefined
</script>

<template>
  <UButton
    v-if="local && me.role === 'admin'"
    icon="i-lucide-plus"
    :label="t('systems.new.button')"
    @click="() => void modal?.open()"
  />
</template>
