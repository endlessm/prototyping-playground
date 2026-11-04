<script setup lang="ts">
import CollectionArchivedHeading from '../../../../app/components/CollectionArchivedHeading.vue'
import CollectionViewToggle from '../../../../app/components/CollectionViewToggle.vue'
import SystemNewButton from '../components/SystemNewButton.vue'
import SystemsCollection from '../components/SystemsCollection.vue'
import { useSystemCatalog } from '../composables/useSystemCatalog'
import { useSystemDestination } from '../composables/useSystemChange'
import { deletionOf } from '../utils/destination'
import { inSystemOrder } from '../utils/pages'

// The collection: every system as a card or a row, the default first and
// the others alphabetically, with archived ones in their own section. The
// search is kept in the address (`?q=`). Locally, Admins create systems
// here.
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const manifest = await useManifest()
const { systems } = await useSystemCatalog()

useHead({ title: () => `${t('systems.title')} — ${studio.name}` })
// A deletion's tab finishes once the collection no longer lists the system.
useSystemDestination((destination) => {
  const deleted = deletionOf(destination)
  return Boolean(deleted) && !systems.value.some(({ id }) => id === deleted)
})

const query = computed(() =>
  typeof route.query.q === 'string' ? route.query.q : '',
)
const search = (value: string | number) =>
  navigateTo(
    { query: { ...route.query, q: String(value) || undefined } },
    { replace: true },
  )

const ordered = computed(() =>
  inSystemOrder(systems.value, manifest.value.defaultSystem),
)
const matching = computed(() => {
  const words = query.value.trim().toLowerCase()
  return ordered.value.filter((system) =>
    [
      system.id,
      system.key,
      system.label,
      system.summary ?? t('systems.genericDescription'),
      system.id === manifest.value.defaultSystem ? t('systems.default') : '',
    ].some((value) => value.toLowerCase().includes(words)),
  )
})
const active = computed(() =>
  matching.value.filter(({ status }) => status === 'active'),
)
const archivedId = useId()
const archived = computed(() =>
  matching.value.filter(({ status }) => status === 'archived'),
)
</script>

<template>
  <UDashboardPanel id="systems">
    <template #body>
      <div class="mx-auto w-full max-w-5xl px-2 pt-8 pb-8">
        <header class="mb-6">
          <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
            {{ t('systems.title') }}
          </h1>
          <div class="mt-0.5 flex flex-wrap items-center justify-between gap-4">
            <p class="min-w-0 text-sm leading-8 text-muted">
              {{ t('systems.description') }}
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <form role="search" @submit.prevent>
                <UInput
                  type="search"
                  :model-value="query"
                  icon="i-lucide-search"
                  :placeholder="t('systems.searchPlaceholder')"
                  :aria-label="t('systems.search')"
                  :class="[
                    query ? 'w-64' : 'w-36 focus-within:w-64',
                    'transition-[width] duration-200 motion-reduce:transition-none',
                  ]"
                  @update:model-value="search"
                >
                  <template v-if="query" #trailing>
                    <UButton
                      icon="i-lucide-x"
                      color="neutral"
                      variant="link"
                      size="xs"
                      :aria-label="t('systems.clearSearch')"
                      @click="() => void search('')"
                    />
                  </template>
                </UInput>
              </form>
              <CollectionViewToggle />
              <SystemNewButton />
            </div>
          </div>
        </header>
        <template v-if="matching.length">
          <SystemsCollection
            v-if="active.length"
            :systems="active"
            :label="t('systems.active')"
          />
          <section
            v-if="archived.length"
            :aria-labelledby="archivedId"
            :class="{ 'mt-10': active.length > 0 }"
          >
            <CollectionArchivedHeading :id="archivedId" />
            <SystemsCollection
              :systems="archived"
              :label="t('systems.archivedList')"
              archived
            />
          </section>
        </template>
        <UEmpty
          v-else
          icon="i-lucide-shapes"
          :title="t('systems.noMatches')"
          :description="t('systems.noMatchesHint')"
          variant="outline"
          class="border-dashed py-16"
        >
          <template #actions>
            <ULink to="/systems" class="text-sm hover:underline">
              {{ t('systems.viewAll') }}
            </ULink>
          </template>
        </UEmpty>
      </div>
    </template>
  </UDashboardPanel>
</template>
