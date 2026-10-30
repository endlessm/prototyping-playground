<script setup lang="ts">
import AppSectionNav from '../../../../app/components/AppSectionNav.vue'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import {
  BRANCHES,
  useSystemNavState,
  type Branch,
} from '../composables/useSystemNavState'
import {
  ASSET_PAGES,
  contextAddress,
  skillAddress,
  systemAddress,
  themePages,
} from '../utils/pages'
import SystemActions from './SystemActions.vue'
import SystemNavBranch from './SystemNavBranch.vue'
import SystemNavFolder, { type NavFolder } from './SystemNavFolder.vue'
import SystemNavItem, { type SystemNavLink } from './SystemNavItem.vue'

// A system's navigation, in the section panel: its name and "…" menu, then
// Overview, Libraries, Context, Skills, Theme, Assets and Components.
// Branches start open, fold, and stay as left for the session; the one
// holding the current page opens. Search filters every entry by name and
// file path, opening what matches, and clearing it restores the branches.
const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const route = useRoute()
const manifest = await useManifest()
const state = useSystemNavState(() => props.system.id)

const folder = computed(() => props.system.folder)
const page = (id: string) => systemAddress(props.system.id, id)

const overview = computed<SystemNavLink>(() => ({
  label: t('systems.pages.overview'),
  to: page(''),
  icon: 'i-lucide-compass',
  path: `${folder.value}/system.ts`,
  source: true,
}))
const libraries = computed<SystemNavLink>(() => ({
  label: t('systems.pages.libraries'),
  to: page('libraries'),
  icon: 'i-lucide-library',
  path: `${folder.value}/system.ts`,
}))

// Context keeps its folders; documents sit in the folder they're in.
const context = computed<NavFolder>(() => {
  const root: NavFolder = {
    path: '',
    name: '',
    file: `${folder.value}/context/`,
    folders: [],
    items: [],
  }
  const folders = new Map<string, NavFolder>([['', root]])
  const parentOf = (path: string) =>
    folders.get(path.split('/').slice(0, -1).join('/')) ?? root
  for (const path of props.system.contextFolders) {
    const node: NavFolder = {
      path,
      name: path.split('/').at(-1)!,
      file: `${folder.value}/context/${path}/`,
      folders: [],
      items: [],
    }
    folders.set(path, node)
    parentOf(path).folders.push(node)
  }
  for (const document of props.system.context)
    parentOf(document.path).items.push({
      label: document.title,
      to: contextAddress(props.system, document.path),
      icon: 'i-lucide-file-text',
      path: document.file,
      source: true,
    })
  return root
})
const skills = computed<SystemNavLink[]>(() =>
  props.system.skills.map((skill) => ({
    label: skill.title,
    to: skillAddress(props.system, `${skill.name}/SKILL.md`),
    icon: 'i-lucide-wand-sparkles',
    path: skill.file,
    source: true,
  })),
)
const THEME_ICONS: Record<string, string> = {
  colors: 'i-lucide-swatch-book',
  typography: 'i-lucide-type',
  radius: 'i-lucide-square-round-corner',
  shadows: 'i-lucide-layers-2',
  spacing: 'i-lucide-ruler',
  motion: 'i-lucide-move-right',
  effects: 'i-lucide-sparkles',
  tokens: 'i-lucide-braces',
}
const theme = computed<SystemNavLink[]>(() =>
  themePages(props.system).map(({ id, group }) => ({
    label: t(`systems.pages.${group}`),
    to: page(id),
    icon: THEME_ICONS[id]!,
    path: props.system.stylesheet!,
    source: true,
  })),
)
const ASSET_ICONS = {
  fonts: 'i-lucide-type',
  icons: 'i-lucide-smile',
  images: 'i-lucide-image',
}
const assets = computed<SystemNavLink[]>(() =>
  ASSET_PAGES.map((kind) => ({
    label: t(`systems.pages.${kind}`),
    to: page(kind),
    icon: ASSET_ICONS[kind],
    path:
      kind === 'icons'
        ? `${folder.value}/system.ts`
        : `${folder.value}/assets/`,
    source: kind === 'icons',
  })),
)
const components = computed<SystemNavLink[]>(() =>
  props.system.components.map((component) => ({
    label: component.title,
    to: page(`components/${component.slug}`),
    icon: 'i-lucide-blocks',
    path: component.files[0]!,
  })),
)

