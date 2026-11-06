<!-- @studio-id py0res5nbq1jspys -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Button from '../_ui/Button.vue'
import Lead from '../_ui/Lead.vue'
import Marker from '../_ui/Marker.vue'
import SignUpDetails from '../_ui/SignUpDetails.vue'
import TermsCheck from '../_ui/TermsCheck.vue'
import Title from '../_ui/Title.vue'

// Create Account with the Terms box left empty: the box says what's missing; the rest of the page keeps what was typed.
</script>

<template>
  <AuthPage>
    <Title>Is this you, Maya?</Title>
    <Lead>Check your details and create your account.</Lead>
    <SignUpDetails provider="Google" />
    <TermsCheck error="Tick the box to agree to the Terms of Use and create your account.">
      <template #note><Marker :flow="2" :n="3" /></template>
    </TermsCheck>
    <Button block to="Hi-Fi/3 Create Team/3.1 After Sign-Up">Create Account</Button>
  </AuthPage>
</template>
