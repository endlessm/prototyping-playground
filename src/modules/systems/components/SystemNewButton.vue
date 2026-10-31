<script setup lang="ts">
// "New system": only while the studio runs locally, and only for an Admin.
// The command palette's New system arrives as `?new=system`, which opens
// the dialog once it's known who you are. The dialog is loaded only in
// development, so the deployed site carries neither it nor the file
// service's address.
const { t } = useI18n()
const { me, known } = useMe()
const route = useRoute()
const local = import.meta.dev
const modal = import.meta.dev
  ? useOverlay().create(
      defineAsyncComponent(() => import('./SystemNewModal.vue')),
    )
  : undefined

if (import.meta.dev)
  watch(
    [() => route.query.new, known],
    async ([wanted, ready]) => {
      if (wanted !== 'system' || !ready) return
      await navigateTo(
        { query: { ...route.query, new: undefined } },
        { replace: true },
      )
      if (me.value.role === 'admin') void modal?.open()
    },
    { immediate: true },
  )
</script>

<template>
  <UButton
    v-if="local && me.role === 'admin'"
    icon="i-lucide-plus"
    :label="t('systems.new.button')"
    @click="() => void modal?.open()"
  />
</template>
