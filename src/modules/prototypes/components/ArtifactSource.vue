<script setup lang="ts">
import SourceEditor from '../../../../app/components/source/SourceEditor.vue'
import type { SourceAccess } from '../../../../app/components/source/sourceAccess'
import type { ManifestPrototype } from '../../../../app/composables/useManifest'
import { shortcutLabel } from '../../../../app/utils/shortcuts'
import { requestJson } from '../../../../app/utils/studioRequest'
import type { OpenArtifact } from '../composables/usePrototype'

// An artifact's source, read and saved through the dev server's file
// service, which also decides whether you may save it. Done returns to the
// rendered page. A named state's source is its view's file.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: OpenArtifact
}>()
const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()

const url = `${useRuntimeConfig().app.baseURL}_studio/files/source`
const file = () => props.artifact.state?.view ?? props.artifact.id
const access: SourceAccess = {
  read: () =>
    requestJson(
      `${url}?${new URLSearchParams({
        prototype: props.prototype.id,
        artifact: file(),
      })}`,
    ),
  write: (content, base) =>
    requestJson(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prototype: props.prototype.id,
        artifact: file(),
        content,
        base,
      }),
    }),
}
</script>

<template>
  <SourceEditor :access="access" :path="artifact.file">
    <template #actions>
      <UTooltip
        :text="t('source.doneHint', { shortcut: shortcutLabel('source') })"
      >
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          :label="t('source.done')"
          @click="emit('done')"
        />
      </UTooltip>
    </template>
  </SourceEditor>
</template>
