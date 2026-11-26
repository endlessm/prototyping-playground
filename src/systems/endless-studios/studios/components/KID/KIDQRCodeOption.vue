<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'

defineProps<{
  qrCodeUrl: string
}>()
</script>
<template>
  <UCard :ui="{ root: 'border border-default shadow-none' }">
    <template #default>
      <div class="mb-6">
        <p class="text-xs font-bold text-dimmed">
          {{ $t('kid_challenge.option', { number: 2 }) }}
        </p>
        <p class="text-sm font-medium mt-1">
          {{ $t('kid_challenge.qr_code_option_description') }}
        </p>
      </div>
      <div class="flex justify-center">
        <div
          class="border-6 border-teal-600 rounded-xl p-2 max-w-[9.375rem] max-h-[9.375rem]"
        >
          <QrcodeVue
            :value="qrCodeUrl"
            :size="200"
            level="H"
            render-as="svg"
            class="w-full h-full"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
