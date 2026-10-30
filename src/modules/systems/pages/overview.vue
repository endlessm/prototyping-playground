<script setup lang="ts">
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import SystemPage from '../components/SystemPage.vue'
import SystemPageHeader from '../components/SystemPageHeader.vue'
import SystemReferenceNotice from '../components/SystemReferenceNotice.vue'
import SystemSetup from '../components/SystemSetup.vue'
import { byNewest } from '../utils/pages'
import directory from '#studio/directory'

// A system's Overview: what it is for, then its Instructions (Context and
// Skills), its Toolkit (components, theme tokens, local assets and colour
// modes) and where it is used. Counts come from the system's files.
// Locally, an active system no agent has set up offers its setup panel:
// instead of the blocks while it is completely empty, in a disclosure
// otherwise. After a rename, references left to review show first.
const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const studio = useStudioConfig()
const manifest = await useManifest()

useHead({
  title: () => `${props.system.label} — ${t('systems.title')} — ${studio.name}`,
})

const prototypes = computed(() =>
  manifest.value.prototypes.filter(
    ({ systemId, status }) =>
      systemId === props.system.id && status !== 'archived',
  ),
)
const recent = computed(() => byNewest(prototypes.value).slice(0, 3))
const ownerOf = (owner: string | null, contributor: string) =>
  directory.contributors.find(({ studioId }) => studioId === owner)?.key ??
  contributor

const instructions = computed(() => [
  {
    label: t('systems.overview.contextDocuments'),
    count: props.system.context.length,
  },
  { label: t('systems.overview.skills'), count: props.system.skills.length },
])
const toolkit = computed(() => [
  {
    label: t('systems.overview.components'),
    count: props.system.components.length,
  },
  { label: t('systems.overview.tokens'), count: props.system.tokens.length },
  { label: t('systems.overview.assets'), count: props.system.assets.length },
])
const colorModes = computed(() => {
  const modes = props.system.colorModes
  if (modes.length > 1) return t('systems.overview.both')
  return modes[0] === 'dark'
    ? t('systems.overview.darkOnly')
    : t('systems.overview.lightOnly')
})
const local = import.meta.dev
const settingUp = computed(
  () =>
    local && props.system.status === 'active' && !props.system.setupRecorded,
)
const empty = computed(
  () =>
    settingUp.value &&
    [
      props.system.tokens,
      props.system.components,
      props.system.assets,
      props.system.context,
      props.system.skills,
    ].every((list) => list.length === 0),
)
const block = 'min-w-0 rounded-xl border border-default bg-elevated/40 p-6'
</script>

<template>
  <SystemPage :system="system" source="system.ts">
    <SystemPageHeader
      :title="system.label"
      :description="
        system.summary ?? t('systems.overview.generic', { name: system.label })
      "
    />
    <SystemReferenceNotice v-if="local" :system="system" />
    <UAlert
      v-if="system.status === 'archived'"
      icon="i-lucide-archive"
      color="neutral"
      variant="subtle"
      :title="t('systems.overview.archived')"
      :description="t('systems.overview.archivedHint')"
      class="mb-6"
    />
    <template v-if="empty">
      <p class="mb-6 text-sm leading-6 text-default">
        {{ t('systems.overview.empty') }}
      </p>
      <SystemSetup :system="system" />
    </template>
    <UCollapsible v-else-if="settingUp" class="mb-6">
      <UButton
        color="neutral"
        variant="outline"
        trailing-icon="i-lucide-chevron-down"
        :label="t('systems.overview.curate')"
        :ui="{
          trailingIcon:
            'group-data-[state=open]:rotate-180 transition-transform duration-200 motion-reduce:transition-none',
        }"
      />
      <template #content>
        <SystemSetup :system="system" class="mt-4" />
      </template>
    </UCollapsible>
    <div v-if="!empty" class="grid gap-4">
      <section :class="block" aria-labelledby="system-instructions">
        <h2
          id="system-instructions"
          class="mb-4 text-lg font-semibold tracking-tight text-highlighted"
        >
          {{ t('systems.overview.instructions') }}
        </h2>
        <ul class="mb-5 grid grid-cols-3 gap-4">
          <li
            v-for="metric in instructions"
            :key="metric.label"
            class="flex flex-col gap-1"
          >
            <span
              class="text-3xl font-semibold tracking-tight text-highlighted tabular-nums"
            >
              {{ metric.count }}
            </span>
            <span class="text-xs text-muted">{{ metric.label }}</span>
          </li>
        </ul>
        <p v-if="system.guidance" class="text-sm leading-6 text-default">
          {{ system.guidance }}
        </p>
        <p
          v-else-if="!system.context.length && !system.skills.length"
          class="text-sm leading-6 text-default"
        >
          {{ t('systems.overview.noInstructions') }}
        </p>
      </section>
      <section :class="block" aria-labelledby="system-toolkit">
        <h2
          id="system-toolkit"
          class="mb-4 text-lg font-semibold tracking-tight text-highlighted"
        >
          {{ t('systems.overview.toolkit') }}
        </h2>
        <ul class="mb-5 grid grid-cols-3 gap-4">
          <li
            v-for="metric in toolkit"
            :key="metric.label"
            class="flex flex-col gap-1"
          >
            <span
              class="text-3xl font-semibold tracking-tight text-highlighted tabular-nums"
            >
              {{ metric.count }}
            </span>
            <span class="text-xs text-muted">{{ metric.label }}</span>
          </li>
        </ul>
        <p v-if="system.code" class="text-sm leading-6 text-default">
          {{ system.code }}
        </p>
        <p class="mt-4 text-xs text-muted">{{ colorModes }}</p>
      </section>
      <section :class="block" aria-labelledby="system-usage">
        <h2
          id="system-usage"
          class="mb-4 text-lg font-semibold tracking-tight text-highlighted"
        >
          {{ t('systems.overview.usage') }}
        </h2>
        <div class="mb-5 flex flex-col gap-1">
          <span
            class="text-3xl font-semibold tracking-tight text-highlighted tabular-nums"
          >
            {{ prototypes.length }}
          </span>
          <span class="text-xs text-muted">
            {{ t('systems.overview.prototypes') }}
          </span>
        </div>
        <template v-if="prototypes.length">
          <ul class="space-y-1">
            <li v-for="prototype in recent" :key="prototype.id">
              <ULink
                :to="`/prototypes/${prototype.id}`"
                class="flex items-center gap-3 rounded-lg border border-default px-4 py-3 text-sm hover:bg-elevated"
              >
                <span class="min-w-0 flex-1 truncate">
                  {{ prototype.title }}
                </span>
                <span class="max-w-36 truncate text-xs text-muted">
                  {{ ownerOf(prototype.owner, prototype.contributor) }}
                </span>
                <UIcon
                  name="i-lucide-arrow-up-right"
                  class="size-3.5 shrink-0"
                />
              </ULink>
            </li>
          </ul>
          <ULink
            :to="{ path: '/prototypes', query: { system: system.id } }"
            class="mt-3 inline-flex items-center gap-1 text-sm hover:underline"
          >
            {{ t('systems.overview.viewPrototypes') }}
            <UIcon name="i-lucide-arrow-up-right" class="size-3.5" />
          </ULink>
        </template>
        <p v-else class="text-sm leading-6 text-default">
          {{ t('systems.overview.noUsage', { name: system.label }) }}
        </p>
      </section>
    </div>
  </SystemPage>
</template>
