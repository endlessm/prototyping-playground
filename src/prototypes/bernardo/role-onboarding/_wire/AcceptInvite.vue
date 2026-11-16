<script setup lang="ts">
import AuthPage from './AuthPage.vue'
import Button from './Button.vue'
import Divider from './Divider.vue'
import Field from './Field.vue'
import Icon from './Icon.vue'
import Input from './Input.vue'
import Lead from './Lead.vue'
import Logic from './Logic.vue'
import Marker from './Marker.vue'
import Small from './Small.vue'
import TextLink from './TextLink.vue'
import Title from './Title.vue'
import { roles, view, type RoleKey } from './world'
import s from './wire.module.css'

// Where the invite's button lands. The invite's card sits on top in every mode; below it, someone signed out gets the
// same one door as Join (the invited email filled in), someone signed in accepts with one button, and an expired
// invite says who can send a new one.
withDefaults(defineProps<{ role: RoleKey; mode?: 'signedOut' | 'signedIn' | 'expired' }>(), { mode: 'signedOut' })
</script>

<template>
  <AuthPage>
    <div :class="s.roInvite">
      <span :class="s.small">{{ roles[role].by.name }} invited you to</span>
      <span :class="s.roInviteRole">
        {{ roles[role].label }}
        <Marker :flow="roles[role].flow" :n="2" />
      </span>
      <span :class="s.label">{{ roles[role].entity }}</span>
    </div>

    <template v-if="mode === 'signedOut'">
      <Title>Accept your invite</Title>
      <div :class="[s.stack, s.tight]">
        <Button variant="secondary" block :to="view(role, 3)"><Icon />Continue with Google</Button>
        <Button variant="secondary" block :to="view(role, 3)"><Icon />Continue with Microsoft</Button>
        <Button variant="secondary" block :to="view(role, 3)"><Icon />Continue with GitHub</Button>
      </div>
      <Divider>or</Divider>
      <Field label="Email">
        <Input :value="roles[role].person.email" />
      </Field>
      <Button block :to="view(role, 3)">Continue</Button>
      <Logic
        title="After Continue"
        :rows="[
          { label: 'Has an account → password on this page, then the Welcome', to: view(role, 3) },
          { label: 'New → Verify Age and Sign Up (Educator Onboarding), then the Welcome', to: view(role, 3) },
        ]"
      />
    </template>

    <template v-else-if="mode === 'signedIn'">
      <Title>Accept your invite</Title>
      <Lead>You're signed in as {{ roles[role].person.name }} ({{ roles[role].person.email }}).</Lead>
      <Button block :to="view(role, 3)">Accept as {{ roles[role].label }}</Button>
      <Button block variant="secondary">Decline</Button>
      <Small>Not you? <TextLink>Switch Account</TextLink></Small>
    </template>

    <template v-else>
      <Title>This invite has expired</Title>
      <Lead>Invites work for 14 days. Ask {{ roles[role].by.name }} to send a new one.</Lead>
      <Button block>Ask for a New Invite</Button>
    </template>
  </AuthPage>
</template>
