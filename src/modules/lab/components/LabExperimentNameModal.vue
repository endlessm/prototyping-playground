<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { refreshManifest } from '../../../../app/composables/useManifest'
import type { RequestedChange, RequestedProp } from '../experiments/save'
import type { MadeExperimentReply } from '../composables/useLabExperimentDialog'
import type { ExperimentRequest } from '../utils/experiments'
import { labAddress } from '../utils/lab'

// Names a new experiment, or the copy of one, and asks the Lab's handler
// on the dev server to make it, with a Breakdown's changes written into it
// when it is given some (Save as experiment, Save as my experiment); then
// opens it. The server's refusals (not joined, a name you already use) show
// in the dialog. Opened through useOverlay, only while the studio runs
// locally.
const props = defineProps<{
  /** What to make: a new experiment of a component, or a copy of one. */
  request: ExperimentRequest
  /** The component's system and address, where the experiment opens. */
  systemId: string
  component: string
  title: string
  description: string
  name?: string
  changes?: RequestedChange[]
  props?: RequestedProp[]
  onMade?: (made: MadeExperimentReply) => void
}>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL
const creating = props.request.action === 'create'

const state = reactive({ name: props.name ?? '' })
const saving = ref(false)
const failure = ref('')

function validate(current: typeof state): FormError[] {
  return current.name.trim()
    ? []
    : [{ name: 'name', message: t('lab.experiments.dialog.addName') }]
}

async function make(event: FormSubmitEvent<typeof state>) {
  saving.value = true
  failure.value = ''
  try {
    const made = await requestJson<MadeExperimentReply>(
      `${base}_studio/modules/lab/experiments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...props.request,
          name: event.data.name.trim(),
          ...(props.changes && { changes: props.changes }),
          ...(props.props?.length && { props: props.props }),
        }),
      },
    )
    // Opened at once, before the dev server's own push arrives.
    await refreshManifest()
    props.onMade?.(made)
    emit('close')
    await navigateTo(
      labAddress(
        props.systemId,
        props.component,
        `experiments/${made.artifact}`,
      ),
    )
  } catch (error) {
    failure.value = (error as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    @update:open="(open: boolean) => !open && emit('close')"
  >
    <template #body>
      <UForm
        id="lab-experiment"
        :state="state"
        :validate="validate"
        :validate-on="[]"
        class="space-y-4"
        @submit="make"
      >
        <UFormField :label="t('lab.experiments.dialog.name')" name="name">
          <UInput
            v-model="state.name"
            autofocus
            :placeholder="t('lab.experiments.dialog.placeholder')"
            class="w-full"
          />
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
          :label="t('lab.experiments.dialog.cancel')"
          @click="emit('close')"
        />
        <UButton
          type="submit"
          form="lab-experiment"
          :loading="saving"
          :label="
            changes
              ? t(saving ? 'lab.save.saving' : 'lab.save.dialog.save')
              : creating
                ? t(
                    saving
                      ? 'lab.experiments.dialog.creating'
                      : 'lab.experiments.dialog.create',
                  )
                : t(
                    saving
                      ? 'lab.experiments.dialog.duplicating'
                      : 'lab.experiments.dialog.duplicate',
                  )
          "
        />
      </div>
    </template>
  </UModal>
</template>
