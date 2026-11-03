<!-- @studio-id gmxgpvgqw8342s9t -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Button from '../_wire/Button.vue'
import Field from '../_wire/Field.vue'
import Input from '../_wire/Input.vue'
import Panel from '../_wire/Panel.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// 13 to 15: the learner asks a parent on the kids consent surface, so Maya never has to know who needs it.
</script>

<template>
  <AuthPage>
    <Panel style="border: 1px solid #ccc; padding: 20px; gap: 14px">
      <span :class="s.small" style="font-size: 12px">Kids surface (teal in the app)</span>
      <Title :flow="5" :note="5">Let's Ask a Parent</Title>
      <span :class="s.label" style="font-size: 13px">
        You're almost in. A parent or guardian needs to say it's OK for you to join Spring Game Makers.
      </span>
      <Field label="Parent's Email">
        <Input type="email" value="r.raman@icloud.com" />
      </Field>
      <Button block to="5 Invite Students/5.5 Team Dashboard">Send to My Parent</Button>
      <span :class="s.label">Maya sees “Needs parent consent” next to your name until they approve.</span>
    </Panel>
  </AuthPage>
</template>
