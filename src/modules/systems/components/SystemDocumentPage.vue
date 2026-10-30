<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import { useSystemDocuments } from '../composables/useSystemCatalog'
import { documentFile, sourceFile } from '../utils/pages'
import SystemDocument from './SystemDocument.vue'
import SystemPage from './SystemPage.vue'

// A Context or Skills document at its address (the path without `.md`):
// read in the studio's style, or, locally, edited in source mode. A skill's
// source also offers its supporting files.

// The editor exists only in the studio running locally, so the deployed
// site never loads it.
const SkillSource = import.meta.dev
  ? defineAsyncComponent(() => import('./SkillSource.vue'))
  : undefined

const props = defineProps<{
  system: SystemCatalog
  section: 'context' | 'skills'
}>()
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const documents = await useSystemDocuments()

const address = computed(() => String(route.params.path ?? ''))
const file = computed(() =>
  documentFile(props.system, props.section, address.value),
)
const source = computed(() =>
  file.value ? documents.value[file.value] : undefined,
)
const skill = computed(() =>
  props.section === 'skills'
    ? props.system.skills.find(
        ({ name }) => name === address.value.split('/')[0],
      )
    : undefined,
)
const title = computed(() => {
  const listed = props.system.context.find(
    (document) => document.file === file.value,
  )?.title
  if (listed) return listed
  const heading = /^#\s+(.+?)\s*#*\s*$/m.exec(source.value ?? '')?.[1]
  return heading ?? address.value.split('/').at(-1) ?? ''
})

useHead({
  title: () =>
    [
      title.value,
      t(`systems.pages.${props.section}`),
      props.system.label,
      t('systems.title'),
      studio.name,
    ].join(' — '),
})
</script>

<template>
  <AppNotFound v-if="!file || source === undefined" />
  <SystemPage
    v-else
    :key="file"
    :system="system"
    :source="sourceFile(system, `${section}/${address}`)"
  >
    <SystemDocument
      :system="system"
      :file="file"
      :source="source"
      :title="title"
    />
    <template v-if="skill && SkillSource" #source="{ done }">
      <SkillSource
        :system="system"
        :skill="skill"
        :file="file.slice(`${system.folder}/skills/${skill.name}/`.length)"
        @done="done"
      />
    </template>
  </SystemPage>
</template>
