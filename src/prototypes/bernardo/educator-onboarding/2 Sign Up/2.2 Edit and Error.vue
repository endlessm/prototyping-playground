<!-- @studio-id 9vf749hn726gp2j4 -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Badge from '../_wire/Badge.vue'
import Button from '../_wire/Button.vue'
import Field from '../_wire/Field.vue'
import Input from '../_wire/Input.vue'
import Lead from '../_wire/Lead.vue'
import Marker from '../_wire/Marker.vue'
import Small from '../_wire/Small.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// Edit opens the name row in place; an impossible date says what to check.
</script>

<template>
  <AuthPage>
    <Title>Is this you, Maya?</Title>
    <Lead>Check your details and create your account.</Lead>
    <div :class="s.facts">
      <div :class="[s.panel, s.stack, s.tight]">
        <div :class="s.columns">
          <Field label="First Name">
            <Input value="Maya" />
          </Field>
          <Field label="Last Name">
            <template #note><Marker :flow="2" :n="4" /></template>
            <Input value="Okafor" />
          </Field>
        </div>
        <Small>Learners and families see this name on your class.</Small>
      </div>
      <div :class="s.fact">
        <span>Email</span>
        <span>maya.okafor@gmail.com</span>
        <Badge>Google</Badge>
      </div>
      <div :class="s.fact">
        <span>Joining as</span>
        <span>Educator</span>
        <TextLink>Change</TextLink>
      </div>
    </div>
    <Field label="Date of Birth" error="February 30 isn't a date. Check the day.">
      <Input value="02/30/1988" active />
    </Field>
    <Button block to="3 Create Team/3.1 After Sign-Up">Agree &amp; Create Account</Button>
  </AuthPage>
</template>
