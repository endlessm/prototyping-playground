<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import DocumentationPage from '../../../../app/components/documentation/DocumentationPage.vue'

// A Manual chapter at /documentation/manual/<slug> (the index chapter at
// /documentation/manual), read, or edited in source mode. Locally a chapter
// the Manual skipped for broken metadata still opens in source mode, so it
// can be fixed.
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const manual = await useManual()

const slug = computed(() => String(route.params.slug ?? 'index'))
const chapter = computed(() =>
  manual.value.chapters.find((entry) => entry.slug === slug.value),
)
const file = computed(() => {
  const name = chapter.value?.file ?? `pages/${slug.value}.md`
  return manual.value.files.includes(name) || chapter.value
    ? `${manual.value.folder}/${name}`
    : undefined
})
const source = computed(() =>
  import.meta.dev && route.query.mode === 'source'
    ? file.value
    : chapter.value && file.value,
)

useHead({
  title: () =>
    chapter.value
      ? [chapter.value.title, t('documentation.manual'), studio.name].join(
          ' — ',
        )
      : studio.name,
})
</script>

<template>
  <AppNotFound v-if="!source" />
  <DocumentationPage
    v-else
    :source="manual.texts[slug]"
    :file="source"
    :page="`manual/${slug}`"
    :title="chapter?.title"
  />
</template>
