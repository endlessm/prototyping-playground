<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

// FIXME: this component should replace components/Generic/ConfirmationModal.vue
// when all the existing ConfirmationModal users can be adjusted to the UModal flow

defineProps<{
  title: string
  description?: string
  body?: string
  confirmText: string
  cancelText: string
  confirmColor?: ButtonProps['color']
}>()

defineEmits(['close'])
</script>
<template>
  <UModal
    :title="title"
    :description="description"
    :close="false"
    :ui="{
      footer: 'justify-end',
    }"
  >
    <template v-if="body" #body>
      <p class="text-sm text-default">{{ body }}</p>
    </template>
    <template #footer="{ close }">
      <!-- Prefer Cancel so Enter does not confirm a destructive action. -->
      <UButton color="neutral" variant="ghost" autofocus @click="close">
        {{ cancelText }}
      </UButton>
      <UButton :color="confirmColor || 'primary'" @click="$emit('close', true)">
        {{ confirmText }}
      </UButton>
    </template>
  </UModal>
</template>
