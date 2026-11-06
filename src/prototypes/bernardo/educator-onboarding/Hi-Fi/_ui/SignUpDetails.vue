<script setup lang="ts">
import Field from './Field.vue'
import Input from './Input.vue'
import Select from './Select.vue'
import Small from './Small.vue'
import s from './ui.module.css'

// What sign-up already knows, as fields filled in. Name and role can always be changed; the email is
// locked only when a single sign-on provider gave it, and stays open when the educator typed it.
// Verify Age already knows a 13 to 17 year old's age, so Educator is off for them and Learner is chosen.
defineProps<{ provider?: string; teen?: boolean }>()
</script>

<template>
  <div :class="[s.stack, s.tight]">
    <div :class="s.columns">
      <Field label="First Name">
        <Input value="Maya" />
      </Field>
      <Field label="Last Name">
        <Input value="Okafor" />
      </Field>
    </div>
    <Small v-if="!teen">Learners and families see this name on your class.</Small>
  </div>
  <Field label="Email" :hint="provider ? `From your ${provider} account, so it can't be changed here.` : undefined">
    <Input type="email" value="maya.okafor@gmail.com" :locked="!!provider" />
  </Field>
  <Field label="Joining as" :hint="teen ? 'Educators must be 18 or older.' : undefined">
    <template v-if="teen" #note><slot name="teenNote" /></template>
    <Select
      :options="['Educator', 'Learner', 'Parent or Guardian']"
      :value="teen ? 'Learner' : 'Educator'"
      :disabled="teen ? ['Educator'] : undefined"
    />
  </Field>
</template>
