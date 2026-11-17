<script setup lang="ts">
import ComponentGuide from '../../systems/components/ComponentGuide.vue'
import ComponentLoadErrors from '../../systems/components/ComponentLoadErrors.vue'
import ComponentProps from '../../systems/components/ComponentProps.vue'
import ComponentSource from '../../systems/components/ComponentSource.vue'
import { systemAddress } from '../../systems/utils/pages'
import { useLabComponent } from '../composables/useLabComponent'

// Overview: the component's guide, Source and Props as its Systems page
// shows them, without the examples, and a link to that page. Files that
// couldn't load are listed with Try again; whatever did load still shows.
// It reads at the Systems page's width.
const { system, component, stem, data, reload } = useLabComponent()
const { t } = useI18n()

// Remounts the guide, so it tries again from scratch.
const attempt = ref(0)
function retry() {
  attempt.value++
  void reload()
}

const systemsPage = computed(() =>
  systemAddress(system.value.id, `components/${component.value.slug}`),
)
</script>

<template>
  <div class="max-w-3xl">
    <ULink
      :to="systemsPage"
      class="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-highlighted hover:underline"
    >
      <UIcon name="i-lucide-shapes" class="size-3.5 text-muted" />
      {{ t('lab.overview.openInSystems') }}
    </ULink>
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

    <ComponentSource :system="system" :component="component" />

    <ComponentProps
      v-if="component.source && data?.props"
      :components="[data.props]"
    />
  </div>
</template>
