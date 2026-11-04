<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { pageHandoff } from '../../../../app/utils/pageHandoff'

// "Rename system": a new name. The dev server renames the folder and its
// registration and repairs references; the permanent ID, and so the
// address, stays. The studio then restarts behind the status screen, and
// the confirmation shows on the page after it. Refusals show here.
// Opened through useOverlay.
const props = defineProps<{ system: { id: string; label: string } }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL
const handoff = pageHandoff()

const state = reactive({ name: props.system.label })
const saving = ref(false)
const failure = ref('')

function validate(current: typeof state): FormError[] {
  return current.name.trim()
    ? []
    : [{ name: 'name', message: t('systems.new.addName') }]
}

async function save(event: FormSubmitEvent<typeof state>) {
  const name = event.data.name.trim()
  if (name === props.system.label) return emit('close')
  saving.value = true
  failure.value = ''
  handoff?.start({
    kind: 'system',
    title: t('systems.transition.titles.rename', { name: props.system.label }),
    description: t('systems.transition.descriptions.rename'),
    hold: true,
  })
  try {
    await requestJson(`${base}_studio/files/systems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'rename', system: props.system.id, name }),
    })
    handoff?.update({ hold: false, confirmation: t('systems.toasts.renamed') })
  } catch (error) {
    handoff?.cancel()
    failure.value = (error as Error).message
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :title="t('systems.renameDialog.title')"
    :description="t('systems.renameDialog.description')"
    :dismissible="!saving"
    @update:open="(open: boolean) => !open && emit('close')"
  >
    <template #body>
      <UForm
        id="rename-system"
        :state="state"
        :validate="validate"
        :validate-on="[]"
        class="space-y-4"
        @submit="save"
      >
        <UFormField :label="t('systems.renameDialog.name')" name="name">
          <UInput
            v-model="state.name"
            autofocus
            required
            :maxlength="120"
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
          :disabled="saving"
          :label="t('systems.renameDialog.cancel')"
          @click="emit('close')"
        />
        <UButton
          type="submit"
          form="rename-system"
          :loading="saving"
          :label="
            saving
              ? t('systems.renameDialog.saving')
              : t('systems.renameDialog.save')
          "
        />
      </div>
    </template>
  </UModal>
</template>
