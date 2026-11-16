<script setup lang="ts">
import { ref } from 'vue'
import Button from './Button.vue'
import Field from './Field.vue'
import Input from './Input.vue'
import s from './ui.module.css'

// What sign-up already knows, as fields filled in. The name can always be changed, and the last name is optional.
// The email shows only when the person typed it: a single sign-on provider gives one that can't change here, so it
// isn't asked again. Sign-up is the same for everyone: what they came to do is asked after Create Account (2.4 Choose a Path).
const props = defineProps<{ provider?: string; minor?: boolean }>()

const person = props.minor
  ? { first: 'Ada', last: 'Okafor', email: 'ada.okafor@gmail.com' }
  : { first: 'Maya', last: 'Okafor', email: 'maya.okafor@gmail.com' }

// Adults choose their own username. Under 18, the site makes it, as in the app: an adjective and an animal from its
// own word lists, with three digits added when the account is made; Generate offers the next one.
const usernames = ['CleverHeron', 'MellowOtter', 'BrightFinch', 'CalmKoala']
const pick = ref(0)
</script>

<template>
  <div :class="s.columns">
    <Field label="First Name">
      <Input :value="person.first" />
    </Field>
    <Field label="Last Name">
      <template #note><span style="font-weight: 400; color: var(--es-dimmed)">(optional)</span></template>
      <Input :value="person.last" />
    </Field>
  </div>
  <Field v-if="!provider" label="Email">
    <Input type="email" :value="person.email" />
  </Field>
  <Field label="Username">
    <div v-if="minor" :class="s.row" style="gap: 8px">
      <span :class="s.grow"><Input :key="usernames[pick]" :value="usernames[pick]" locked /></span>
      <Button variant="secondary" class="shrink-0" @click="pick = (pick + 1) % usernames.length">Generate</Button>
    </div>
    <Input v-else placeholder="Choose a username" />
  </Field>
</template>
