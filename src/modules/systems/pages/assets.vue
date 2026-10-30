<script setup lang="ts">
import type { SystemAssetKind } from '../../../../tooling/systems/contract'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import { assetUrl } from '../../../../tooling/systems/asset-files'
import SystemPage from '../components/SystemPage.vue'
import SystemPageHeader from '../components/SystemPageHeader.vue'
import { assetAddress, systemAddress } from '../utils/pages'

// One of a system's asset pages, Fonts, Icons or Images: the libraries that
// supply that kind, the system's icon sample on Icons, then its own files,
// those added to `assets/` and those copied with the app's source, each
// opening its preview. In the studio's own look, with no source to edit.
const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const base = useRuntimeConfig().app.baseURL

const kind = computed(() => route.params.kind as SystemAssetKind)
const ICONS: Record<SystemAssetKind, string> = {
  fonts: 'i-lucide-type',
  icons: 'i-lucide-smile',
  images: 'i-lucide-image',
}
const libraries = computed(() =>
  props.system.libraries.filter((library) =>
    library.assets.includes(kind.value),
  ),
)
const sample = computed(() =>
  kind.value === 'icons' ? props.system.icons : null,
)
const sections = computed(() =>
  (['local', 'app'] as const)
    .map((origin) => ({
      origin,
      assets: props.system.assets.filter(
        (asset) => asset.kind === kind.value && asset.origin === origin,
      ),
    }))
    .filter(({ assets }) => assets.length),
)
const title = computed(() => t(`systems.pages.${kind.value}`))
useHead({
  title: () =>
    `${title.value} — ${props.system.label} — ${t('systems.title')} — ${studio.name}`,
})
</script>

<template>
  <SystemPage :system="system">
    <SystemPageHeader
      :title="title"
      :description="t(`systems.assets.description.${kind}`)"
    />
    <ul
      v-if="libraries.length"
      :aria-label="t('systems.assets.libraries', { kind: title })"
      class="mb-6 space-y-2"
    >
      <li v-for="library in libraries" :key="library.id">
        <NuxtLink
          :to="{
            path: systemAddress(system.id, 'libraries'),
            hash: `#${library.id}`,
          }"
          :aria-label="t('systems.assets.inLibraries', { name: library.label })"
          class="flex items-center gap-3 rounded-lg border border-default px-4 py-3 text-sm hover:bg-elevated"
        >
          <UIcon :name="ICONS[kind]" class="size-4 shrink-0 text-muted" />
          <span class="min-w-0 flex-1">
            <span class="font-medium text-highlighted">{{
              library.label
            }}</span>
            <span class="ml-2 text-muted">
              {{ t(`systems.assets.libraryKind.${kind}`) }}
            </span>
          </span>
          <UIcon name="i-lucide-arrow-right" class="size-3.5 text-muted" />
        </NuxtLink>
      </li>
    </ul>

    <div v-if="sample" class="mb-8">
      <pre
        class="mb-4 overflow-x-auto rounded-lg border border-default bg-elevated/50 p-4 font-mono text-[13px] leading-6"
      ><code>{{ sample.snippet }}</code></pre>
      <p class="mb-4 text-sm">
        <a
          :href="sample.href"
          target="_blank"
          rel="noreferrer"
          class="font-medium text-highlighted underline underline-offset-4"
        >
          {{ t('systems.assets.browseIcons') }}
        </a>
      </p>
      <ul class="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
        <li
          v-for="name in sample.names"
          :key="name"
          class="flex flex-col items-center gap-2 rounded-lg border border-default p-3"
        >
          <UIcon :name="name" class="size-6 text-highlighted" />
          <span
            class="w-full truncate text-center font-mono text-[11px] text-muted"
          >
            {{ name }}
          </span>
        </li>
      </ul>
    </div>

    <section
      v-for="section in sections"
      :key="section.origin"
      class="mb-8"
      :aria-labelledby="`assets-${section.origin}`"
    >
      <h2
        :id="`assets-${section.origin}`"
        class="mb-2 text-lg font-semibold text-highlighted"
      >
        {{ t(`systems.assets.${section.origin}.${kind}`) }}
      </h2>
      <p class="mb-4 text-sm text-muted">
        {{
          t(
            section.origin === 'local'
              ? 'systems.assets.localHint'
              : 'systems.assets.appHint',
          )
        }}
      </p>
      <ul
        :aria-label="t(`systems.assets.${section.origin}.${kind}`)"
        class="space-y-2"
      >
        <li v-for="asset in section.assets" :key="asset.path">
          <NuxtLink
            :to="assetAddress(system, asset)"
            class="flex items-center gap-4 rounded-lg border border-default px-4 py-3 hover:bg-elevated"
          >
            <img
              v-if="kind !== 'fonts'"
              :src="assetUrl(base, system.id, asset.file)"
              alt=""
              loading="lazy"
              class="size-10 shrink-0 object-contain"
            />
            <span class="min-w-0 text-sm break-all">{{ asset.path }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <div
      v-if="!sections.some(({ origin }) => origin === 'local')"
      class="flex flex-col items-center justify-center rounded-xl border border-default bg-elevated/40 p-6 text-center"
      :class="libraries.length || sample ? 'min-h-48' : 'min-h-64'"
    >
      <span
        class="mb-3 flex size-10 items-center justify-center rounded-lg border border-default bg-default"
      >
        <UIcon :name="ICONS[kind]" class="size-5 text-muted" />
      </span>
      <h2 class="font-medium text-highlighted">
        {{ t(`systems.assets.empty.${kind}`) }}
      </h2>
      <p class="mt-2 max-w-sm text-sm text-muted">
        {{ t(`systems.assets.emptyHint.${kind}`) }}
      </p>
    </div>
  </SystemPage>
</template>
