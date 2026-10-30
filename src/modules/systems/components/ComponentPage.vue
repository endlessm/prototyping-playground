<script setup lang="ts">
import { stemOf } from '../../../../tooling/systems/components'
import type {
  CatalogComponent,
  ComponentPageData,
  SystemCatalog,
} from '../composables/useSystemCatalog'
import { systemAddress } from '../utils/pages'
import ComponentGuide from './ComponentGuide.vue'
import ComponentProps from './ComponentProps.vue'
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
const libraries = computed(() =>
  props.system.libraries.filter((library) =>
    library.components.includes(props.component.slug),
  ),
)
// A link from the page's frontmatter, if it's a web address.
const docsLink = computed(() => {
  try {
    const url = new URL(props.component.docsUrl ?? '')
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : null
  } catch {
    return null
  }
})
const file = computed(
  () =>
    props.component.source ??
    props.component.doc ??
    props.component.examplesFile,
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
  />
  <div
    v-if="data?.errors.length"
    role="alert"
    class="mb-6 space-y-2 rounded-md border border-default p-3 text-sm"
  >
    <p class="text-default">{{ t('systems.component.loadErrors') }}</p>
    <p v-for="error in data.errors" :key="error" class="text-muted">
      {{ error }}
    </p>
    <UButton
      size="sm"
      color="neutral"
      variant="outline"
      :label="t('systems.component.tryAgain')"
      @click="retry"
    />
  </div>

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

  <section v-if="file" class="mt-12" aria-labelledby="component-source">
    <h2
      id="component-source"
      class="mb-4 text-lg font-semibold tracking-tight text-highlighted"
    >
      {{ t('systems.component.source') }}
    </h2>
    <div class="flex items-start gap-3 rounded-lg border border-default p-4">
      <UIcon
        name="i-lucide-library"
        class="mt-0.5 size-4 shrink-0 text-muted"
      />
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-3">
        <div class="min-w-0 flex-1 basis-56">
          <div
            v-if="libraries.length"
            class="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium"
          >
            <ULink
              v-for="library in libraries"
              :key="library.id"
              :to="{
                path: systemAddress(system.id, 'libraries'),
                hash: `#${library.id}`,
              }"
              class="inline-flex items-center gap-1 text-highlighted hover:underline"
              :aria-label="
                t('systems.component.inLibraries', { name: library.label })
              "
            >
              {{ library.label }}
              <UIcon name="i-lucide-arrow-right" class="size-3.5 text-muted" />
            </ULink>
          </div>
          <p
            v-if="component.sourceNote"
            class="text-sm leading-6 text-muted"
            :class="{ 'mt-1': libraries.length }"
          >
            {{ component.sourceNote }}
          </p>
        </div>
        <a
          v-if="docsLink"
          :href="docsLink"
          target="_blank"
          rel="noreferrer"
          class="ml-auto inline-flex items-center gap-1 text-sm text-highlighted underline underline-offset-4 hover:text-muted"
        >
          {{ t('systems.component.componentDocs') }}
          <UIcon name="i-lucide-external-link" class="size-3.5" />
        </a>
        <p class="w-full font-mono text-xs break-all text-muted">
          <span class="font-sans">{{ t('systems.component.file') }}</span>
          {{ file }}
        </p>
      </div>
    </div>
  </section>

  <ComponentProps
    v-if="component.source && data?.props"
    :components="[data.props]"
  />
</template>
