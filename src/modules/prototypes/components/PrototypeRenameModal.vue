<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import {
  refreshManifest,
  type ManifestPrototype,
} from '../../../../app/composables/useManifest'

// "Rename prototype": a new title, with who made it and when. The file
// service renames the folder to match; the link stays. Its refusals show in
// the dialog. Opened through useOverlay, so it gets who made it from the
// menu rather than awaiting.
const props = defineProps<{
  prototype: ManifestPrototype
  /** Who made it, by name. */
  maker: string
}>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL

const state = reactive({ title: props.prototype.title })
const saving = ref(false)
const failure = ref('')

function validate(current: typeof state): FormError[] {
  return current.title.trim()
    ? []
    : [{ name: 'title', message: t('prototypes.new.addTitle') }]
}

async function save(event: FormSubmitEvent<typeof state>) {
  saving.value = true
  failure.value = ''
  try {
    if (event.data.title.trim() !== props.prototype.title)
      await requestJson(`${base}_studio/files/prototypes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'rename',
          prototype: props.prototype.id,
          title: event.data.title,
        }),
      })
    await refreshManifest()
    emit('close')
  } catch (error) {
    failure.value = (error as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :title="t('prototypes.organize.renameDialog.title')"
    :description="t('prototypes.organize.renameDialog.description')"
    @update:open="(open: boolean) => !open && emit('close')"
  >
    <template #body>
      <UForm
        id="rename-prototype"
        :state="state"
        :validate="validate"
        :validate-on="[]"
        class="space-y-4"
        @submit="save"
      >
        <UFormField
          :label="t('prototypes.organize.renameDialog.titleLabel')"
          name="title"
        >
          <UInput v-model="state.title" autofocus class="w-full" />
        </UFormField>
        <dl
          class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-muted"
        >
          <dt>{{ t('prototypes.organize.renameDialog.contributor') }}</dt>
          <dd>{{ maker }}</dd>
          <template v-if="prototype.created">
            <dt>{{ t('prototypes.organize.renameDialog.created') }}</dt>
            <dd>{{ formatDate(prototype.created) }}</dd>
          </template>
        </dl>
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
          :label="t('prototypes.organize.renameDialog.cancel')"
          @click="emit('close')"
        />
        <UButton
          type="submit"
          form="rename-prototype"
          :loading="saving"
          :label="
            saving
              ? t('prototypes.organize.renameDialog.saving')
              : t('prototypes.organize.renameDialog.save')
          "
        />
      </div>
    </template>
  </UModal>
</template>
