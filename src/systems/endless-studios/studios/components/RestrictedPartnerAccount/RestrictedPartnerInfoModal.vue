<script setup lang="ts">
const { institution = '' } = defineProps<{
  institution?: string
}>()

defineEmits(['close'])
</script>
<template>
  <UModal
    :ui="{
      close: 'hidden',
      footer: 'justify-end',
      header: 'hidden',
      content: 'text-center bg-gating-gradient',
    }"
  >
    <template #body>
      <p class="text-xl font-bold text-highlighted">
        {{ $t('restricted_partner_data.modal_title') }}
      </p>
      <p class="text-sm text-muted mt-2">
        {{ $t('restricted_partner_data.modal_description', { institution }) }}
      </p>
      <p class="text-sm text-muted mt-5">
        {{ $t('restricted_partner_data.modal_body') }}
      </p>
    </template>
    <template #footer>
      <UButton size="xl" variant="outline" color="kids" @click="$emit('close')">
        {{ $t('restricted_partner_data.ok_button') }}
      </UButton>
    </template>
  </UModal>
</template>
