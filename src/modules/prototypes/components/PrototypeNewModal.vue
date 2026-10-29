<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { refreshManifest } from '../../../../app/composables/useManifest'

// "New prototype": a title and a system (the studio's default system
// preselected), created in your own space by the dev server's file service,
// then opened. The server's refusals show in the dialog. Opened through
// useOverlay, so it gets its systems from the button rather than awaiting.
const props = defineProps<{
  /** The active systems, by permanent ID. */
  systems: { id: string; label: string }[]
  defaultSystem: string | null
}>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL

const NONE = 'none'
const choices = [
  ...props.systems.map(({ id, label }) => ({ label, value: id })),
  { label: t('prototypes.new.noSystem'), value: NONE },
]
const preselected = choices.some(({ value }) => value === props.defaultSystem)
  ? props.defaultSystem!
  : NONE

const state = reactive({ title: '', system: preselected })
const saving = ref(false)
const failure = ref('')

function validate(current: typeof state): FormError[] {
  const title = current.title.trim()
  if (!title) return [{ name: 'title', message: t('prototypes.new.addTitle') }]
  if (!/[a-z0-9]/i.test(title.normalize('NFKD')))
    return [{ name: 'title', message: t('prototypes.new.letters') }]
  return []
}

async function create(event: FormSubmitEvent<typeof state>) {
  saving.value = true
  failure.value = ''
  try {
    const created = await requestJson<{ id: string }>(
      `${base}_studio/files/prototypes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: event.data.title,
          system: event.data.system === NONE ? null : event.data.system,
        }),
      },
    )
    // Opened at once, before the dev server's own push arrives.
    await refreshManifest()
    emit('close')
    await navigateTo(`/prototypes/${created.id}`)
  } catch (error) {
    failure.value = (error as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :title="t('prototypes.new.title')"
    :description="t('prototypes.new.description')"
    @update:open="(open) => !open && emit('close')"
  >
    <template #body>
      <UForm
        id="new-prototype"
        :state="state"
        :validate="validate"
        :validate-on="[]"
        class="space-y-4"
        @submit="create"
      >
        <UFormField :label="t('prototypes.new.titleLabel')" name="title">
          <UInput
            v-model="state.title"
            autofocus
            :placeholder="t('prototypes.new.placeholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="t('prototypes.new.system')"
          name="system"
          :help="
            state.system === NONE
              ? t('prototypes.new.noSystemHelp')
              : t('prototypes.new.systemHelp')
          "
        >
          <USelect v-model="state.system" :items="choices" class="w-full" />
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
          :label="t('prototypes.new.cancel')"
          @click="emit('close')"
        />
        <UButton
          type="submit"
          form="new-prototype"
          :loading="saving"
          :label="
            saving ? t('prototypes.new.creating') : t('prototypes.new.create')
          "
        />
      </div>
    </template>
  </UModal>
</template>
