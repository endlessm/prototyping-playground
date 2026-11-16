<script setup lang="ts">
import { stemOf } from '../../../../tooling/systems/components'
import LabVariantCard from '../components/LabVariantCard.vue'
import { useLabComponent } from '../composables/useLabComponent'

// Variants: every example of the component's examples file side by side,
// two columns when the bench is wide and one when it's narrow, each with
// its own code. A component without examples says which file to add, as
// its Systems page does.
const { system, component, data } = useLabComponent()

const stem = computed(() =>
  stemOf(component.value.source ?? component.value.name),
)
</script>

<template>
  <i18n-t
    v-if="!component.examplesFile"
    keypath="systems.component.noExamples"
    tag="p"
    class="text-sm text-muted"
    scope="global"
  >
    <template #file>
      <code class="font-mono">{{ stem }}.examples.vue</code>
    </template>
    <template #example>
      <code class="font-mono">&lt;Example name="…"&gt;</code>
    </template>
  </i18n-t>
  <div v-else class="@container">
    <div class="grid grid-cols-1 gap-5 @3xl:grid-cols-2">
      <LabVariantCard
        v-for="example in component.examples"
        :key="example.id"
        :system-id="system.id"
        :example="example"
        :code="data?.snippets?.[example.name]"
        :file="component.examplesFile"
      />
    </div>
  </div>
</template>
