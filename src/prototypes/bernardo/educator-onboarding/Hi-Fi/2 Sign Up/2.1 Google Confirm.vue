<!-- @studio-id nqthyqbzkx69gpqr -->
<!-- @studio-state z50e1wsf76vn2as2 Under 18 -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Button from '../_ui/Button.vue'
import Lead from '../_ui/Lead.vue'
import Marker from '../_ui/Marker.vue'
import SignUpDetails from '../_ui/SignUpDetails.vue'
import TermsCheck from '../_ui/TermsCheck.vue'
import Title from '../_ui/Title.vue'

// Single sign-on, new account (Google, GitHub or Microsoft): what we know is filled in; age was checked before Join,
// so the Terms of Use are the one thing left to do. Under 18, the site makes the username.
defineProps<{ minor?: boolean }>()
</script>

<script lang="ts">
export const states = [{ title: 'Under 18', props: { minor: true } }]
</script>

<template>
  <AuthPage>
    <Title :flow="2" :note="1">Is this you, {{ minor ? 'Ada' : 'Maya' }}?</Title>
    <Lead>Check your details and create your account.</Lead>
    <SignUpDetails provider="Google" :minor="minor" />
    <TermsCheck>
      <template #note><Marker :flow="2" :n="2" /></template>
    </TermsCheck>
    <Button block to="Hi-Fi/2 Sign Up/2.4 Choose a Path">Create Account</Button>
  </AuthPage>
</template>
