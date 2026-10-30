<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { setupPrompt, type SetupPath } from '../utils/setup'

// The setup panel of a system no agent has set up yet: choose a foundation
// (bring another Vue app in, or start from Nuxt UI), add optional details,
// then copy the prompt for the agent. Details are kept per path while the
// page is open and never saved. Local only.
const props = defineProps<{ system: { key: string; label: string } }>()
const { t } = useI18n()
const { copy } = useClipboard({ legacy: true })

const path = ref<SetupPath>('vue')
const source = ref('')
const designMd = ref('')
const build = reactive<Record<SetupPath, string>>({ vue: '', 'nuxt-ui': '' })
const components = ref('')
const copied = ref(false)
const failure = ref('')

const paths = computed(() => [
  { label: t('systems.setup.vue'), value: 'vue' },
  { label: t('systems.setup.nuxtUi'), value: 'nuxt-ui' },
])
const prompt = computed(() =>
  setupPrompt({
    key: props.system.key,
    label: props.system.label,
    path: path.value,
    source: path.value === 'vue' ? source.value : undefined,
    designMd: path.value === 'nuxt-ui' ? designMd.value : undefined,
    build: build[path.value],
    components: path.value === 'nuxt-ui' ? components.value : undefined,
  }),
)
watch(prompt, () => {
  copied.value = false
  failure.value = ''
})

async function copyPrompt() {
  try {
    await copy(prompt.value)
    copied.value = true
    failure.value = ''
  } catch {
    failure.value = t('systems.setup.failed')
  }
}

const block = 'min-w-0 rounded-xl border border-default bg-elevated/40 p-6'
const heading = 'mb-4 text-lg font-semibold tracking-tight text-highlighted'
const ids = { foundation: useId(), details: useId(), prompt: useId() }
</script>

<template>
  <div
    class="grid gap-4"
    :aria-label="t('systems.setup.label', { name: system.label })"
    role="group"
  >
    <section :class="block" :aria-labelledby="ids.foundation">
      <h2 :id="ids.foundation" :class="heading">
        {{ t('systems.setup.foundation') }}
      </h2>
      <UTabs
        v-model="path"
        :items="paths"
        :content="false"
        :aria-label="t('systems.setup.foundationLabel')"
        class="w-fit"
      />
    </section>
    <section :class="block" :aria-labelledby="ids.details">
      <h2 :id="ids.details" :class="heading">
        {{ t('systems.setup.details') }}
      </h2>
      <div class="space-y-4">
        <p class="text-sm leading-6 text-muted">
          {{
            path === 'vue'
              ? t('systems.setup.vueIntro')
              : t('systems.setup.nuxtUiIntro')
          }}
        </p>
        <UFormField
          v-if="path === 'vue'"
          :label="t('systems.setup.source')"
          :hint="t('systems.setup.optional')"
          :help="t('systems.setup.sourceHelp')"
        >
          <UTextarea
            v-model="source"
            :rows="2"
            :placeholder="t('systems.setup.sourcePlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          v-else
          :label="t('systems.setup.designMd')"
          :hint="t('systems.setup.optional')"
        >
          <UInput
            v-model="designMd"
            :placeholder="t('systems.setup.designMdPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="t('systems.setup.build')"
          :hint="t('systems.setup.optional')"
          :help="t('systems.setup.buildHelp')"
        >
          <UTextarea
            v-model="build[path]"
            :rows="3"
            :placeholder="t('systems.setup.buildPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          v-if="path === 'nuxt-ui'"
          :label="t('systems.setup.components')"
          :hint="t('systems.setup.optional')"
        >
          <UTextarea
            v-model="components"
            :rows="3"
            :placeholder="t('systems.setup.componentsPlaceholder')"
            class="w-full"
          />
        </UFormField>
      </div>
    </section>
    <section :class="block" :aria-labelledby="ids.prompt">
      <h2 :id="ids.prompt" :class="heading">
        {{ t('systems.setup.prompt') }}
      </h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        {{ t('systems.setup.promptIntro') }}
      </p>
      <p
        data-setup-prompt
        class="rounded-lg border border-default bg-default p-4 text-sm leading-6 whitespace-pre-wrap select-text"
      >
        {{ prompt }}
      </p>
      <UButton
        class="mt-4"
        icon="i-lucide-copy"
        :label="copied ? t('systems.setup.copied') : t('systems.setup.copy')"
        @click="copyPrompt"
      />
      <p role="status" class="mt-2 text-xs text-muted">
        {{ failure || (copied ? t('systems.setup.copiedHint') : '') }}
      </p>
    </section>
  </div>
</template>
