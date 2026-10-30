<script setup lang="ts">
import SourceEditor from '../../../../app/components/source/SourceEditor.vue'
import type { SourceAccess } from '../../../../app/components/source/sourceAccess'
import { shortcutLabel } from '../../../../app/utils/shortcuts'
import { requestJson } from '../../../../app/utils/studioRequest'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'

// One of a system's source files, read and saved through the dev server's
// file service, which decides whether you may save it (an Admin or the
// system's maintainer, while it is active). Done returns to the page.
const props = defineProps<{
  system: SystemCatalog
  /** Inside the system's folder. */
  path: string
}>()
const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()

const editor = useTemplateRef<{ mayLeave: () => Promise<boolean> }>('editor')
defineExpose({ mayLeave: async () => (await editor.value?.mayLeave()) ?? true })

const url = `${useRuntimeConfig().app.baseURL}_studio/files/system-source`
const access: SourceAccess = {
  read: () =>
    requestJson(
      `${url}?${new URLSearchParams({ system: props.system.id, path: props.path })}`,
    ),
  write: (content, base) =>
    requestJson(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: props.system.id,
        path: props.path,
        content,
        base,
      }),
    }),
}
</script>

<template>
  <SourceEditor
    ref="editor"
    :access="access"
    :path="`${system.folder}/${path}`"
  >
    <template #actions>
      <slot name="actions" />
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
