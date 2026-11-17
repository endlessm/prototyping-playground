<script setup lang="ts">
import SystemPreviewFrame from '../../systems/components/SystemPreviewFrame.vue'

// An experiment's live preview: its view, rendered in its system's preview
// document as tall as its content, so it shows as its file does now and
// updates when the file changes on disk. One that fails says so in its
// place.
defineProps<{
  systemId: string
  /** The experiment view's permanent ID. */
  experiment: string
  title: string
}>()
const { t } = useI18n()
</script>

<template>
  <SystemPreviewFrame
    :system-id="systemId"
    :artifact="experiment"
    :title="title"
    :min-height="96"
    :error-height="160"
    :loading-text="t('lab.experiments.loading')"
    :error-text="t('lab.experiments.error')"
  />
</template>
