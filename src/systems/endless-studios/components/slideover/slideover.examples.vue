<!--
  The Endless Studios slideover's examples, written as screens write it: <USlideover> with a trigger, #body and
  #footer. A slideover covers its frame, so each example keeps room for it. Each <Example name="…"> is one example
  on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const cohort = reactive({ name: 'Spring 2027', institution: 1, timezone: 'America/Sao_Paulo' });
const institutions = [
  { label: 'Lincoln Middle School', value: 1 },
  { label: 'Riverside Library', value: 2 },
];
const saving = ref(false);

async function save() {
  saving.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  saving.value = false;
}
</script>

<template>
  <Example name="Default">
    <div class="h-[32rem] w-full">
      <USlideover title="Edit cohort" description="Game Design Foundations">
        <UButton color="neutral" variant="outline" icon="i-lucide-pencil">Edit Cohort</UButton>
        <template #body>
          <UForm id="cohort-form" :state="cohort" class="flex flex-col gap-4">
            <UFormField label="Cohort name" name="name" required>
              <UInput v-model="cohort.name" class="w-full" />
            </UFormField>
            <UFormField label="Institution" name="institution">
              <USelect v-model="cohort.institution" :items="institutions" class="w-full" />
            </UFormField>
            <UFormField label="Time zone" name="timezone" required>
              <USelectMenu v-model="cohort.timezone" :items="['America/Sao_Paulo', 'America/New_York', 'Europe/Lisbon']" class="w-full" />
            </UFormField>
          </UForm>
        </template>
        <template #footer="{ close }">
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="outline" @click="close">Cancel</UButton>
            <UButton type="submit" form="cohort-form">Save Changes</UButton>
          </div>
        </template>
      </USlideover>
    </div>
  </Example>

  <Example name="WhileSaving">
    <div class="h-[32rem] w-full">
      <USlideover title="Edit quiz" description="Draft" :dismissible="!saving" :close="!saving" :ui="{ content: 'max-w-4xl' }">
        <UButton color="neutral" variant="outline" icon="i-lucide-list-checks">Edit Quiz</UButton>
        <template #body>
          <div class="flex flex-col gap-4">
            <UFormField label="Question 1">
              <UTextarea model-value="Which of these is a game mechanic?" class="w-full" :disabled="saving" />
            </UFormField>
            <USwitch :model-value="true" label="Shuffle questions" :disabled="saving" />
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end">
            <UButton :loading="saving" @click="save">Save Quiz</UButton>
          </div>
        </template>
      </USlideover>
    </div>
  </Example>
</template>
