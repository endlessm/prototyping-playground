<!-- @studio-id hxajbnq56zgh6r1c -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Button from '../_wire/Button.vue'
import Field from '../_wire/Field.vue'
import Input from '../_wire/Input.vue'
import Lead from '../_wire/Lead.vue'
import SignUpDetails from '../_wire/SignUpDetails.vue'
import TermsCheck from '../_wire/TermsCheck.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

const rules = ['At least 1 upper case character', 'At least 8 characters', 'At least 1 symbol', 'At least 1 number']

// Email sign-up: the single sign-on page with the email left open, plus a password.
</script>

<template>
  <AuthPage>
    <Title :flow="2" :note="4">Create your account</Title>
    <Lead>Check your details and create your account.</Lead>
    <SignUpDetails />
    <Field label="Password">
      <Input type="password" value="Threadbare#2026" />
    </Field>
    <div :class="s.columns" style="margin-top: -8px; font-size: 11px; color: #333">
      <span v-for="rule in rules" :key="rule">✓ {{ rule }}</span>
    </div>
    <Field label="Confirm Password">
      <Input type="password" value="Threadbare#2026" />
    </Field>
    <span style="margin-top: -8px; font-size: 11px; color: #333">✓ Passwords match</span>
    <TermsCheck />
    <Button block to="Lo-Fi/2 Sign Up/2.4 Choose a Path">Create Account</Button>
    <span :class="s.small" style="font-size: 12px">
      Rather skip the password? <TextLink to="Lo-Fi/2 Sign Up/2.1 Google Confirm">Continue with Google</TextLink>
    </span>
  </AuthPage>
</template>