// Search.
const searchOpen = ref(false)
const query = ref('')
const field = useTemplateRef<{ inputRef: HTMLInputElement }>('field')
const words = computed(() => query.value.trim().toLowerCase())
const searching = computed(() => Boolean(words.value))
const matches = (text: string | null | undefined) =>
  Boolean(text) && text!.toLowerCase().includes(words.value)
const assetPaths = (kind: string) =>
  props.system.assets
    .filter((asset) => asset.kind === kind)
    .map((asset) => asset.path)
// A branch whose name matches shows all of it.
const branchMatches = (branch: Branch) => matches(t(`systems.pages.${branch}`))
const showsIn =
  (branch: Branch | null) =>
  (item: SystemNavLink): boolean =>
    !searching.value ||
    (branch !== null && branchMatches(branch)) ||
    matches(item.label) ||
    matches(item.path) ||
    (branch === 'assets' &&
      assetPaths(item.to.split('/').at(-1)!).some(matches))
const librariesMatch = computed(
  () =>
    !searching.value ||
    matches(libraries.value.label) ||
    props.system.libraries.some(
      (library) => matches(library.label) || matches(library.description),
    ),
)
const allDocuments = (node: NavFolder): SystemNavLink[] => [
  ...node.items,
  ...node.folders.flatMap(allDocuments),
]
const entries = computed(() => ({
  context: allDocuments(context.value),
  skills: skills.value,
  theme: theme.value,
  assets: assets.value,
  components: components.value,
}))
// While searching, a branch shows if anything in it matches.
const branchShows = (branch: Branch) =>
  !searching.value ||
  branchMatches(branch) ||
  entries.value[branch].some(showsIn(branch))
