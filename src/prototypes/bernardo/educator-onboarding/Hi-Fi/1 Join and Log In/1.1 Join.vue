<!-- @studio-id fn0y0cv72hrdd8q8 -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Button from '../_ui/Button.vue'
import Divider from '../_ui/Divider.vue'
import Field from '../_ui/Field.vue'
import Icon from '../_ui/Icon.vue'
import Input from '../_ui/Input.vue'
import Lead from '../_ui/Lead.vue'
import Logic from '../_ui/Logic.vue'
import Marker from '../_ui/Marker.vue'
import Panel from '../_ui/Panel.vue'
import TextLink from '../_ui/TextLink.vue'
import Title from '../_ui/Title.vue'
import s from '../_ui/ui.module.css'

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
        <Icon brand="google" />
        <span :class="s.grow">
          Looks like a Google address.
          <TextLink to="Hi-Fi/1 Join and Log In/1.4 Signed In">Continue with Google</TextLink> and skip the password.
        </span>
        <Marker :flow="1" :n="2" />
      </div>
    </Panel>
    <Button block to="Hi-Fi/1 Join and Log In/1.2 Returning">Continue</Button>
    <Divider>or continue with</Divider>
    <div :class="s.columns3">
      <Button variant="secondary" to="Hi-Fi/2 Sign Up/2.1 Google Confirm"><Icon brand="google" /> Google</Button>
      <Button variant="secondary" to="Hi-Fi/2 Sign Up/2.1 Google Confirm"><Icon brand="github" /> GitHub</Button>
      <Button variant="secondary" to="Hi-Fi/2 Sign Up/2.1 Google Confirm"><Icon brand="microsoft" /> Microsoft</Button>
    </div>
    <Logic
      title="Profile check after Continue"
      :flow="1"
      :note="4"
      :rows="[
        { label: 'Profile found → password appears on this page', to: 'Hi-Fi/1 Join and Log In/1.2 Returning' },
        { label: 'No profile → straight to the sign-up form, email filled in', to: 'Hi-Fi/2 Sign Up/2.3 Email Confirm' },
      ]"
    />
    <Logic
      title="Profile check after Google, GitHub or Microsoft"
      :flow="1"
      :note="5"
      :rows="[
        { label: 'Profile found → signed in', to: 'Hi-Fi/1 Join and Log In/1.4 Signed In' },
        { label: 'No profile → one confirm page, the same for all three', to: 'Hi-Fi/2 Sign Up/2.1 Google Confirm' },
        { label: 'No verified email at GitHub → no account, verify first', to: 'Hi-Fi/2 Sign Up/2.6 GitHub Unverified' },
      ]"
    />
  </AuthPage>
</template>
