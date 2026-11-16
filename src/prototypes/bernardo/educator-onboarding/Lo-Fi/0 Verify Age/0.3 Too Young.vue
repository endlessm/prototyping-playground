<!-- @studio-id pcc9fy50d3nad2gt -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Button from '../_wire/Button.vue'
import Lead from '../_wire/Lead.vue'
import Placeholder from '../_wire/Placeholder.vue'
import Title from '../_wire/Title.vue'

// Under 13: no account can be made, so this is a page of its own rather than an error under the date. It still
// offers a way in, as a guest.
</script>

<template>
  <AuthPage>
    <Placeholder :height="120" style="width: 120px">Mascot</Placeholder>
    <Title :flow="0" :note="2">Awww…<br />You're not old enough to join!</Title>
    <Lead>
      Endless Studios is built for teens and adults.<br />
      You can still explore our games without an account.
    </Lead>
    <Button>Explore as a Guest</Button>
  </AuthPage>
</template>
