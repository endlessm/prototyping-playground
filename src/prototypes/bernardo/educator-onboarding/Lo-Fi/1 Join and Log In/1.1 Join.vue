<!-- @studio-id 191nk0dbzhxg0dkd -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Button from '../_wire/Button.vue'
import Divider from '../_wire/Divider.vue'
import Field from '../_wire/Field.vue'
import Icon from '../_wire/Icon.vue'
import Input from '../_wire/Input.vue'
import Lead from '../_wire/Lead.vue'
import Logic from '../_wire/Logic.vue'
import Marker from '../_wire/Marker.vue'
import Panel from '../_wire/Panel.vue'
import TextLink from '../_wire/TextLink.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// One door for new and returning educators: the email decides what the page becomes.
</script>

<template>
  <AuthPage>
    <Title :flow="1" :note="1">Join Endless Access</Title>
    <Lead>New or returning, start with your email.</Lead>
    <Field label="Email">
      <Input type="email" value="maya.okafor@gmail.com" />
    </Field>
    <Panel>
      <div :class="s.row" style="align-items: flex-start">
        <Icon />
        <span :class="s.grow" style="font-size: 12px">
          Looks like a Google address.
          <TextLink to="Lo-Fi/1 Join and Log In/1.4 Signed In">Continue with Google</TextLink> and skip the password.
        </span>
        <Marker :flow="1" :n="2" />
      </div>
    </Panel>
    <Button block to="Lo-Fi/1 Join and Log In/1.2 Returning">Continue</Button>
    <Divider>or continue with</Divider>
    <div :class="s.columns3">
      <Button variant="secondary" to="Lo-Fi/2 Sign Up/2.1 Google Confirm"><Icon /> Google</Button>
      <Button variant="secondary" to="Lo-Fi/2 Sign Up/2.1 Google Confirm"><Icon /> GitHub</Button>
      <Button variant="secondary" to="Lo-Fi/2 Sign Up/2.1 Google Confirm"><Icon square /> Microsoft</Button>
    </div>
    <Logic
      title="Profile check after Continue"
      :flow="1"
      :note="4"
      :rows="[
        { label: 'Profile found → password appears on this page', to: 'Lo-Fi/1 Join and Log In/1.2 Returning' },
        { label: 'No profile → straight to the sign-up form, email filled in', to: 'Lo-Fi/2 Sign Up/2.3 Email Confirm' },
      ]"
    />
    <Logic
      title="Profile check after Google, GitHub or Microsoft"
      :flow="1"
      :note="5"
      :rows="[
        { label: 'Profile found → signed in', to: 'Lo-Fi/1 Join and Log In/1.4 Signed In' },
        { label: 'No profile → one confirm page, the same for all three', to: 'Lo-Fi/2 Sign Up/2.1 Google Confirm' },
        { label: 'No verified email at GitHub → no account, verify first', to: 'Lo-Fi/2 Sign Up/2.6 GitHub Unverified' },
      ]"
    />
  </AuthPage>
</template>
