<!-- @studio-id fdtdzg9mn51mjxx5 -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Button from '../_wire/Button.vue'
import Checkbox from '../_wire/Checkbox.vue'
import Field from '../_wire/Field.vue'
import Input from '../_wire/Input.vue'
import Lead from '../_wire/Lead.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// A known email: the password appears on the same page, under the email, which stays an open field.
// No name and no "welcome back": that would tell anyone who types an email that it has an account.
</script>

<template>
  <AuthPage>
    <Title :flow="1" :note="3">Log in to Endless Studios</Title>
    <Lead>Enter your password to continue.</Lead>
    <Field label="Email">
      <Input type="email" value="maya.okafor@gmail.com" />
    </Field>
    <Field label="Password">
      <Input type="password" placeholder="Enter password" />
    </Field>
    <div :class="[s.row, s.spread]" style="font-size: 12px">
      <TextLink>Forgot Password?</TextLink>
      <Checkbox label="Show password" />
    </div>
    <Button block to="Lo-Fi/1 Join and Log In/1.4 Signed In">Log In</Button>
  </AuthPage>
</template>
