<!-- @studio-id kpgdr9wxtg3srjyf -->
<!-- @lab-version 8x5spen6xtvp96a9 dashboard-onboarding-card 4a5087452 -->
<script setup lang="ts">
defineEmits<{
  openEnrollmentModal: []
}>()
</script>

<template>
  <UCard variant="shaded">
    <template #default>
      <div class="flex flex-col items-center gap-3 text-center">
        <p class="text-secondary font-bold text-lg flex items-center gap-1">
          <UIcon name="i-lucide-circle-check" class="size-5" />
          {{ $t('onboarding_card.title') }}
        </p>
        <p class="text-dimmed text-sm">
          {{ $t('onboarding_card.description') }}
        </p>
        <div class="flex items-center justify-between w-full mt-2">
          <UButton to="/programs/" color="secondary" variant="ghost">
            {{ $t('onboarding_card.explore_programs') }}
          </UButton>
          <UButton
            color="secondary"
            trailing-icon="i-lucide-arrow-right"
            :ui="{ trailingIcon: 'size-4' }"
            @click="$emit('openEnrollmentModal')"
          >
            {{ $t('onboarding_card.i_have_an_access_code') }}
          </UButton>
        </div>
      </div>
    </template>
  </UCard>
</template>
