<!-- @studio-id t0pfk9jp7kbq6y3q -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Button from '../_wire/Button.vue'
import Lead from '../_wire/Lead.vue'
import Placeholder from '../_wire/Placeholder.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'

// 13 to 17: the account goes ahead with some features held back, and this page says so before Join.
</script>

<template>
  <AuthPage>
    <Placeholder :height="96" style="width: 84px">Shield</Placeholder>
    <Title :flow="0" :note="4">To guarantee your safety…</Title>
    <Lead>
      Some features are limited on your account to help keep you safe and follow youth protection laws in your country.
    </Lead>
    <Lead>You'll have the option to unlock these features by asking a parent or trusted adult to approve access.</Lead>
    <Button block to="1 Join and Log In/1.1 Join">Ok!</Button>
    <span style="text-align: center; font-size: 12px"><TextLink>Learn more</TextLink></span>
  </AuthPage>
</template>
