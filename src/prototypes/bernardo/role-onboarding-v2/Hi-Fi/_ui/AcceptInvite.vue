<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'
import { roles, type RoleKey } from '../../_wire/world'
import AuthPage from './AuthPage.vue'
import BrandIcon from './BrandIcon.vue'
import Logic from './Logic.vue'
import Marker from './Marker.vue'
import { hifi } from './paths'

// Where the invite's button lands. The invite's card sits on top in every mode; below it, someone signed out gets the
// same one door as Join (the invited email filled in), someone signed in accepts with one button, and an expired
// invite says who can send a new one.
const props = withDefaults(defineProps<{ role: RoleKey; mode?: 'signedOut' | 'signedIn' | 'expired' }>(), {
  mode: 'signedOut',
})

const navigate = usePrototypeNavigate()
const r = roles[props.role]
const welcome = hifi(props.role, 3)
</script>

<template>
  <AuthPage>
    <UCard variant="subtle" :ui="{ body: 'flex items-center gap-4 sm:p-5' }">
      <UAvatar :text="r.by.initials" size="lg" :alt="r.by.name" class="bg-secondary-50 text-secondary-700" />
      <div class="flex min-w-0 flex-col gap-0.5">
        <span class="text-xs text-muted">{{ r.by.name }} invited you to</span>
        <span class="flex items-center gap-2 text-lg font-bold text-secondary">
          {{ r.label }}
          <Marker :flow="r.flow" :n="2" />
        </span>
        <span class="truncate text-sm font-semibold text-highlighted">{{ r.entity }}</span>
      </div>
    </UCard>

    <template v-if="mode === 'signedOut'">
      <h1 class="text-3xl font-semibold text-highlighted">Accept your invite</h1>
      <UFormField label="Email" name="email">
        <UInput :default-value="r.person.email" type="email" size="lg" class="w-full" />
      </UFormField>
      <UButton block size="lg" class="font-semibold" @click="navigate(welcome)">Continue</UButton>
      <USeparator label="or continue with" :ui="{ label: 'text-xs text-dimmed' }" />
      <div class="grid grid-cols-3 gap-3">
        <UButton color="neutral" variant="outline" size="lg" class="justify-center" @click="navigate(welcome)">
          <BrandIcon brand="google" />Google
        </UButton>
        <UButton color="neutral" variant="outline" size="lg" class="justify-center" @click="navigate(welcome)">
          <BrandIcon brand="microsoft" />Microsoft
        </UButton>
        <UButton color="neutral" variant="outline" size="lg" class="justify-center" @click="navigate(welcome)">
          <BrandIcon brand="github" />GitHub
        </UButton>
      </div>
      <Logic
        title="After Continue"
        :rows="[
          { label: 'Has an account → password on this page, then the Welcome', to: welcome },
          { label: 'New → Verify Age and Sign Up (Educator Onboarding), then the Welcome', to: welcome },
        ]"
      />
    </template>

    <template v-else-if="mode === 'signedIn'">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-semibold text-highlighted">Accept your invite</h1>
        <p class="text-base text-muted">You're signed in as {{ r.person.name }} ({{ r.person.email }}).</p>
      </div>
      <div class="flex flex-col gap-3">
        <UButton block size="lg" class="font-semibold" @click="navigate(welcome)">Accept as {{ r.label }}</UButton>
        <UButton block size="lg" color="neutral" variant="outline">Decline</UButton>
      </div>
      <p class="text-sm text-muted">
        Not you?
        <UButton variant="link" color="secondary" class="p-0 font-semibold">Switch Account</UButton>
      </p>
    </template>

    <template v-else>
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-clock-alert"
        title="This invite has expired"
        :description="`Invites work for 14 days. Ask ${r.by.name} to send a new one.`"
      />
      <UButton block size="lg" class="font-semibold">Ask for a New Invite</UButton>
    </template>
  </AuthPage>
</template>
