<script setup lang="ts">
import { ref } from 'vue'
import Tb from './Tb.vue'
import { ORG } from './programs'

// Proposed: what an educator sees in place of joining. Whether they may run the program (through their
// Organization's access, Educator roles context, "Programs"), their cohorts of it, how to start one, and the
// training that prepares them. Educator screens say "cohort", as the leader screens do today.
const createOpen = ref(false)
const created = ref<string | null>(null)
const form = ref({ name: 'Maple Ridge — Spring 2027', pace: 'scheduled', start: '2027-02-03', language: 'English' })
const paceItems = [
  { label: 'Scheduled', value: 'scheduled', description: 'Set dates, weekly sessions you lead' },
  { label: 'Self-paced', value: 'selfpaced', description: 'Learners work through it on their own' },
]

function create() {
  created.value = form.value.name
  createOpen.value = false
}
</script>

<template>
  <UCard variant="outline" class="rounded-md bg-white shadow-md shadow-stone-900/5 ring-stone-200/70" :ui="{ header: 'p-4 sm:px-5', body: 'flex flex-col gap-5 p-4 sm:p-5' }">
    <template #header>
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-highlighted">Teach this program</h2>
          <p class="text-sm text-muted">Run it with your learners at {{ ORG }}.</p>
        </div>
        <UBadge color="success" variant="soft" icon="i-lucide-check" label="You can run this" class="flex-none" />
      </div>
    </template>

    <section class="flex flex-col gap-2">
      <h3 class="text-sm font-semibold text-highlighted">Your cohorts</h3>
      <div class="flex items-center gap-3 rounded-md border border-default p-3">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-highlighted">Ms. Cho’s class</p>
          <p class="text-xs text-muted">Starts 3 Feb 2027 · 24 of 30 learners</p>
        </div>
        <UBadge color="neutral" variant="soft" size="sm" label="Upcoming" />
      </div>
      <div v-if="created" class="flex items-center gap-3 rounded-md border border-success-200 bg-success-50/60 p-3">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-highlighted">{{ created }}</p>
          <p class="text-xs text-muted">Invite code <span class="font-mono font-semibold text-toned">QUEST-7K2P</span></p>
        </div>
        <UButton class="rounded-full" color="neutral" variant="ghost" size="sm" icon="i-lucide-copy" aria-label="Copy invite link" />
      </div>
      <UButton label="Start a cohort" icon="i-lucide-plus" block class="rounded-full mt-1" @click="createOpen = true" />
    </section>

    <USeparator />

    <section class="flex flex-col gap-2">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
        <UIcon name="i-lucide-graduation-cap" class="size-4 text-primary" />Get ready to teach
      </h3>
      <div class="flex flex-col gap-2 rounded-md bg-elevated p-3">
        <p class="text-sm font-semibold text-highlighted">Endless Access Facilitators</p>
        <p class="text-xs text-muted">Training to run Core: <em>Threadbare</em></p>
        <UProgress :model-value="2" :max="4" size="sm" />
        <p class="text-xs text-muted">2 of 4 steps to become a certified facilitator</p>
        <p class="text-xs text-muted">Earn the ASU Intro to Game Making with Godot – Facilitator microcredential.</p>
        <UButton color="neutral" variant="outline" size="sm" label="Continue training" class="rounded-full self-start" />
      </div>
      <ul class="flex flex-col gap-1 text-sm">
        <li><ULink class="flex items-center gap-2 text-primary"><UIcon name="i-lucide-book-open" class="size-4" />Facilitator playbook (18 sessions)</ULink></li>
        <li><ULink class="flex items-center gap-2 text-primary"><UIcon name="i-lucide-list-checks" class="size-4" />Cohort setup guide</ULink></li>
        <li><ULink class="flex items-center gap-2 text-primary"><UIcon name="i-lucide-eye" class="size-4" />Preview as a learner</ULink></li>
      </ul>
    </section>
  </UCard>

  <UModal v-model:open="createOpen" description="You can change these later. Learners join with the code you get next.">
    <template #title><Tb text="Start a cohort of Core: Threadbare" /></template>
    <template #body>
      <UForm :state="form" class="flex flex-col gap-4" @submit="create">
        <UFormField label="Name" name="name" help="Learners see this as their group’s name.">
          <UInput v-model="form.name" class="w-full" />
        </UFormField>
        <UFormField label="Pace" name="pace">
          <URadioGroup v-model="form.pace" :items="paceItems" />
        </UFormField>
        <UFormField v-if="form.pace === 'scheduled'" label="First session" name="start">
          <UInput v-model="form.start" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Language" name="language">
          <USelect v-model="form.language" :items="['English', 'Español']" class="w-full" />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton class="rounded-full" color="neutral" variant="outline" label="Cancel" @click="createOpen = false" />
        <UButton class="rounded-full" label="Create cohort" @click="create" />
      </div>
    </template>
  </UModal>
</template>
