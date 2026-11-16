<!-- @lofi -->
<!-- @studio-id whqzegzw7xmgr6p2 -->
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
const routes = [
  { label: 'Terms ticked → account created → Choose a Path', to: 'Lo-Fi/2 Sign Up/2.4 Choose a Path' },
  { label: 'Terms not ticked → error on the box, nothing created', to: 'Lo-Fi/2 Sign Up/2.2 Terms Not Accepted' },
]
</script>

<template>
  <AuthPage>
    <Title :flow="2" :note="1">Is this you, Maya?</Title>
    <Lead>Check your details and create your account.</Lead>
    <SignUpDetails provider="Google" />
    <TermsCheck>
      <template #note><Marker :flow="2" :n="2" /></template>
    </TermsCheck>
    <Button block to="Lo-Fi/2 Sign Up/2.4 Choose a Path">Create Account</Button>
    <Logic title="Checked before the account is created" :rows="routes" />
  </AuthPage>
</template>
