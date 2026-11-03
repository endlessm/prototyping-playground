<!-- @studio-id vgzvy6t7946ev891 -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Badge from '../_wire/Badge.vue'
import Button from '../_wire/Button.vue'
import Fact from '../_wire/Fact.vue'
import Facts from '../_wire/Facts.vue'
import Field from '../_wire/Field.vue'
import Input from '../_wire/Input.vue'
import Lead from '../_wire/Lead.vue'
import Marker from '../_wire/Marker.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// Under 18: no account, the date says why, and the button stays off.
</script>

<template>
  <AuthPage>
    <Title>Is this you, Maya?</Title>
    <Lead>Check your details and create your account.</Lead>
    <Facts>
      <Fact label="Name" value="Maya Okafor"><TextLink to="2 Sign Up/2.2 Edit and Error">Edit</TextLink></Fact>
      <Fact label="Email" value="maya.okafor@gmail.com"><Badge>Google</Badge></Fact>
      <Fact label="Joining as" value="Educator"><TextLink>Change</TextLink></Fact>
    </Facts>
    <Field label="Date of Birth" error="You need to be 18 or older to teach on Endless.">
      <template #note><Marker :flow="2" :n="6" /></template>
      <Input value="03/14/2010" active />
    </Field>
    <Button block variant="disabled">Agree &amp; Create Account</Button>
    <Button block variant="ghost" to="2 Sign Up/2.1 Google Confirm">Back</Button>
    <span :class="s.small" style="font-size: 12px">
      Here to learn instead? <TextLink>Join as a learner</TextLink>
    </span>
  </AuthPage>
</template>
