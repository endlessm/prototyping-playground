<script setup lang="ts">
// The component files that couldn't load, with Try again.
defineProps<{ errors: string[] }>()
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>

<template>
  <div
    role="alert"
    class="mb-6 space-y-2 rounded-md border border-default p-3 text-sm"
  >
    <p class="text-default">{{ t('systems.component.loadErrors') }}</p>
    <p v-for="error in errors" :key="error" class="text-muted">
      {{ error }}
    </p>
    <UButton
      size="sm"
      color="neutral"
      variant="outline"
      :label="t('systems.component.tryAgain')"
      @click="emit('retry')"
    />
  </div>
</template>
