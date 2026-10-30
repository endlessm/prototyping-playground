<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import {
  refreshManifest,
  type ManifestPrototype,
} from '../../../../app/composables/useManifest'

// "Duplicate prototype": a title ("<title> copy") and a system, the
// prototype's own preselected. The same system copies it as it is; another
// one makes a rebuild copy for an agent, after a second step that says so.
// The copy opens afterwards. Opened through useOverlay, so it gets the
// systems from the menu rather than awaiting.
const props = defineProps<{
  prototype: ManifestPrototype
  /** The active systems, by permanent ID. */
  systems: { id: string; label: string }[]
  /** The prototype's system's name, or null for none. */
  current: string | null
}>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const base = useRuntimeConfig().app.baseURL

const NONE = 'none'
const choices = [
  ...props.systems.map(({ id, label }) => ({ label, value: id })),
  { label: t('prototypes.organize.duplicateDialog.noSystem'), value: NONE },
]
const source = props.prototype.systemId ?? NONE
const state = reactive({
  title: t('prototypes.organize.duplicateDialog.copyTitle', {
    title: props.prototype.title,
  }),
  system: source,
})
const rebuild = computed(() => state.system !== source)
const confirming = ref(false)
const saving = ref(false)
const failure = ref('')

const labelOf = (value: string) =>
  choices.find((choice) => choice.value === value)?.label ??
  props.current ??
  t('prototypes.organize.duplicateDialog.noSystem')

function validate(current: typeof state): FormError[] {
  return current.title.trim()
    ? []
    : [{ name: 'title', message: t('prototypes.new.addTitle') }]
}

async function submit() {
  if (rebuild.value && !confirming.value) {
    confirming.value = true
    return
  }
  saving.value = true
  failure.value = ''
  try {
    const copy = await requestJson<{ id: string }>(
      `${base}_studio/files/prototypes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'duplicate',
          prototype: props.prototype.id,
          title: state.title,
          system: state.system === NONE ? null : state.system,
        }),
      },
    )
    // Opened at once, before the dev server's own push arrives.
    await refreshManifest()
    emit('close')
    await navigateTo(`/prototypes/${copy.id}`)
  } catch (error) {
    failure.value = (error as Error).message
  } finally {
    saving.value = false
  }
}

/** From the rebuild step back to the form, or out of the dialog. */
function back() {
  if (confirming.value) confirming.value = false
  else emit('close')
}

const submitLabel = computed(() => {
  if (saving.value) return t('prototypes.organize.duplicateDialog.creating')
  if (confirming.value)
    return t('prototypes.organize.duplicateDialog.createRebuild')
  return rebuild.value
    ? t('prototypes.organize.duplicateDialog.continue')
    : t('prototypes.organize.duplicateDialog.duplicate')
})
</script>

<template>
  <UModal
    :title="
      confirming
        ? t('prototypes.organize.duplicateDialog.confirmTitle')
        : t('prototypes.organize.duplicateDialog.title')
    "
    :description="
      confirming
        ? t('prototypes.organize.duplicateDialog.confirmDescription')
        : t('prototypes.organize.duplicateDialog.description')
    "
    :dismissible="!saving"
    @update:open="(open: boolean) => !open && emit('close')"
  >
    <template #body>
      <UForm
        id="duplicate-prototype"
        :state="state"
        :validate="validate"
        :validate-on="[]"
        class="space-y-4"
        @submit="submit"
      >
        <div v-if="confirming" class="space-y-3 text-sm">
          <p>
            <strong class="text-highlighted">{{ state.title }}</strong>
            <br />
            {{ labelOf(source) }} → {{ labelOf(state.system) }}
          </p>
          <p>{{ t('prototypes.organize.duplicateDialog.translate') }}</p>
          <p>{{ t('prototypes.organize.duplicateDialog.keeps') }}</p>
        </div>
        <template v-else>
          <UFormField
            :label="t('prototypes.organize.duplicateDialog.titleLabel')"
            name="title"
          >
            <UInput v-model="state.title" autofocus class="w-full" />
          </UFormField>
          <UFormField
            :label="t('prototypes.organize.duplicateDialog.system')"
            name="system"
            :help="
              rebuild
                ? t('prototypes.organize.duplicateDialog.rebuildHelp')
                : t('prototypes.organize.duplicateDialog.copyHelp')
            "
          >
            <USelect v-model="state.system" :items="choices" class="w-full" />
          </UFormField>
        </template>
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
          :label="
            confirming
              ? t('prototypes.organize.duplicateDialog.back')
              : t('prototypes.organize.duplicateDialog.cancel')
          "
          @click="back"
        />
        <UButton
          type="submit"
          form="duplicate-prototype"
          :loading="saving"
          :disabled="!state.title.trim()"
          :label="submitLabel"
        />
      </div>
    </template>
  </UModal>
</template>
