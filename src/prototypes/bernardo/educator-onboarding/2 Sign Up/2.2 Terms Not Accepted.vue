<!-- @studio-id 9vf749hn726gp2j4 -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Button from '../_wire/Button.vue'
import Lead from '../_wire/Lead.vue'
import Marker from '../_wire/Marker.vue'
import SignUpDetails from '../_wire/SignUpDetails.vue'
import TermsCheck from '../_wire/TermsCheck.vue'
import Title from '../_wire/Title.vue'

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
    <Button block to="3 Create Team/3.1 After Sign-Up">Create Account</Button>
  </AuthPage>
</template>
