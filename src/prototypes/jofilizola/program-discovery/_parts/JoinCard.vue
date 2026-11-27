<script setup lang="ts">
import { computed, ref } from 'vue'
import { ORG, type Audience } from './programs'

// Proposed: every way a learner can join Core: Threadbare, in the order that fits them.
// - A learner in an organization sees their organization's groups first.
// - Anyone can apply to a scheduled live group led by Endless Access.
// - An independent learner can start the self-paced version on their own.
// - Everyone can join with a code.
// Signed out, each action asks them to sign up first. Learner-facing copy says "group", not "cohort" (Programs
// context, "Saying cohort").
const props = defineProps<{ audience: Exclude<Audience, 'educator'> }>()

interface Group {
  id: string
  name: string
  starts: string
  schedule: string
  led: string
  spots: string
  full?: boolean
}

const orgGroup: Group = {
  id: 'maple',
  name: 'Ms. Cho’s class',
  starts: 'Starts Mon 3 Feb 2027',
  schedule: 'Mondays and Wednesdays, 3:30 pm PT · 60 min',
  led: 'Led by Evelyn Cho',
  spots: '6 spots left',
}
const liveGroups: Group[] = [
  { id: 'owls', name: 'Night Owls', starts: 'Starts Tue 12 Jan 2027', schedule: 'Tuesdays, 6:00 pm ET · 90 min, online', led: 'Led by Endless Access', spots: '12 spots left' },
  { id: 'tejedores', name: 'Tejedores de Historias', starts: 'Empieza el miércoles 13 de enero de 2027', schedule: 'Miércoles, 5:00 pm hora de México · 90 min, en línea y en español', led: 'Con Endless Access', spots: '8 lugares disponibles' },
  { id: 'makers', name: 'Saturday Makers', starts: 'Starts Sat 6 Feb 2027', schedule: 'Saturdays, 10:00 am ET · 90 min, online', led: 'Led by Endless Access', spots: 'Full', full: true },
]

type Done = { kind: 'applied' | 'joined' | 'self-paced' | 'code'; name: string }
const done = ref<Done | null>(null)
const signUpOpen = ref(false)
const confirm = ref<{ kind: 'apply' | 'join'; group: Group } | null>(null)
const confirmOpen = computed({ get: () => !!confirm.value, set: (v) => { if (!v) confirm.value = null } })
const reason = ref('')
const code = ref('')
const codeError = ref('')

function act(fn: () => void) {
  if (props.audience === 'guest') signUpOpen.value = true
  else fn()
}
function finish() {
  if (!confirm.value) return
  const { kind, group } = confirm.value
  done.value = { kind: kind === 'apply' ? 'applied' : 'joined', name: group.name }
  confirm.value = null
}
function joinWithCode() {
  act(() => {
    if (!code.value.trim()) {
      codeError.value = 'Enter the code your educator gave you.'
      return
    }
    codeError.value = ''
    done.value = { kind: 'code', name: 'Ms. Cho’s class' }
  })
}
</script>

