<script setup lang="ts">
import { requestJson } from '../../../../app/utils/studioRequest'
const props = defineProps<{
  person: {
    key: string
    name: string
    github: string
    email?: string
    revision?: string
  }
}>()
const emit = defineEmits<{ close: [saved: boolean] }>()
const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL
const state = reactive({
  name: props.person.name,
  github: props.person.github,
  email: props.person.email ?? '',
})
const error = ref('')
const busy = ref(false)
async function save() {
  busy.value = true
  try {
    await requestJson(`${base}_studio/people`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: props.person.key,
        revision: props.person.revision,
        changes: {
          name: state.name,
          github: state.github,
          ...(state.email !== props.person.email
            ? { 'primary-email': state.email }
            : {}),
        },
      }),
    })
    emit('close', true)
  } catch (cause) {
    error.value = (cause as Error).message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <UModal
    :title="t('people.edit')"
    :description="person.name"
    :dismissible="!busy"
    @update:open="(value) => !value && emit('close', false)"
  >
    <template #body>
      <UForm :state="state" class="space-y-4" @submit="save">
        <UAlert v-if="error" color="error" :title="error" />
        <UFormField :label="t('people.name')" name="name"
          ><UInput v-model="state.name" class="w-full" required
        /></UFormField>
        <UFormField :label="t('people.email')" name="email"
          ><UInput v-model="state.email" type="email" class="w-full"
        /></UFormField>
        <UFormField :label="t('people.github')" name="github"
          ><UInput v-model="state.github" class="w-full"
        /></UFormField>
        <UButton type="submit" :label="t('people.save')" :loading="busy" />
      </UForm>
    </template>
  </UModal>
</template>
