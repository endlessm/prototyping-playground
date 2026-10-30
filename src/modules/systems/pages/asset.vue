<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import { assetUrl } from '../../../../tooling/systems/asset-files'
import SystemFontPreview from '../components/SystemFontPreview.vue'
import SystemPage from '../components/SystemPage.vue'
import SystemPageHeader from '../components/SystemPageHeader.vue'
import { systemAddress } from '../utils/pages'

// One asset's preview: a link back to its page, its name, its path and the
// file in the repository. Images show as pictures, so an SVG's scripts never
// run; fonts load on their own. The studio's look, with no editor or file
// actions.
const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const base = useRuntimeConfig().app.baseURL

const kind = computed(() => route.params.kind as string)
const asset = computed(() => {
  const path = route.params.path
  const inside = Array.isArray(path) ? path.join('/') : path
  return props.system.assets.find(
    (entry) => entry.kind === kind.value && entry.path === inside,
  )
})
const name = computed(() => asset.value?.path.split('/').at(-1) ?? '')
const url = computed(() =>
  asset.value ? assetUrl(base, props.system.id, asset.value.file) : '',
)
useHead({
  title: () =>
    `${name.value} — ${props.system.label} — ${t('systems.title')} — ${studio.name}`,
})
</script>

<template>
  <div v-if="!asset" class="mx-auto w-full max-w-3xl px-4 py-6">
    <AppNotFound />
  </div>
  <SystemPage v-else :system="system">
    <NuxtLink
      :to="systemAddress(system.id, kind)"
      class="mb-4 inline-block text-sm text-muted hover:underline"
    >
      {{ t(`systems.pages.${kind}`) }}
    </NuxtLink>
    <SystemPageHeader :title="name" :description="asset.path" />
    <div class="rounded-xl border border-default bg-elevated/40 p-6">
      <SystemFontPreview v-if="asset.kind === 'fonts'" :url="url" />
      <img
        v-else
        :src="url"
        :alt="asset.path"
        class="mx-auto max-h-96 max-w-full object-contain"
      />
    </div>
    <p class="mt-4 text-xs break-all text-muted">
      {{ `${system.folder}/${asset.file}` }}
    </p>
  </SystemPage>
</template>
