<!-- @studio-id hxajbnq56zgh6r1c -->
<!-- @studio-state hamegn3z0vxbvgz2 13 to 17 -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Button from '../_wire/Button.vue'
import Field from '../_wire/Field.vue'
import Input from '../_wire/Input.vue'
import Lead from '../_wire/Lead.vue'
import Marker from '../_wire/Marker.vue'
import SignUpDetails from '../_wire/SignUpDetails.vue'
import TermsCheck from '../_wire/TermsCheck.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

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
    <div :class="s.columns" style="margin-top: -8px; font-size: 11px; color: #333">
      <span v-for="rule in rules" :key="rule">✓ {{ rule }}</span>
    </div>
    <Field label="Repeat Password">
      <Input type="password" value="Threadbare#2026" />
    </Field>
    <span style="margin-top: -8px; font-size: 11px; color: #333">✓ Passwords match</span>
    <TermsCheck />
    <Button v-if="teen" block>Create Account</Button>
    <Button v-else block to="Lo-Fi/3 Create Team/3.1 After Sign-Up">Create Account</Button>
    <span :class="s.small" style="font-size: 12px">
      Rather skip the password? <TextLink to="Lo-Fi/2 Sign Up/2.1 Google Confirm">Continue with Google</TextLink>
    </span>
  </AuthPage>
</template>
