<!-- @studio-id bwnxam6kvmfskkgc -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Button from '../_ui/Button.vue'
import Field from '../_ui/Field.vue'
import Input from '../_ui/Input.vue'
import Lead from '../_ui/Lead.vue'
import TextLink from '../_ui/TextLink.vue'
import Title from '../_ui/Title.vue'

// Email sign-up only: the app confirms the address with a 6-digit code before the account opens. Single sign-on
// skips this page, since those providers send emails they have already confirmed.
</script>

<template>
  <AuthPage>
    <Title :flow="2" :note="7">Verify your account</Title>
    <Lead>We sent a 6-digit verification code to maya.okafor@gmail.com. Enter it below to continue.</Lead>
    <Field label="Verification code">
      <Input value="482915" />
    </Field>
    <Button block to="Hi-Fi/2 Sign Up/2.4 Choose a Path">Continue</Button>
    <span style="text-align: center"><TextLink>Resend Code</TextLink></span>
  </AuthPage>
</template>
