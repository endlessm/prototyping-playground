<!-- @studio-id 3xjtdm0y4fyxjhpv -->
<!-- @lab-version 8x5spen6xtvp96a9 shared-access-code 4a5087452 -->
<script setup lang="ts">
defineProps<{
  title: string
  description: string
  buttonText: string
}>()

const emit = defineEmits<{
  open: []
}>()

const { $auth } = useNuxtApp()

function openEnrollmentModal() {
  if (!$auth.loggedIn) {
    $auth.requireLogin()
  } else {
    emit('open')
  }
}
</script>

<template>
  <UCard :title=title class="w-full">
    {{ description }}
    <template #footer>
      <UButton 
        block variant="outline" color="neutral" size="lg" class="w-full"
        @click="openEnrollmentModal">{{ buttonText }}
      </UButton>
    </template>
  </UCard>
</template>
