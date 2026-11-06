<!-- @studio-id nqthyqbzkx69gpqr -->
<!-- @studio-state b7n8v9npa027t96n 13 to 17 -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Button from '../_ui/Button.vue'
import Lead from '../_ui/Lead.vue'
import Logic from '../_ui/Logic.vue'
import Marker from '../_ui/Marker.vue'
import SignUpDetails from '../_ui/SignUpDetails.vue'
import TermsCheck from '../_ui/TermsCheck.vue'
import Title from '../_ui/Title.vue'

// Single sign-on, new account (Google, GitHub or Microsoft): what we know is filled in; age was checked before Join,
// so the Terms of Use are the one thing left to do.
defineProps<{ teen?: boolean }>()

const routes = [
  { label: "18 or older, Terms ticked → account and Maya's Team created → Team Dashboard", to: 'Hi-Fi/3 Create Team/3.1 After Sign-Up' },
  { label: '13 to 17 → learner account only, no Team (learner onboarding, outside this prototype)' },
  { label: 'Terms not ticked → error on the box, nothing created', to: 'Hi-Fi/2 Sign Up/2.2 Terms Not Accepted' },
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
    <Button v-else block to="Hi-Fi/3 Create Team/3.1 After Sign-Up">Create Account</Button>
    <Logic title="Checked before the account is created" :rows="routes" />
  </AuthPage>
</template>