<template>
  <UCard variant="outline" class="rounded-md bg-white shadow-md shadow-stone-900/5 ring-stone-200/70" :ui="{ header: 'p-4 sm:px-5', body: 'flex flex-col gap-5 p-4 sm:p-5' }">
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Join this program</h2>
      <p class="text-sm text-muted">Learn with a group on set dates, or go at your own pace.</p>
    </template>

    <!-- After joining or applying, the outcome replaces the choices. -->
    <div v-if="done" class="flex flex-col items-start gap-3">
      <div class="flex size-10 items-center justify-center rounded-full bg-success-50 text-success-600">
        <UIcon :name="done.kind === 'applied' ? 'i-lucide-send' : 'i-lucide-check'" class="size-5" />
      </div>
      <template v-if="done.kind === 'applied'">
        <p class="text-base font-semibold text-highlighted">Application sent</p>
        <p class="text-sm text-muted">We’ll email you by Tue 5 Jan to confirm your place in {{ done.name }}. You can start the first milestone’s reading now.</p>
        <UButton class="rounded-full" color="neutral" variant="outline" label="Withdraw application" size="sm" @click="done = null" />
      </template>
      <template v-else>
        <p class="text-base font-semibold text-highlighted">
          {{ done.kind === 'self-paced' ? 'You’re in. Go at your own pace.' : `You’re in ${done.name}` }}
        </p>
        <p class="text-sm text-muted">
          {{ done.kind === 'self-paced' ? 'Start with Milestone 1: Ideation. Your progress saves as you go.' : 'Your group’s first session is on the calendar. Say hi in the group feed.' }}
        </p>
        <UButton class="rounded-full" label="Start learning" trailing-icon="i-lucide-arrow-right" />
      </template>
    </div>

    <template v-else>
      <!-- Organization's groups -->
      <section v-if="audience === 'org'" class="flex flex-col gap-2">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
          <UIcon name="i-lucide-school" class="size-4 text-primary" />From {{ ORG }}
        </h3>
        <div class="flex flex-col gap-3 rounded-md border border-stone-200 bg-stone-100 p-3">
          <div>
            <p class="text-sm font-semibold text-highlighted">{{ orgGroup.name }}</p>
            <p class="text-xs text-toned">{{ orgGroup.starts }}</p>
            <p class="text-xs text-muted">{{ orgGroup.schedule }}</p>
            <p class="text-xs text-muted">{{ orgGroup.led }} · {{ orgGroup.spots }}</p>
          </div>
          <UButton class="rounded-full" label="Join this group" block @click="confirm = { kind: 'join', group: orgGroup }" />
        </div>
      </section>

      <!-- Scheduled live groups -->
      <section class="flex flex-col gap-2">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
          <UIcon name="i-lucide-calendar-days" class="size-4 text-primary" />{{ audience === 'org' ? 'Other live groups' : 'Live groups' }}
        </h3>
        <p class="text-xs text-muted">Meet weekly online with a facilitator and other learners. Apply for a place.</p>
        <div v-for="g in liveGroups" :key="g.id" class="flex items-start justify-between gap-3 rounded-md border border-default p-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">{{ g.name }}</p>
            <p class="text-xs text-toned">{{ g.starts }}</p>
            <p class="text-xs text-muted">{{ g.schedule }}</p>
            <UBadge :color="g.full ? 'neutral' : 'success'" variant="soft" size="sm" class="mt-1.5" :label="g.spots" />
          </div>
          <UButton class="rounded-full"
            v-if="!g.full"
            :color="audience === 'org' ? 'neutral' : 'primary'"
            :variant="audience === 'org' ? 'outline' : 'solid'"
            size="sm"
            label="Apply"
            @click="act(() => (confirm = { kind: 'apply', group: g }))"
          />
          <UButton class="rounded-full" v-else color="neutral" variant="outline" size="sm" label="Join waitlist" @click="act(() => {})" />
        </div>
      </section>

      <!-- Self-paced, for independent learners (and guests, who may become one) -->
      <section v-if="audience !== 'org'" class="flex flex-col gap-2">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
          <UIcon name="i-lucide-compass" class="size-4 text-primary" />On your own
        </h3>
        <div class="flex flex-col gap-3 rounded-md border border-default p-3">
          <p class="text-xs text-muted">Start any time and go at your own pace. You’ll get the same lessons and tasks, and share your work with the community.</p>
          <UButton class="rounded-full" color="neutral" variant="outline" label="Start self-paced" icon="i-lucide-play" block @click="act(() => (done = { kind: 'self-paced', name: '' }))" />
        </div>
      </section>

      <USeparator />

      <!-- Code -->
      <section class="flex flex-col gap-2">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
          <UIcon name="i-lucide-ticket" class="size-4 text-primary" />Have a code?
        </h3>
        <UFormField :error="codeError || false" :ui="{ error: 'text-xs' }">
          <div class="flex gap-2">
            <UInput v-model="code" placeholder="e.g. QUEST-7K2P" class="flex-1" aria-label="Enrollment code" @keydown.enter="joinWithCode" />
            <UButton class="rounded-full" color="neutral" variant="outline" label="Join" @click="joinWithCode" />
          </div>
        </UFormField>
      </section>
    </template>
  </UCard>

  <!-- Confirm apply or join -->
  <UModal
    v-model:open="confirmOpen"
    :title="confirm?.kind === 'apply' ? `Apply to ${confirm?.group.name}` : `Join ${confirm?.group.name}`"
    :description="confirm ? `${confirm.group.starts} · ${confirm.group.schedule}` : ''"
  >
    <template v-if="confirm?.kind === 'apply'" #body>
      <UFormField label="What would you like to make? (optional)" help="Facilitators read this to welcome you.">
        <UTextarea v-model="reason" :rows="3" class="w-full" placeholder="A spooky quest about a lighthouse…" />
      </UFormField>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton class="rounded-full" color="neutral" variant="outline" label="Cancel" @click="confirm = null" />
        <UButton class="rounded-full" :label="confirm?.kind === 'apply' ? 'Send application' : 'Join group'" @click="finish" />
      </div>
    </template>
  </UModal>

  <!-- Signed out -->
  <UModal v-model:open="signUpOpen" title="Create a free account to join" description="You’ll come back here to pick your group once you’re signed up.">
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton class="rounded-full" color="neutral" variant="outline" label="Log in" @click="signUpOpen = false" />
        <UButton class="rounded-full" label="Sign up" @click="signUpOpen = false" />
      </div>
    </template>
  </UModal>
</template>
