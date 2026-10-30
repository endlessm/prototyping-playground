<script setup lang="ts">
import AppSectionNav from '../../../../app/components/AppSectionNav.vue'
import DocumentationHeader from '../../../../app/components/documentation/DocumentationHeader.vue'
import DocumentationNavItem from '../../../../app/components/documentation/DocumentationNavItem.vue'
import type { ManualChapter } from '../../../../app/composables/useGuidance'
import { documentationLink } from '../../../../app/utils/documentationLinks'

// The Manual: its chapters in their set order, under their sections, beside
// the open chapter. The navigation stays on screen while chapters change.
// There is no previous/next sequence: the Manual is a reference.
definePageMeta({ key: 'manual' })

const { t } = useI18n()
const route = useRoute()
const manual = await useManual()
const owners = await useGuidance()

const sections = computed(() => {
  const groups: { section: string | null; chapters: ManualChapter[] }[] = []
  for (const chapter of manual.value.chapters) {
    const last = groups.at(-1)
    if (last && last.section === chapter.section) last.chapters.push(chapter)
    else groups.push({ section: chapter.section, chapters: [chapter] })
  }
  return groups
})

// Links between chapters and to guidance open in the studio.
const slug = computed(() => String(route.params.slug ?? 'index'))
provideMarkdownLinks((href) =>
  documentationLink(
    owners.value,
    manual.value,
    `${manual.value.folder}/pages/${slug.value}.md`,
    href,
  ),
)

const page = useTemplateRef<HTMLElement>('page')
watch(
  () => route.path,
  () => page.value?.closest('[data-slot="body"]')?.scrollTo({ top: 0 }),
  { flush: 'post' },
)
</script>

<template>
  <AppSectionNav :label="t('documentation.title')">
    <template #header>
      <DocumentationHeader current="manual" />
    </template>
    <nav :aria-label="t('documentation.chapters')" class="space-y-4 pb-4">
      <section
        v-for="group in sections"
        :key="group.section ?? ''"
        :aria-label="group.section ?? undefined"
        class="space-y-0.5"
      >
        <h3
          v-if="group.section"
          class="flex h-7 items-center px-2 text-xs font-semibold text-muted"
        >
          {{ group.section }}
        </h3>
        <DocumentationNavItem
          v-for="chapter in group.chapters"
          :key="chapter.slug"
          :entry="{
            to: chapterHref(chapter.slug),
            path: `${manual.folder}/${chapter.file}`,
          }"
          :label="chapter.title"
        />
      </section>
      <p v-if="!manual.chapters.length" class="px-2 text-xs text-muted">
        {{ t('documentation.noChapters') }}
      </p>
    </nav>
  </AppSectionNav>
  <UDashboardPanel id="manual-page">
    <template #body>
      <div ref="page" class="contents">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
