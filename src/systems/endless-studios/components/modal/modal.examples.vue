<!--
  The Endless Studios modal's examples, written as screens write it: <UModal> with a trigger, #body and #footer.
  A modal covers its frame, so each example keeps room for it. Each <Example name="…"> is one example on the
  component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const enrollment = reactive({ code: '' });
const archiveOpen = ref(false);
</script>

<template>
  <Example name="Default">
    <div class="h-[26rem] w-full">
      <UModal
        title="Add your enrollment code"
        description="Use the code your mentor gave you to join their program."
        :ui="{ footer: 'justify-end' }"
      >
        <UButton icon="i-lucide-ticket">Enter a Code</UButton>
        <template #body>
          <UForm id="enrollment-form" :state="enrollment" class="flex flex-col gap-3">
            <UFormField label="Enrollment code" name="code">
              <UInput v-model="enrollment.code" placeholder="Code" class="w-full" />
            </UFormField>
          </UForm>
        </template>
        <template #footer="{ close }">
          <UButton color="neutral" variant="outline" @click="close">Cancel</UButton>
          <UButton type="submit" form="enrollment-form">Join</UButton>
        </template>
      </UModal>
    </div>
  </Example>

  <Example name="Confirmation">
    <div class="h-[18rem] w-full">
      <UButton color="error" variant="soft" icon="i-lucide-archive" @click="archiveOpen = true">Archive Cohort</UButton>
      <UModal
        v-model:open="archiveOpen"
        title="Archive this cohort?"
        description="Learners keep their projects, but nobody can join anymore."
        :close="false"
        :ui="{ footer: 'justify-end' }"
      >
        <template #footer="{ close }">
          <UButton color="neutral" variant="ghost" autofocus @click="close">Cancel</UButton>
          <UButton color="error" @click="archiveOpen = false">Archive Cohort</UButton>
        </template>
      </UModal>
    </div>
  </Example>

  <Example name="BodyOnly">
    <div class="h-[24rem] w-full">
      <UModal title="You joined Game Design Foundations" :ui="{ header: 'hidden', body: 'p-0 sm:p-0' }">
        <UButton color="neutral" variant="outline">Show Welcome</UButton>
        <template #body="{ close }">
          <div class="flex justify-end p-2 pb-0">
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Close" @click="close" />
          </div>
          <div class="flex flex-col items-center gap-3 px-8 pb-8 text-center">
            <UIcon name="i-lucide-party-popper" class="size-10 text-primary" />
            <h2 class="font-heading text-2xl font-semibold text-highlighted">You joined Game Design Foundations</h2>
            <p class="text-sm text-muted">Your first quest is ready. It takes about 20 minutes.</p>
            <UButton class="mt-2" @click="close">Start Quest</UButton>
          </div>
        </template>
      </UModal>
    </div>
  </Example>
</template>
