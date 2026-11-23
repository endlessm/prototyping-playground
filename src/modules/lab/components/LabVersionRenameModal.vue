<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { refreshManifest } from '../../../../app/composables/useManifest'
import { requestJson } from '../../../../app/utils/studioRequest'

// "Rename version": a new name for a version's file, through the file
// service's rename, which keeps the extension and repairs links to it. Its
// refusals show in the dialog. Opened through useOverlay; closes with
// whether the version was renamed.
const props = defineProps<{
  /** The version's prototype's permanent ID. */
  prototype: string
  /** Its file inside the prototype, such as `Version 1.vue`. */
  path: string
  /** Its name now. */
  name: string
}>()
const emit = defineEmits<{ close: [renamed: boolean] }>()
const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL

const state = reactive({ name: props.name })
const saving = ref(false)
const failure = ref('')

function validate(current: typeof state): FormError[] {
  return current.name.trim()
    ? []
    : [{ name: 'name', message: t('lab.versions.rename.empty') }]
}

async function save(event: FormSubmitEvent<typeof state>) {
  const name = event.data.name.trim()
  if (name === props.name) return emit('close', false)
  saving.value = true
  failure.value = ''
  try {
    await requestJson(`${base}_studio/files/tree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prototype: props.prototype,
        op: 'rename',
        path: props.path,
        name,
      }),
    })
    await refreshManifest()
    emit('close', true)
  } catch (error) {
    failure.value = (error as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :title="t('lab.versions.rename.title')"
    :description="t('lab.versions.rename.description')"
    @update:open="(open: boolean) => !open && emit('close', false)"
  >
    <template #body>
      <UForm
        id="rename-version"
        :state="state"
        :validate="validate"
        :validate-on="[]"
        class="space-y-4"
        @submit="save"
      >
        <UFormField :label="t('lab.versions.rename.label')" name="name">
          <UInput v-model="state.name" autofocus class="w-full" />
        </UFormField>
        <p v-if="failure" role="alert" class="text-sm text-error">
          {{ failure }}
        </p>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('lab.versions.rename.cancel')"
          @click="emit('close', false)"
        />
        <UButton
          type="submit"
          form="rename-version"
          :loading="saving"
          :label="t('lab.versions.rename.save')"
        />
      </div>
    </template>
  </UModal>
</template>
