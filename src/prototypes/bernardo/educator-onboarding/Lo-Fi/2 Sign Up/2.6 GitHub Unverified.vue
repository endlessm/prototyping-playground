<!-- @studio-id 8c4gjpxkazn38k3y -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Badge from '../_wire/Badge.vue'
import Button from '../_wire/Button.vue'
import Lead from '../_wire/Lead.vue'
import Panel from '../_wire/Panel.vue'
import Small from '../_wire/Small.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// GitHub lets an account keep an email it never confirmed; without a confirmed one there is no account to create.
const steps = [
  'On GitHub, go to Settings › Emails.',
  'Next to maya.okafor@proton.me, choose Resend verification email.',
  'Open the email GitHub sends you and click the link in it.',
  'Come back here and choose GitHub again.',
]
</script>

<template>
  <AuthPage>
    <Title :flow="2" :note="5">Confirm your email on GitHub first</Title>
    <Lead>
      Your GitHub account has this email, but you haven't confirmed it with GitHub yet. We can only create your account
      with an email GitHub has confirmed is yours.
    </Lead>
    <div :class="s.row" style="border: 1px solid #ccc; padding: 8px 12px">
      <span :class="s.grow">maya.okafor@proton.me</span>
      <Badge>Not confirmed on GitHub</Badge>
    </div>
    <Panel>
      <span :class="s.label">How to fix it</span>
      <ol :class="s.bullets" style="list-style: decimal">
        <li v-for="step in steps" :key="step">{{ step }}</li>
      </ol>
    </Panel>
    <Button block>Open GitHub Email Settings</Button>
    <Button block variant="secondary" to="Lo-Fi/1 Join and Log In/1.1 Join">Join with My Email Instead</Button>
    <Small>
      Why we ask: anyone can add an email to a GitHub account. Until GitHub confirms it, the email could belong to someone
      else.
    </Small>
  </AuthPage>
</template>
