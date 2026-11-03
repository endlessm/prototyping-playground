<!-- @studio-id whqzegzw7xmgr6p2 -->
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
import Logic from '../_wire/Logic.vue'
import Marker from '../_wire/Marker.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// Single sign-on, new account: what we know is a card to confirm; date of birth is the one field left.
const routes = [
  { label: "18 or older → account and Maya's Team created → Team Dashboard", to: '3 Create Team/3.1 After Sign-Up' },
  { label: 'Under 18 → no account, error on the date', to: '2 Sign Up/2.5 Under 18' },
]
</script>

<template>
  <AuthPage>
    <Title :flow="2" :note="1">Is this you, Maya?</Title>
    <Lead>Check your details and create your account.</Lead>
    <Facts>
      <Fact label="Name" value="Maya Okafor"><TextLink to="2 Sign Up/2.2 Edit and Error">Edit</TextLink></Fact>
      <Fact label="Email" value="maya.okafor@gmail.com"><Badge>Google</Badge></Fact>
      <Fact label="Joining as" value="Educator"><TextLink>Change</TextLink></Fact>
    </Facts>
    <Field label="Date of Birth" hint="The only thing Google doesn't tell us. Educators must be 18 or older.">
      <template #note><Marker :flow="2" :n="2" /></template>
      <Input placeholder="mm/dd/yyyy" />
    </Field>
    <Button block to="3 Create Team/3.1 After Sign-Up">Agree &amp; Create Account</Button>
    <div :class="s.row" style="align-items: flex-start; font-size: 12px; color: #666">
      <Marker :flow="2" :n="3" />
      <span>
        By creating an account you agree to the <TextLink>Terms of Use</TextLink> and
        <TextLink>Privacy Policy</TextLink>.
      </span>
    </div>
    <Logic title="Date of birth checked before the account is created" :rows="routes" />
  </AuthPage>
</template>
