<!-- @studio-id rf69gxn5yyhhhf9q -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Button from '../_ui/Button.vue'
import Checkbox from '../_ui/Checkbox.vue'
import Field from '../_ui/Field.vue'
import Input from '../_ui/Input.vue'
import Lead from '../_ui/Lead.vue'
import TextLink from '../_ui/TextLink.vue'
import Title from '../_ui/Title.vue'
import s from '../_ui/ui.module.css'

// A known email: the password appears on the same page, under the email, which stays an open field.
</script>

<template>
  <AuthPage>
    <Title :flow="1" :note="3">Welcome back, Maya</Title>
    <Lead>Enter your password to log in.</Lead>
    <Field label="Email">
      <Input type="email" value="maya.okafor@gmail.com" />
    </Field>
    <Field label="Password">
      <Input type="password" placeholder="Enter password" />
    </Field>
    <div :class="[s.row, s.spread]">
      <TextLink>Forgot Password?</TextLink>
      <Checkbox label="Show password" />
    </div>
    <Button block to="Hi-Fi/1 Join and Log In/1.4 Signed In">Log In</Button>
  </AuthPage>
</template>
