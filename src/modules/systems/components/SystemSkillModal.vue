<script setup lang="ts">
import {
  SKILL_NAME_MAX,
  skillDescriptionProblem,
  skillNameProblem,
} from '../../../../tooling/systems/content-rules'

// "New skill" in a system's Skills: a name in lowercase words joined by
// single hyphens (also its folder's name) and a description of what it does
// and when to use it, as the Agent Skills format asks. Each is checked as
// you type, showing a rule only once it's broken; the dev server checks
// again, makes the folder and its SKILL.md, and answers with its path,
// which closes the dialog. A refusal stays here with its message. Opened
// through useOverlay.
const props = defineProps<{
  /** Makes the skill; resolves to its SKILL.md's path in Skills. */
  create: (name: string, description: string) => Promise<string>
}>()
const emit = defineEmits<{ close: [path?: string] }>()
const { t } = useI18n()

const name = ref('')
const description = ref('')
const saving = ref(false)
const failure = ref('')

// Problems show once there's something to be wrong about.
const nameError = computed(() => {
  const problem = name.value ? skillNameProblem(name.value) : null
  return problem ? t('systems.skill.nameProblem', { problem }) : ''
})
const descriptionError = computed(() => {
  const problem = description.value
    ? skillDescriptionProblem(description.value)
    : null
  return problem ? t('systems.skill.descriptionProblem', { problem }) : ''
})
const ready = computed(
  () =>
    !skillNameProblem(name.value) &&
    !skillDescriptionProblem(description.value),
)

async function submit() {
  if (!ready.value || saving.value) return
  saving.value = true
  failure.value = ''
  try {
    emit('close', await props.create(name.value, description.value.trim()))
  } catch (error) {
    failure.value = (error as Error).message
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :title="t('systems.skill.title')"
    :dismissible="!saving"
    @update:open="(open: boolean) => !open && emit('close')"
  >
    <template #body>
      <form id="new-skill" class="space-y-4" @submit.prevent="submit">
        <UFormField
          :label="t('systems.skill.name')"
          name="name"
          :error="nameError || undefined"
        >
          <UInput
            v-model="name"
            autofocus
            :maxlength="SKILL_NAME_MAX + 8"
            :placeholder="t('systems.skill.namePlaceholder')"
            class="w-full font-mono"
          />
        </UFormField>
        <UFormField
          :label="t('systems.skill.descriptionLabel')"
          name="description"
          :help="t('systems.skill.descriptionHelp')"
          :error="descriptionError || undefined"
        >
          <UTextarea
            v-model="description"
            :rows="3"
            :placeholder="t('systems.skill.descriptionPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <p v-if="failure" role="alert" class="text-sm text-error">
          {{ failure }}
        </p>
      </form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="saving"
          :label="t('systems.skill.cancel')"
          @click="emit('close')"
        />
        <UButton
          type="submit"
          form="new-skill"
          :disabled="!ready"
          :loading="saving"
          :label="
            saving ? t('systems.skill.creating') : t('systems.skill.create')
          "
        />
      </div>
    </template>
  </UModal>
</template>
