<script setup lang="ts">
import AppSectionNav from '../AppSectionNav.vue'
import DocumentationHeader from './DocumentationHeader.vue'
import DocumentationNavItem from './DocumentationNavItem.vue'
import type { GuidanceKind, GuidanceOwner } from '../../composables/useGuidance'
import { guidanceHref } from '../../../tooling/guidance/addresses'

// Context & Skills' navigation: the Platform's guidance, then a branch for
// each enabled module, each listing its README, context documents, skills
// and other contract files. Branches fold, stay as left while browsing, and
// open for the current document. Search matches owners, titles, kinds and
// file paths (not the text), opening the branches that match until it is
// cleared.
const { t } = useI18n()
const route = useRoute()
const owners = await useGuidance()

const ICONS: Record<GuidanceKind, string> = {
  readme: 'i-lucide-file-text',
  reference: 'i-lucide-file-text',
  context: 'i-lucide-notebook-text',
  skill: 'i-lucide-wand-sparkles',
}

// Which module branches are open, for as long as the studio is open.
const branches = useState<Record<string, boolean>>(
  'documentation:guidance-branches',
  () => ({}),
)
const currentOwner = computed(() => String(route.params.owner ?? ''))
watch(
  currentOwner,
  (owner) => {
    if (owner && owner !== 'platform') branches.value[owner] = true
  },
  { immediate: true },
)

// Search.
const searchOpen = ref(false)
const query = ref('')
const field = useTemplateRef<{ inputRef: HTMLInputElement }>('field')
const words = computed(() => query.value.trim().toLowerCase())
const searching = computed(() => Boolean(words.value))
const matches = (text: string) => text.toLowerCase().includes(words.value)

function shown(owner: GuidanceOwner) {
  const all = owner.documents.map((document) => ({
    document,
    entry: {
      to: guidanceHref(owner.id, document.address),
      path: document.file,
    },
    label: document.title,
    kind: t(`documentation.kinds.${document.kind}`),
  }))
  if (!searching.value) return all
  const ownerMatches =
    matches(owner.label) ||
    matches(owner.folder) ||
    (owner.kind === 'module' && matches(t('documentation.modules')))
  return ownerMatches
    ? all
    : all.filter(
        (item) =>
          matches(item.label) || matches(item.kind) || matches(item.entry.path),
      )
}
const platform = computed(() =>
  owners.value.filter((owner) => owner.kind === 'platform'),
)
const modules = computed(() =>
  owners.value
    .filter((owner) => owner.kind === 'module')
    .map((owner) => ({ owner, items: shown(owner) }))
    .filter(({ items }) => !searching.value || items.length),
)
const nothing = computed(
  () =>
    searching.value &&
    !modules.value.length &&
    platform.value.every((owner) => !shown(owner).length),
)

async function toggleSearch() {
  searchOpen.value = !searchOpen.value
  query.value = ''
  if (searchOpen.value) {
    await nextTick()
    field.value?.inputRef.focus()
  }
}
function onEscape(event: KeyboardEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (query.value) query.value = ''
  else searchOpen.value = false
}
async function clear() {
  query.value = ''
  await nextTick()
  field.value?.inputRef.focus()
}
const open = (id: string) => searching.value || Boolean(branches.value[id])
</script>

<template>
  <AppSectionNav :label="t('documentation.title')">
    <template #header>
      <DocumentationHeader current="context" />
    </template>
    <div class="px-1 pt-1">
      <div class="flex h-7 items-center justify-between pl-1">
        <p class="text-xs font-semibold text-highlighted">
          {{ t('documentation.resources') }}
        </p>
        <UTooltip :text="t('documentation.search')">
          <UButton
            icon="i-lucide-search"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="t('documentation.search')"
            :aria-pressed="searchOpen"
            @click="toggleSearch"
          />
        </UTooltip>
      </div>
      <UInput
        v-if="searchOpen"
        ref="field"
        v-model="query"
        type="search"
        size="sm"
        class="mt-1 w-full"
        :placeholder="t('documentation.searchField')"
        :aria-label="t('documentation.searchField')"
        @keydown.esc="onEscape"
      >
        <template v-if="query" #trailing>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="link"
            size="xs"
            :aria-label="t('documentation.clear')"
            @click="clear"
          />
        </template>
      </UInput>
    </div>
    <div class="space-y-4 pb-4">
      <template v-for="owner in platform" :key="owner.id">
        <section
          v-if="shown(owner).length"
          :aria-label="owner.label"
          class="space-y-0.5"
        >
          <h3
            class="flex h-7 items-center px-2 text-xs font-semibold text-muted"
          >
            <ULink
              :to="guidanceHref(owner.id)"
              :title="owner.folder"
              class="hover:text-highlighted"
            >
              {{ owner.label }}
            </ULink>
          </h3>
          <DocumentationNavItem
            v-for="item in shown(owner)"
            :key="item.entry.to"
            :entry="item.entry"
            :label="item.label"
            :icon="ICONS[item.document.kind]"
            :detail="item.kind"
          />
        </section>
      </template>
      <section
        v-if="modules.length"
        :aria-label="t('documentation.modules')"
        class="space-y-0.5"
      >
        <h3 class="flex h-7 items-center px-2 text-xs font-semibold text-muted">
          {{ t('documentation.modules') }}
        </h3>
        <div v-for="{ owner, items } in modules" :key="owner.id">
          <div class="flex h-7 min-w-0 items-center">
            <UButton
              :icon="
                open(owner.id)
                  ? 'i-lucide-chevron-down'
                  : 'i-lucide-chevron-right'
              "
              color="neutral"
              variant="ghost"
              size="xs"
              square
              :aria-label="t('documentation.toggle', { name: owner.label })"
              :aria-expanded="open(owner.id)"
              class="shrink-0"
              @click="() => void (branches[owner.id] = !open(owner.id))"
            />
            <ULink
              :to="guidanceHref(owner.id)"
              :title="`${owner.folder}/`"
              :aria-current="
                route.path === guidanceHref(owner.id) ? 'page' : undefined
              "
              class="flex h-7 min-w-0 flex-1 items-center rounded-md px-1.5 text-xs font-medium text-default outline-none hover:bg-elevated/50 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span class="truncate">{{ owner.label }}</span>
            </ULink>
          </div>
          <div v-show="open(owner.id)" class="space-y-0.5 pl-4">
            <DocumentationNavItem
              v-for="item in items"
              :key="item.entry.to"
              :entry="item.entry"
              :label="item.label"
              :icon="ICONS[item.document.kind]"
              :detail="item.kind"
            />
          </div>
        </div>
      </section>
      <p v-if="nothing" role="status" class="px-2 py-1 text-xs text-muted">
        {{ t('documentation.noMatches') }}
      </p>
    </div>
  </AppSectionNav>
</template>
