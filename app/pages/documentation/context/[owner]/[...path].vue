<script setup lang="ts">
import AppNotFound from '../../../../components/AppNotFound.vue'
import DocumentationPage from '../../../../components/documentation/DocumentationPage.vue'
import { guidanceHref } from '../../../../../tooling/guidance/addresses'
import { documentationLink } from '../../../../utils/documentationLinks'

// One owner's guidance at /documentation/context/<owner>/<address>: its
// README at the owner's own address (or, without one, its Context and
// Skills listed), a context document, a skill, or another contract file
// (`reference/<file>`). Documents read through the studio's Markdown reader
// with "About this context" at the end; locally they open in source mode.
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const owners = await useGuidance()
const texts = await useGuidanceTexts()
const manual = manualEnabled() ? await useManual() : undefined

const owner = computed(() =>
  owners.value.find(({ id }) => id === route.params.owner),
)
const address = computed(() => {
  const path = route.params.path
  return (Array.isArray(path) ? path.join('/') : String(path ?? '')).replace(
    /\/$/,
    '',
  )
})
const document = computed(() =>
  owner.value?.documents.find((entry) => entry.address === address.value),
)
// No README: the owner's page lists its context and skills.
const overview = computed(
  () => Boolean(owner.value) && !address.value && !document.value,
)
const listed = (kind: 'context' | 'skill') =>
  owner.value?.documents.filter((entry) => entry.kind === kind) ?? []

provideMarkdownLinks((href) =>
  document.value
    ? documentationLink(owners.value, manual?.value, document.value.file, href)
    : undefined,
)

useHead({
  title: () =>
    owner.value
      ? [
          ...(document.value && document.value.kind !== 'readme'
            ? [document.value.title]
            : []),
          owner.value.label,
          t('documentation.context'),
          studio.name,
        ].join(' — ')
      : studio.name,
})
</script>

<template>
  <AppNotFound v-if="!owner || (!document && !overview)" />
  <div v-else-if="overview" class="mx-auto w-full max-w-3xl px-8 py-12">
    <h1 class="text-3xl font-semibold tracking-tight text-highlighted">
      {{ owner.label }}
    </h1>
    <p class="mt-3 text-muted">
      {{ t(`documentation.ownerIntro.${owner.kind}`) }}
    </p>
    <section
      v-for="kind in ['context', 'skill'] as const"
      :key="kind"
      class="mt-8"
    >
      <h2 class="text-lg font-semibold text-highlighted">
        {{
          kind === 'context'
            ? t('documentation.ownerSections.context')
            : t('documentation.ownerSections.skills')
        }}
      </h2>
      <p class="mt-1 text-sm text-muted">
        {{
          kind === 'context'
            ? t('documentation.ownerSections.contextHint')
            : t('documentation.ownerSections.skillsHint')
        }}
      </p>
      <ul v-if="listed(kind).length" class="mt-3 space-y-2">
        <li v-for="entry in listed(kind)" :key="entry.address">
          <ULink
            :to="guidanceHref(owner.id, entry.address)"
            class="text-sm text-default hover:underline"
          >
            {{ entry.title }}
          </ULink>
        </li>
      </ul>
      <p v-else class="mt-3 text-sm text-muted">
        {{
          kind === 'context'
            ? t('documentation.ownerSections.noContext')
            : t('documentation.ownerSections.noSkills')
        }}
      </p>
    </section>
  </div>
  <DocumentationPage
    v-else-if="document"
    :source="texts[document.file]"
    :file="document.file"
    :page="`${owner.id}/${document.address}`"
    :title="document.kind === 'readme' ? owner.label : document.title"
    :files="document.files"
  >
    <template #footer>
      <details class="mt-12 border-t border-default pt-4 text-sm">
        <summary class="cursor-pointer text-muted">
          {{ t('documentation.about.title') }}
        </summary>
        <p class="mt-4 font-mono text-xs break-words text-muted">
          {{ document.file }}
        </p>
        <p class="mt-3 text-muted">
          {{ t('documentation.about.explanation') }}
        </p>
        <template v-if="document.related.length">
          <p class="mt-4 font-medium text-highlighted">
            {{ t('documentation.about.related') }}
          </p>
          <ul class="mt-2 space-y-1">
            <li
              v-for="link in document.related"
              :key="`${link.owner}/${link.address}`"
            >
              <ULink
                :to="guidanceHref(link.owner, link.address)"
                class="underline underline-offset-4"
              >
                {{
                  link.address
                    ? link.title
                    : owners.find(({ id }) => id === link.owner)?.label
                }}
              </ULink>
            </li>
          </ul>
        </template>
      </details>
    </template>
  </DocumentationPage>
</template>