const nothing = computed(
  () =>
    searching.value &&
    !showsIn(null)(overview.value) &&
    !librariesMatch.value &&
    !BRANCHES.some(branchShows),
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

// Expand or collapse every branch and folder.
const allOpen = computed(
  () =>
    BRANCHES.every((branch) => state.value.branches[branch]) &&
    props.system.contextFolders.every(
      (path) => state.value.folders[path] !== false,
    ),
)
function toggleAll() {
  const open = !allOpen.value
  for (const branch of BRANCHES) state.value.branches[branch] = open
  for (const path of props.system.contextFolders)
    state.value.folders[path] = open
}
const branchOpen = (branch: Branch) =>
  searching.value || state.value.branches[branch]
const setBranch = (branch: Branch, open: boolean) => {
  if (!searching.value) state.value.branches[branch] = open
}

// The branch holding the current page opens, with its folders.
watch(
  () => route.path,
  (path) => {
    const inside = path.slice(page('').length + 1)
    const [first, ...rest] = inside.split('/')
    let branch: Branch | undefined
    if (first === 'context' || first === 'skills') branch = first
    else if (first === 'components') branch = 'components'
    else if ((ASSET_PAGES as readonly string[]).includes(first!))
      branch = 'assets'
    else if (theme.value.some(({ to }) => to === path)) branch = 'theme'
    if (!branch) return
    state.value.branches[branch] = true
    if (branch === 'context')
      for (let depth = 1; depth < rest.length; depth++)
        state.value.folders[rest.slice(0, depth).join('/')] = true
  },
  { immediate: true },
)
</script>

<template>
  <AppSectionNav :label="system.label">
    <template #header>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <div class="flex min-w-0 items-center justify-between gap-2">
          <p class="truncate text-sm font-semibold text-highlighted">
            {{ system.label }}
          </p>
          <SystemActions :system="system" />
        </div>
        <p
          v-if="system.id === manifest.defaultSystem"
          class="text-xs text-muted"
        >
          {{ t('systems.defaultSystem') }}
        </p>
      </div>
    </template>
    <div class="px-1 pt-1">
      <div class="flex h-7 items-center justify-between pl-1">
        <p class="text-xs font-semibold text-highlighted">
          {{ t('systems.nav.resources') }}
        </p>
        <div class="flex items-center gap-0.5">
          <UTooltip :text="t('systems.nav.search')">
            <UButton
              icon="i-lucide-search"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="t('systems.nav.search')"
              :aria-pressed="searchOpen"
              @click="toggleSearch"
            />
          </UTooltip>
          <UTooltip
            :text="
              allOpen
                ? t('systems.nav.collapseAll')
                : t('systems.nav.expandAll')
            "
          >
            <UButton
              :icon="
                allOpen
                  ? 'i-lucide-chevrons-down-up'
                  : 'i-lucide-chevrons-up-down'
              "
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="searching"
              :aria-label="
                allOpen
                  ? t('systems.nav.collapseAll')
                  : t('systems.nav.expandAll')
              "
              @click="toggleAll"
            />
          </UTooltip>
        </div>
      </div>
      <UInput
        v-if="searchOpen"
        ref="field"
        v-model="query"
        type="search"
        size="sm"
        class="mt-1 w-full"
        :placeholder="t('systems.nav.searchField')"
        :aria-label="t('systems.nav.searchField')"
        @keydown.esc="onEscape"
      >
        <template v-if="query" #trailing>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="link"
            size="xs"
            :aria-label="t('systems.nav.clear')"
            @click="clear"
          />
        </template>
      </UInput>
    </div>
    <div class="space-y-0.5 pb-4">
      <div v-if="showsIn(null)(overview)" data-nav-entry="Overview">
        <SystemNavItem :item="overview" />
      </div>
      <div v-if="librariesMatch" data-nav-entry="Libraries">
        <SystemNavItem :item="libraries" />
      </div>
      <div v-if="branchShows('context')" data-nav-entry="Context">
        <SystemNavBranch
          :label="t('systems.pages.context')"
          :path="`${system.folder}/context/`"
          :to="page('context')"
          icon="i-lucide-notebook-text"
          :open="branchOpen('context')"
          @update:open="(open) => setBranch('context', open)"
        >
          <SystemNavFolder
            v-model:folders="state.folders"
            :folder="context"
            :shows="showsIn('context')"
            :searching="searching"
          />
          <p
            v-if="!system.context.length && !system.contextFolders.length"
            class="px-2 py-1 text-xs text-muted"
          >
            {{ t('systems.nav.emptyFolder') }}
          </p>
        </SystemNavBranch>
      </div>
      <div v-if="branchShows('skills')" data-nav-entry="Skills">
        <SystemNavBranch
          :label="t('systems.pages.skills')"
          :path="`${system.folder}/skills/`"
          :to="page('skills')"
          icon="i-lucide-wand-sparkles"
          :open="branchOpen('skills')"
          @update:open="(open) => setBranch('skills', open)"
        >
          <template v-for="item in skills" :key="item.to">
            <SystemNavItem v-if="showsIn('skills')(item)" :item="item" />
          </template>
          <p v-if="!skills.length" class="px-2 py-1 text-xs text-muted">
            {{ t('systems.nav.emptyFolder') }}
          </p>
        </SystemNavBranch>
      </div>
      <div v-if="branchShows('theme')" data-nav-entry="Theme">
        <SystemNavBranch
          :label="t('systems.pages.theme')"
          :path="system.stylesheet ?? `${system.folder}/system.ts`"
          :open="branchOpen('theme')"
          @update:open="(open) => setBranch('theme', open)"
        >
          <template v-for="item in theme" :key="item.to">
            <SystemNavItem v-if="showsIn('theme')(item)" :item="item" />
          </template>
          <p v-if="!theme.length" class="px-2 py-1 text-xs text-muted">
            {{ t('systems.nav.noTokens') }}
          </p>
        </SystemNavBranch>
      </div>
      <div v-if="branchShows('assets')" data-nav-entry="Assets">
        <SystemNavBranch
          :label="t('systems.pages.assets')"
          :path="`${system.folder}/assets/`"
          :open="branchOpen('assets')"
          @update:open="(open) => setBranch('assets', open)"
        >
          <template v-for="item in assets" :key="item.to">
            <SystemNavItem v-if="showsIn('assets')(item)" :item="item" />
          </template>
        </SystemNavBranch>
      </div>
      <div v-if="branchShows('components')" data-nav-entry="Components">
        <SystemNavBranch
          :label="t('systems.pages.components')"
          :path="`${system.folder}/components/`"
          :open="branchOpen('components')"
          @update:open="(open) => setBranch('components', open)"
        >
          <template v-for="item in components" :key="item.to">
            <SystemNavItem v-if="showsIn('components')(item)" :item="item" />
          </template>
          <p v-if="!components.length" class="px-2 py-1 text-xs text-muted">
            {{ t('systems.nav.emptyFolder') }}
          </p>
        </SystemNavBranch>
      </div>
      <p v-if="nothing" role="status" class="px-2 py-1 text-xs text-muted">
        {{ t('systems.nav.noMatches') }}
      </p>
    </div>
  </AppSectionNav>
</template>
