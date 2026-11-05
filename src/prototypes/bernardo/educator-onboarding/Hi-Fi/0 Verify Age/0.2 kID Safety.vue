<!-- @studio-id 95n4hd8t52ejqpj7 -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Button from '../_ui/Button.vue'
import Lead from '../_ui/Lead.vue'
import Spot from '../_ui/Spot.vue'
import TextLink from '../_ui/TextLink.vue'
import Title from '../_ui/Title.vue'

// 13 to 17: the account goes ahead with some features held back, and this page says so before Join.
</script>

<template>
  <AuthPage kids>
    <Spot icon="i-lucide-shield-check" tone="kids" />
    <Title :flow="0" :note="4">To guarantee your safety…</Title>
    <Lead>
      Some features are limited on your account to help keep you safe and follow youth protection laws in your country.
    </Lead>
    <Lead>You'll have the option to unlock these features by asking a parent or trusted adult to approve access.</Lead>
    <Button variant="kids" block to="Hi-Fi/1 Join and Log In/1.1 Join">Ok!</Button>
    <span style="text-align: center"><TextLink>Learn more</TextLink></span>
  </AuthPage>
</template>
