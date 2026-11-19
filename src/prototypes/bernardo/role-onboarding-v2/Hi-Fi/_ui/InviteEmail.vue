<script setup lang="ts">
import logo from '~/assets/images/logo-endless-navbar.svg'
import { ORG, roles, type RoleKey } from '../../_wire/world'
import Marker from './Marker.vue'
import { hifi } from './paths'
import { usePrototypeNavigate } from '#studio/prototype'

// The invite as it arrives in the person's inbox: who gave which role in which place, what the role can do, and one
// button. Every role's invite has the same shape; only the words change. The inbox chrome is a plain mail window, not
// the app.
const props = defineProps<{ role: RoleKey }>()

const navigate = usePrototypeNavigate()
const r = roles[props.role]
const where = r.level === 'Organization' ? r.entity : `${r.entity}, ${ORG}`
</script>

<template>
  <div class="flex min-h-screen items-start justify-center bg-slate-100 px-8 py-12">
    <div class="w-full max-w-3xl overflow-hidden rounded-2xl border border-default bg-default">
      <div class="flex items-center gap-2 border-b border-default bg-elevated px-5 py-3 text-xs text-muted">
        <span class="size-2.5 rounded-full bg-slate-300" />
        <span class="size-2.5 rounded-full bg-slate-300" />
        <span class="size-2.5 rounded-full bg-slate-300" />
        <span class="ms-2 font-semibold">Inbox</span>
      </div>
      <dl class="grid grid-cols-[80px_1fr] gap-x-4 gap-y-1.5 border-b border-default px-6 py-4 text-sm">
        <dt class="text-muted">From</dt>
        <dd class="text-default">{{ r.by.name }} via Endless Studios &lt;no-reply@endlessstudios.com&gt;</dd>
        <dt class="text-muted">To</dt>
        <dd class="text-default">{{ r.person.email }}</dd>
        <dt class="text-muted">Subject</dt>
        <dd class="font-semibold text-highlighted">{{ r.by.name }} added you as {{ r.label }} of {{ r.entity }}</dd>
      </dl>
      <div class="flex flex-col gap-6 px-12 py-10">
        <img :src="logo" alt="Endless Studios" class="h-8 w-fit" />
        <div class="flex items-center gap-2">
          <h1 class="text-3xl font-semibold text-highlighted">You're invited to {{ r.entity }}</h1>
          <Marker :flow="r.flow" :n="1" />
        </div>
        <p class="text-base text-default">
          {{ r.by.name }} ({{ r.byRole }}{{ r.byRole === 'Endless Admin' ? ' at Endless Access' : '' }}) added you as <b class="font-semibold text-highlighted">{{ r.label }}</b> of
          {{ where }}.
        </p>
        <UCard variant="subtle" :ui="{ body: 'flex flex-col gap-3 sm:p-5' }">
          <p class="text-sm font-semibold text-highlighted">As {{ r.label }}, you can:</p>
          <ul class="flex flex-col gap-2">
            <li v-for="item in r.can" :key="item" class="flex items-start gap-2 text-sm text-default">
              <UIcon name="i-lucide-check" class="mt-0.5 size-4 flex-none text-success" />
              {{ item }}
            </li>
          </ul>
        </UCard>
        <UButton size="lg" class="w-fit font-semibold" @click="navigate(hifi(role, 2))">Accept Invite</UButton>
        <p class="text-xs text-dimmed">This invite expires in 14 days. Didn't expect it? You can ignore this email.</p>
      </div>
    </div>
  </div>
</template>
