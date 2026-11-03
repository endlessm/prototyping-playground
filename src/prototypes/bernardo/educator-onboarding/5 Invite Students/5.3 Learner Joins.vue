<!-- @studio-id ahh35h4sp7yez6fs -->
<!-- @lofi -->
<script setup lang="ts">
import AuthPage from '../_wire/AuthPage.vue'
import Badge from '../_wire/Badge.vue'
import Button from '../_wire/Button.vue'
import Field from '../_wire/Field.vue'
import Input from '../_wire/Input.vue'
import Lead from '../_wire/Lead.vue'
import Logic from '../_wire/Logic.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// The learner's side: the class link opens today's sign-up with the class attached, age gate first.
const ages = [
  { label: "Under 13 → Age-restricted page, can't sign up" },
  { label: '13–15 → ask a parent (consent)', to: '5 Invite Students/5.4 Parent Consent' },
  { label: '16+ → sign-up method, then into the class' },
]
</script>

<template>
  <AuthPage caption="(learner view, /signup?code=SPRING-GM)">
    <div>
      <Badge>Class: Spring Game Makers</Badge>
    </div>
    <Title :flow="5" :note="4">Join Maya's Class</Title>
    <Lead>Explore: Threadbare with Okafor Homeschool Co-op. First, when were you born?</Lead>
    <div :class="s.row" style="align-items: flex-start">
      <div :class="s.grow">
        <Field label="Month">
          <Input value="April" />
        </Field>
      </div>
      <div style="width: 95px">
        <Field label="Day">
          <Input value="12" />
        </Field>
      </div>
      <div style="width: 95px">
        <Field label="Year">
          <Input value="2013" />
        </Field>
      </div>
    </div>
    <Button block to="5 Invite Students/5.4 Parent Consent">Continue</Button>
    <Logic title="Age gate (today's sign-up)" :rows="ages" />
  </AuthPage>
</template>
