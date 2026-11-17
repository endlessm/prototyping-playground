<script setup lang="ts">
// Why making and saving experiments is unavailable to someone who hasn't
// joined the studio, and how to join. Only while the studio runs locally,
// once it knows who is working.
const { me, known } = useMe()
const { t } = useI18n()
const local = import.meta.dev
</script>

<template>
  <p
    v-if="local && known && !me.key"
    role="note"
    class="rounded-md border border-default p-3 text-sm text-default"
  >
    {{ t('lab.experiments.join') }}
  </p>
</template>
