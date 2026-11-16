<script setup lang="ts">
import { stemOf } from '../../../../tooling/systems/components'
import type {
  CatalogComponent,
  ComponentPageData,
  SystemCatalog,
} from '../composables/useSystemCatalog'
import ComponentGuide from './ComponentGuide.vue'
import ComponentLoadErrors from './ComponentLoadErrors.vue'
import ComponentProps from './ComponentProps.vue'
import ComponentSource from './ComponentSource.vue'
import SystemPageHeader from './SystemPageHeader.vue'
import SystemPreview from './SystemPreview.vue'

// One component's page, built from its files: the title and description,
// the Markdown page, live examples with their code, where the component
// comes from, then its props read from its code. A part the component
// doesn't have yet says which file to add. Files that couldn't load are
// listed with Try again; whatever did load still shows.
const props = defineProps<{
  system: SystemCatalog
  component: CatalogComponent
  data: ComponentPageData | undefined
}>()
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()

// Remounts the examples, so each tries again from scratch.
const attempt = ref(0)
function retry() {
  attempt.value++
  emit('retry')
}

const stem = computed(() =>
  stemOf(props.component.source ?? props.component.name),
)
// The Lab is an optional module and shows active systems only. Its address
// is written out, so this page doesn't depend on its code.
const labLink = computed(() =>
  useStudioModule('lab') && props.system.status === 'active'
    ? `/lab/${props.system.id}/${props.component.slug}`
    : null,
)
const showCode = ref(false)
// The examples file's text as a fenced Vue block, highlighted by the
// Markdown pipeline; the fence is longer than any backtick run inside.
const code = computed(() => {
  const text = props.data?.examples
  if (!text) return null
  const longest = Math.max(
    2,
    ...[...text.matchAll(/`+/g)].map((run) => run[0].length),
  )
  const fence = '`'.repeat(longest + 1)
  return [`${fence}vue`, text.trimEnd(), fence].join('\n')
})
</script>

<template>
  <SystemPageHeader
    :title="component.title"
    :description="component.description ?? undefined"
  >
    <ULink
      v-if="labLink"
      :to="labLink"
      class="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-highlighted hover:underline"
    >
      <UIcon name="i-lucide-flask-conical" class="size-3.5 text-muted" />
      {{ t('lab.openInLab') }}
    </ULink>
  </SystemPageHeader>
  <ComponentLoadErrors
    v-if="data?.errors.length"
    :errors="data.errors"
    @retry="retry"
  />

  <ComponentGuide
    v-if="data?.page"
    :key="attempt"
    :source="data.page"
    :file="component.doc!"
  />
  <i18n-t
    v-else-if="!component.doc"
    keypath="systems.component.noPage"
    tag="p"
    class="text-sm text-muted"
    scope="global"
  >
    <template #file>
      <code class="font-mono">{{ stem }}.md</code>
    </template>
  </i18n-t>

  <section class="mt-12" aria-labelledby="component-examples">
    <h2
      id="component-examples"
      class="mb-4 text-lg font-semibold tracking-tight text-highlighted"
    >
      {{ t('systems.component.examples') }}
    </h2>
    <i18n-t
      v-if="!component.examplesFile"
      keypath="systems.component.noExamples"
      tag="p"
      class="text-sm text-muted"
      scope="global"
    >
      <template #file>
        <code class="font-mono">{{ stem }}.examples.vue</code>
      </template>
      <template #example>
        <code class="font-mono">&lt;Example name="…"&gt;</code>
      </template>
    </i18n-t>
    <template v-else>
      <div class="space-y-5">
        <div v-for="example in component.examples" :key="example.id">
          <h3 class="mb-2 text-xs font-medium text-muted">
            {{ example.title }}
          </h3>
          <SystemPreview
            :key="`${example.id}:${attempt}`"
            :system-id="system.id"
            :artifact="example.id"
            :title="example.title"
          />
        </div>
      </div>
      <UCollapsible v-if="code" v-model:open="showCode" class="mt-4">
        <button
          type="button"
          class="flex cursor-pointer items-center gap-1.5 rounded-sm text-sm font-medium text-highlighted outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <UIcon
            name="i-lucide-chevron-down"
            class="size-3.5 text-muted transition-transform"
            :class="{ '-rotate-90': !showCode }"
          />
          {{ t('systems.component.showCode') }}
        </button>
        <template #content>
          <ComponentGuide
            class="mt-2"
            :source="code"
            :file="component.examplesFile"
          />
        </template>
      </UCollapsible>
    </template>
  </section>

  <ComponentSource :system="system" :component="component" />

  <ComponentProps
    v-if="component.source && data?.props"
    :components="[data.props]"
  />
</template>
