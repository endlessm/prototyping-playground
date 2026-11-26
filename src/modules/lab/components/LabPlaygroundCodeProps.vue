<script setup lang="ts">
import type { PlaygroundControl } from '../utils/playground'

// The props no dial can set, listed under the dials with their type: only
// code can give them a value.
const props = defineProps<{ controls: PlaygroundControl[] }>()
const { t } = useI18n()
const inCode = computed(() =>
  props.controls.filter((control) => control.kind === 'code'),
)
</script>

<template>
  <section
    v-if="inCode.length"
    aria-labelledby="lab-playground-code-props"
    class="rounded-3xl border border-default px-4 py-3"
  >
    <h3
      id="lab-playground-code-props"
      class="text-xs font-semibold text-highlighted"
    >
      {{ t('lab.playground.setInCode') }}
    </h3>
    <ul class="mt-2 space-y-3">
      <li v-for="control in inCode" :key="control.name" class="min-w-0 text-sm">
        <p class="font-mono text-xs text-highlighted">
          {{ control.name }}
          <template v-if="control.required">
            <span aria-hidden="true" class="ms-0.5 text-error">*</span>
            <span class="sr-only">{{ t('lab.playground.required') }}</span>
          </template>
        </p>
        <p class="sr-only">{{ t('lab.playground.setInCode') }}</p>
        <p
          class="mt-1 truncate font-mono text-xs text-muted"
          :title="control.type"
        >
          {{ control.type }}
        </p>
        <p v-if="control.description" class="mt-1 text-xs text-muted">
          {{ control.description }}
        </p>
      </li>
    </ul>
  </section>
</template>
