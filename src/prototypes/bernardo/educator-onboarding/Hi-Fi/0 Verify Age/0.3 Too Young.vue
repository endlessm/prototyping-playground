<!-- @studio-id renj8411svg8zckd -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Button from '../_ui/Button.vue'
import Lead from '../_ui/Lead.vue'
import Spot from '../_ui/Spot.vue'
import Title from '../_ui/Title.vue'

// Under 13: no account can be made, so this is a page of its own rather than an error under the date. It still
// offers a way in, as a guest.
</script>

<template>
  <AuthPage kids>
    <Spot icon="i-lucide-cat" tone="kids" />
    <Title :flow="0" :note="2">Awww…<br />You're not old enough to join!</Title>
    <Lead>
      Endless Studios is built for teens and adults.<br />
      You can still explore our games without an account.
    </Lead>
    <Button variant="kids">Explore as a Guest</Button>
  </AuthPage>
</template>
