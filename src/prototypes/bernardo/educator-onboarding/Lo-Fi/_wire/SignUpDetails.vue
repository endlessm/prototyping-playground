<script setup lang="ts">
import Field from './Field.vue'
import Input from './Input.vue'
import s from './wire.module.css'

// What sign-up already knows, as fields filled in. The name can always be changed; the email is locked only
// when a single sign-on provider gave it, and stays open when the person typed it. Sign-up is the same for
// everyone: what they came to do is asked after Create Account (2.4 Choose a Path).
defineProps<{ provider?: string }>()
</script>

<template>
  <div :class="s.columns">
    <Field label="First Name">
      <Input value="Maya" />
    </Field>
    <Field label="Last Name">
      <Input value="Okafor" />
    </Field>
  </div>
  <Field label="Email" :hint="provider ? `From your ${provider} account, so it can't be changed here.` : undefined">
    <Input type="email" value="maya.okafor@gmail.com" :locked="!!provider" />
  </Field>
</template>
