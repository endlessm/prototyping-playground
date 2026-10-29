<script setup lang="ts">
import CollectionArchivedHeading from '../../../../app/components/CollectionArchivedHeading.vue'
import CollectionItems from '../../../../app/components/CollectionItems.vue'
import CollectionViewToggle from '../../../../app/components/CollectionViewToggle.vue'
import type { ManifestPrototype } from '../../../../app/composables/useManifest'
import PrototypeCard from '../components/PrototypeCard.vue'
import PrototypeNewButton from '../components/PrototypeNewButton.vue'
import PrototypeRow from '../components/PrototypeRow.vue'
import PrototypesFilter from '../components/PrototypesFilter.vue'
import PrototypesSearch from '../components/PrototypesSearch.vue'
import {
  matchesSearch,
  matchesSystem,
  newestFirst,
  PROTOTYPE_ICON,
} from '../utils/gallery'

// The Prototypes gallery: every prototype, newest first, as cards or a list,
// with search and a system filter kept in the address. Archived prototypes
// sit apart, below the rest, locally; the deployed site leaves them out.
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const manifest = await useManifest()
const { me } = useMe()
const local = import.meta.dev
useHead({ title: () => `${t('prototypes.gallery.title')} — ${studio.name}` })

const all = computed(() =>
  manifest.value.prototypes.filter(
    ({ status }) => local || status !== 'archived',
  ),
)
const text = computed(() =>
  typeof route.query.q === 'string' ? route.query.q : '',
)
const system = computed(() =>
  typeof route.query.system === 'string' && route.query.system
    ? route.query.system
    : undefined,
)
const shown = computed(() =>
  all.value
    .filter(
      (prototype) =>
        matchesSystem(manifest.value, prototype, system.value) &&
        matchesSearch(manifest.value, prototype, text.value),
    )
    .sort(newestFirst),
)
const active = computed(() =>
  shown.value.filter(({ status }) => status !== 'archived'),
)
const archived = computed(() =>
  shown.value.filter(({ status }) => status === 'archived'),
)
const keyOf = (prototype: ManifestPrototype) => prototype.id
const archivedId = useId()
</script>

<template>
  <UDashboardPanel id="prototypes">
    <template #body>
      <div class="mx-auto w-full max-w-5xl px-2 pt-10 pb-8">
        <header class="mb-6">
          <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
            {{ t('prototypes.gallery.title') }}
          </h1>
          <!-- The subtitle's line is as tall as the controls, so all of them
               centre on one line. -->
          <div
            class="mt-0.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
          >
            <p class="min-w-0 truncate text-sm leading-8 text-muted">
              {{ t('prototypes.gallery.subtitle') }}
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <PrototypesSearch v-if="all.length" />
              <PrototypesFilter />
              <CollectionViewToggle v-if="all.length" />
              <PrototypeNewButton />
            </div>
          </div>
        </header>

        <UEmpty
          v-if="!all.length"
          variant="outline"
          :icon="PROTOTYPE_ICON"
          :title="t('prototypes.gallery.emptyTitle')"
          :description="
            local && me.key
              ? t('prototypes.gallery.emptyLocal')
              : t('prototypes.gallery.emptyDeployed')
          "
          class="border-dashed py-16"
        />
        <UEmpty
          v-else-if="!shown.length"
          variant="naked"
          :title="t('prototypes.gallery.noMatches')"
          :description="t('prototypes.gallery.noMatchesHint')"
          :actions="[
            {
              label: t('prototypes.gallery.viewAll'),
              to: '/prototypes',
              variant: 'link',
            },
          ]"
          class="py-16"
        />
        <template v-else>
          <CollectionItems
            v-if="active.length"
            :items="active"
            :key-of="keyOf"
            :label="t('prototypes.gallery.title')"
          >
            <template #card="{ item }">
              <PrototypeCard :prototype="item" />
            </template>
            <template #row="{ item }">
              <PrototypeRow :prototype="item" created />
            </template>
          </CollectionItems>
          <section
            v-if="archived.length"
            :aria-labelledby="archivedId"
            :class="{ 'mt-10': active.length }"
          >
            <CollectionArchivedHeading :id="archivedId" />
            <CollectionItems
              :items="archived"
              :key-of="keyOf"
              :label="t('collection.archived')"
            >
              <template #card="{ item }">
                <PrototypeCard :prototype="item" />
              </template>
              <template #row="{ item }">
                <PrototypeRow :prototype="item" created />
              </template>
            </CollectionItems>
          </section>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
