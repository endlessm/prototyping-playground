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
          <TextLink to="1 Join and Log In/1.4 Signed In">Continue with Google</TextLink> and skip the password.
        </span>
        <Marker :flow="1" :n="2" />
      </div>
    </Panel>
    <Button block to="1 Join and Log In/1.2 Returning">Continue</Button>
    <Divider>or continue with</Divider>
    <div :class="s.columns3">
      <Button variant="secondary" to="1 Join and Log In/1.4 Signed In"><Icon /> Google</Button>
      <Button variant="secondary" to="1 Join and Log In/1.4 Signed In"><Icon /> GitHub</Button>
      <Button variant="secondary" to="1 Join and Log In/1.4 Signed In"><Icon square /> Microsoft</Button>
    </div>
    <Logic
      title="Profile check after Continue"
      :rows="[
        { label: 'Profile found → password appears on this page', to: '1 Join and Log In/1.2 Returning' },
        { label: 'No profile → create account on this page', to: '1 Join and Log In/1.3 New Email' },
      ]"
    />
  </AuthPage>
</template>
