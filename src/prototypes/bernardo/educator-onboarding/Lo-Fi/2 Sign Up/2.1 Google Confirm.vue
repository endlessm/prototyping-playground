<!-- @lofi -->
<!-- @studio-id whqzegzw7xmgr6p2 -->
<!-- @studio-state 0dnq9hqgtpv35fbx 13 to 17 -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Button from '../_wire/Button.vue'
import Lead from '../_wire/Lead.vue'
import Logic from '../_wire/Logic.vue'
import Marker from '../_wire/Marker.vue'
import SignUpDetails from '../_wire/SignUpDetails.vue'
import TermsCheck from '../_wire/TermsCheck.vue'
import Title from '../_wire/Title.vue'

// Single sign-on, new account (Google, GitHub or Microsoft): what we know is filled in; age was checked before Join,
// so the Terms of Use are the one thing left to do.
defineProps<{ teen?: boolean }>()

const routes = [
  { label: "18 or older, Terms ticked → account and Maya's Team created → Team Dashboard", to: 'Lo-Fi/3 Create Team/3.1 After Sign-Up' },
  { label: '13 to 17 → learner account only, no Team (learner onboarding, outside this prototype)' },
  { label: 'Terms not ticked → error on the box, nothing created', to: 'Lo-Fi/2 Sign Up/2.2 Terms Not Accepted' },
]
</script>

<script lang="ts">
export const states = [{ title: '13 to 17', props: { teen: true } }]
</script>

<template>
  <AuthPage>
    <Title :flow="2" :note="1">Is this you, Maya?</Title>
    <Lead>Check your details and create your account.</Lead>
    <SignUpDetails provider="Google" :teen="teen">
      <template #teenNote><Marker :flow="2" :n="6" /></template>
    </SignUpDetails>
    <TermsCheck>
      <template #note><Marker :flow="2" :n="2" /></template>
    </TermsCheck>
    <Button v-if="teen" block>Create Account</Button>
    <Button v-else block to="Lo-Fi/3 Create Team/3.1 After Sign-Up">Create Account</Button>
    <Logic title="Checked before the account is created" :rows="routes" />
  </AuthPage>
</template>
