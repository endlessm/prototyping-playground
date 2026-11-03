<!-- @studio-id fdtdzg9mn51mjxx5 -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Avatar from '../_wire/Avatar.vue'
import Button from '../_wire/Button.vue'
import Checkbox from '../_wire/Checkbox.vue'
import Field from '../_wire/Field.vue'
import Input from '../_wire/Input.vue'
import Lead from '../_wire/Lead.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// A known email: the password appears on the same page, under the confirmed email.
</script>

<template>
  <AuthPage>
    <Title :flow="1" :note="3">Welcome back, Maya</Title>
    <Lead>Enter your password to log in.</Lead>
    <div :class="s.row" style="border: 1px solid #ccc; padding: 8px 12px">
      <Avatar>MO</Avatar>
      <span :class="s.grow">maya.okafor@gmail.com</span>
      <TextLink to="1 Join and Log In/1.1 Join">Change</TextLink>
    </div>
    <Field label="Password">
      <Input type="password" placeholder="Enter password" />
    </Field>
    <div :class="[s.row, s.spread]" style="font-size: 12px">
      <TextLink>Forgot Password?</TextLink>
      <Checkbox label="Show password" />
    </div>
    <Button block to="1 Join and Log In/1.4 Signed In">Log In</Button>
  </AuthPage>
</template>
