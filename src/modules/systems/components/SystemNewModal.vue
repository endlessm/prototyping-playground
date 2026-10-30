<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import {
  beginSystemTransition,
  finishSystemTransition,
  systemCreated,
} from '../composables/useSystemTransition'

// "New system": a name, which becomes its folder. The dev server makes an
// empty Vue system and registers it; the studio restarts behind the status
// screen ("Creating …", then "Opening …") and lands on the new system's
// Overview, in place of this page in the history. A refusal returns here
// with its message, and nothing is sent again. Opened through useOverlay.
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL

const state = reactive({ name: '' })
const saving = ref(false)
const failure = ref('')

function validate(current: typeof state): FormError[] {
  return current.name.trim()
    ? []
    : [{ name: 'name', message: t('systems.new.addName') }]
}

async function create(event: FormSubmitEvent<typeof state>) {
  if (saving.value) return
  const name = event.data.name.trim()
  saving.value = true
  failure.value = ''
  beginSystemTransition('create', name)
  try {
    const { studioId } = await requestJson<{ studioId: string }>(
      `${base}_studio/files/systems`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'create', name }),
      },
    )
    systemCreated(studioId)
    // The restart reloads this address: the new system's Overview.
    history.replaceState(history.state, '', `${base}systems/${studioId}`)
  } catch (error) {
    finishSystemTransition()
    failure.value = (error as Error).message
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :title="t('systems.new.title')"
    :description="t('systems.new.description')"
    :dismissible="!saving"
    @update:open="(open: boolean) => !open && emit('close')"
  >
    <template #body>
      <UForm
        id="new-system"
        :state="state"
        :validate="validate"
        :validate-on="[]"
        class="space-y-4"
        @submit="create"
      >
        <UFormField :label="t('systems.new.name')" name="name">
          <UInput
            v-model="state.name"
            autofocus
            required
            :maxlength="120"
            :placeholder="t('systems.new.placeholder')"
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
          :label="t('systems.new.cancel')"
          @click="emit('close')"
        />
        <UButton
          type="submit"
          form="new-system"
          :loading="saving"
          :label="saving ? t('systems.new.creating') : t('systems.new.create')"
        />
      </div>
    </template>
  </UModal>
</template>
