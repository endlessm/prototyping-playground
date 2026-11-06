<!-- @studio-id 551zy9aa6dfxynp4 -->
<!-- @studio-state 042n7r69vvc8gc9r 13 to 17 -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Button from '../_ui/Button.vue'
import Field from '../_ui/Field.vue'
import Input from '../_ui/Input.vue'
import Lead from '../_ui/Lead.vue'
import Marker from '../_ui/Marker.vue'
import SignUpDetails from '../_ui/SignUpDetails.vue'
import TermsCheck from '../_ui/TermsCheck.vue'
import TextLink from '../_ui/TextLink.vue'
import Title from '../_ui/Title.vue'
import s from '../_ui/ui.module.css'

const rules = ['At least 1 upper case character', 'At least 8 characters', 'At least 1 symbol', 'At least 1 number']

// Email sign-up: the single sign-on page with the email left open, plus a password.
defineProps<{ teen?: boolean }>()
</script>

<script lang="ts">
export const states = [{ title: '13 to 17', props: { teen: true } }]
</script>

<template>
  <AuthPage>
    <Title :flow="2" :note="4">Create your account</Title>
    <Lead>Check your details and create your account.</Lead>
    <SignUpDetails :teen="teen">
      <template #teenNote><Marker :flow="2" :n="6" /></template>
    </SignUpDetails>
    <Field label="Password">
      <Input type="password" value="Threadbare#2026" />
    </Field>
    <div :class="s.columns" style="margin-top: -8px; color: var(--es-text)">
      <span v-for="rule in rules" :key="rule">✓ {{ rule }}</span>
    </div>
    <Field label="Repeat Password">
      <Input type="password" value="Threadbare#2026" />
    </Field>
    <span style="margin-top: -8px; color: var(--es-text)">✓ Passwords match</span>
    <TermsCheck />
    <Button v-if="teen" block>Create Account</Button>
    <Button v-else block to="Hi-Fi/3 Create Team/3.1 After Sign-Up">Create Account</Button>
    <span :class="s.small">
      Rather skip the password? <TextLink to="Hi-Fi/2 Sign Up/2.1 Google Confirm">Continue with Google</TextLink>
    </span>
  </AuthPage>
</template>
