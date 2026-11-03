<!-- @studio-id ka9sss4h7ewp0bvp -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Avatar from '../_wire/Avatar.vue'
import Button from '../_wire/Button.vue'
import Lead from '../_wire/Lead.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// A new email: one confirmation, then the sign-up page with the email filled in.
</script>

<template>
  <AuthPage>
    <Title :flow="1" :note="4">You're new here. Welcome!</Title>
    <Lead>We'll create your account with this email.</Lead>
    <div :class="s.row" style="border: 1px solid #ccc; padding: 8px 12px">
      <Avatar>@</Avatar>
      <span :class="s.grow">maya.okafor@gmail.com</span>
      <TextLink to="1 Join and Log In/1.1 Join">Change</TextLink>
    </div>
    <Button block to="2 Sign Up/2.3 Email Confirm">Create My Account</Button>
    <span :class="s.small" style="font-size: 12px">
      Already have an account with another email? <TextLink to="1 Join and Log In/1.1 Join">Try that one</TextLink>
    </span>
  </AuthPage>
</template>
