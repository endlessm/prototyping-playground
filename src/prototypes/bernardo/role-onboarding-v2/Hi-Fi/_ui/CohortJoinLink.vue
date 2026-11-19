<script setup lang="ts">
import { ref } from 'vue'
import { cohort } from '../../_wire/world'
import Marker from './Marker.vue'

// Add Learners: the Cohort's one join link for the whole class, with Copy Link, its code and expiry on one small line,
// and Upload CSV for a class list. Done goes on to the flow's next screen, or closes when there is none.
defineProps<{ flow?: number; note?: number }>()
const emit = defineEmits<{ done: []; close: [] }>()

const open = ref(true)
const copied = ref(false)
const link = `endlessstudios.com/join?code=${cohort.code}`

function close(value: boolean) {
  open.value = value
  if (!value) emit('close')
}
</script>

<template>
  <UModal :open="open" title="Add Learners" :ui="{ content: 'max-w-lg' }" @update:open="close">
    <template #body>
      <UFormField name="link">
        <template #label>
          <span class="flex items-center gap-2">
            Join link
            <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" />
          </span>
        </template>
        <div class="flex gap-2">
          <UInput :model-value="link" readonly size="lg" icon="i-lucide-link" class="flex-1" />
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            class="shrink-0 whitespace-nowrap"
            @click="copied = true"
          >
            {{ copied ? 'Copied' : 'Copy Link' }}
          </UButton>
        </div>
        <p class="mt-2 text-xs text-muted">Code {{ cohort.code }} · Expires {{ cohort.linkExpires }}</p>
      </UFormField>
    </template>
    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton color="neutral" variant="ghost" icon="i-lucide-upload" class="-ms-2.5">Upload CSV</UButton>
        <UButton @click="emit('done')">Done</UButton>
      </div>
    </template>
  </UModal>
</template>
