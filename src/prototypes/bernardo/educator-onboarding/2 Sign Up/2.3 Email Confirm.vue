<!-- @studio-id hxajbnq56zgh6r1c -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Button from '../_wire/Button.vue'
import Fact from '../_wire/Fact.vue'
import Facts from '../_wire/Facts.vue'
import Field from '../_wire/Field.vue'
import Input from '../_wire/Input.vue'
import Lead from '../_wire/Lead.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

const rules = ['At least 1 upper case character', 'At least 8 characters', 'At least 1 symbol', 'At least 1 number']

// Email sign-up: the same page, with name, date of birth and password added.
</script>

<template>
  <AuthPage>
    <Title :flow="2" :note="5">Create your account</Title>
    <Lead>Same page with email: name, password and date of birth.</Lead>
    <Facts>
      <Fact label="Email" value="maya.okafor@gmail.com"><TextLink to="1 Join and Log In/1.1 Join">Change</TextLink></Fact>
      <Fact label="Joining as" value="Educator"><TextLink>Change</TextLink></Fact>
    </Facts>
    <div :class="s.columns">
      <Field label="First &amp; Last Name">
        <Input value="Maya Okafor" />
      </Field>
      <Field label="Date of Birth">
        <Input value="04/12/1988" />
      </Field>
    </div>
    <Field label="Password">
      <Input type="password" value="Threadbare#2026" />
    </Field>
    <div :class="s.columns" style="margin-top: -8px; font-size: 11px; color: #333">
      <span v-for="rule in rules" :key="rule">✓ {{ rule }}</span>
    </div>
    <Button block to="3 Create Team/3.1 After Sign-Up">Agree &amp; Create Account</Button>
    <span :class="s.small" style="font-size: 12px">
      Rather skip the password? <TextLink to="2 Sign Up/2.1 Google Confirm">Continue with Google</TextLink>
    </span>
  </AuthPage>
</template>
