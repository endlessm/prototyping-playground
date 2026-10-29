<script setup lang="ts">
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import SystemPage from '../components/SystemPage.vue'
import SystemPageHeader from '../components/SystemPageHeader.vue'
import { systemAddress } from '../utils/pages'

// The sources and tools behind a system: each declared library with its
// installed version, what it contributes and its documentation. Each entry
// has its own anchor (`/libraries#<id>`). The page is generated, so it has
// no source of its own.
const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const studio = useStudioConfig()

useHead({
  title: () =>
    `${t('systems.libraries.title')} — ${props.system.label} — ${t('systems.title')} — ${studio.name}`,
})

const page = (id: string) => systemAddress(props.system.id, id)
const iconOf = (assets: string[]) =>
  assets.includes('icons')
    ? 'i-lucide-smile'
    : assets.includes('fonts')
      ? 'i-lucide-type'
      : assets.includes('images')
        ? 'i-lucide-image'
        : 'i-lucide-library'
const related = (library: SystemCatalog['libraries'][number]) => [
  ...(library.assets.includes('fonts')
    ? [{ label: t('systems.pages.typography'), to: page('typography') }]
    : []),
  ...library.assets.map((kind) => ({
    label: t(`systems.pages.${kind}`),
    to: page(kind),
  })),
  ...props.system.components
    .filter((component) => library.components.includes(component.slug))
    .map((component) => ({
      label: component.title,
      to: page(`components/${component.slug}`),
    })),
]
</script>

<template>
  <SystemPage :system="system">
    <SystemPageHeader
      :title="t('systems.libraries.title')"
      :description="t('systems.libraries.description', { name: system.label })"
    />
    <div
      v-if="!system.libraries.length"
      class="rounded-xl border border-default bg-elevated/40 p-6"
    >
      <UIcon name="i-lucide-library" class="mb-3 size-5 text-muted" />
      <h2 class="font-medium text-highlighted">
        {{ t('systems.libraries.empty') }}
      </h2>
      <p class="mt-2 text-sm text-muted">
        {{ t('systems.libraries.emptyHint') }}
      </p>
    </div>
    <ul v-else :aria-label="t('systems.libraries.list')" class="space-y-3">
      <li
        v-for="library in system.libraries"
        :id="library.id"
        :key="library.id"
        class="flex scroll-mt-6 items-start gap-3 rounded-lg border border-default p-4"
      >
        <UIcon
          :name="iconOf(library.assets)"
          class="mt-0.5 size-4 shrink-0 text-muted"
        />
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-3">
          <div class="min-w-0 flex-1 basis-56">
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h2 class="text-sm font-semibold text-highlighted">
                {{ library.label }}
              </h2>
              <span class="text-xs text-muted">
                {{
                  library.version
                    ? t('systems.libraries.version', {
                        version: library.version,
                      })
                    : t('systems.libraries.notInstalled')
                }}
              </span>
            </div>
            <p
              v-if="!library.version"
              role="status"
              class="mt-1 text-xs text-muted"
            >
              {{ t('systems.libraries.install') }}
            </p>
            <p v-if="library.description" class="mt-1 text-sm text-muted">
              {{ library.description }}
            </p>
          </div>
          <div
            class="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm"
          >
            <ULink
              v-for="link in related(library)"
              :key="link.to"
              :to="link.to"
              class="underline underline-offset-4 hover:text-muted"
            >
              {{ link.label }}
            </ULink>
            <a
              v-if="library.docs"
              :href="library.docs"
              target="_blank"
              rel="noreferrer"
              :aria-label="
                t('systems.libraries.docsLabel', { name: library.label })
              "
              class="inline-flex items-center gap-1 underline underline-offset-4 hover:text-muted"
            >
              {{ t('systems.libraries.docs') }}
              <UIcon name="i-lucide-external-link" class="size-3.5" />
            </a>
          </div>
        </div>
      </li>
    </ul>
  </SystemPage>
</template>
