<!--
  The Endless Studios alert's examples, written as screens write it: <UAlert> with the app's props. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const variants = ['subtle', 'soft', 'outline', 'solid'] as const;
</script>

<template>
  <Example name="Default">
    <UAlert
      class="w-full"
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="Enrollment closes Friday"
      description="Learners who join after that can still play, but won't count toward this cohort's results."
    />
  </Example>

  <Example name="WithActions">
    <UAlert
      class="w-full"
      color="warning"
      variant="subtle"
      orientation="horizontal"
      icon="i-lucide-user-x"
      title="This account is disabled"
      :actions="[{ label: 'Enable', color: 'warning' }]"
    />
  </Example>

  <Example name="Verification">
    <UAlert
      class="w-full"
      color="warning"
      variant="subtle"
      orientation="horizontal"
      icon="i-lucide-user-check"
      title="Email not verified"
      :actions="[{ label: 'Resend Email', color: 'warning', variant: 'outline' }]"
    />
  </Example>

  <Example name="RichDescription">
    <UAlert class="w-full" color="info" variant="soft">
      <template #description>
        <div class="space-y-2">
          <p>These contributors are linked to this pull request:</p>
          <div class="flex gap-2">
            <UBadge color="neutral" variant="outline">ana.souza</UBadge>
            <UBadge color="neutral" variant="outline">joao.lima</UBadge>
          </div>
        </div>
      </template>
    </UAlert>
  </Example>

  <Example name="Variants">
    <div class="grid w-full gap-3">
      <UAlert
        v-for="variant in variants"
        :key="variant"
        :variant="variant"
        color="neutral"
        icon="i-lucide-bell"
        :title="variant[0]!.toUpperCase() + variant.slice(1)"
        description="Your mentor left feedback on Level 3."
      />
    </div>
  </Example>

  <Example name="Colors">
    <div class="grid w-full gap-3">
      <UAlert color="info" variant="subtle" icon="i-lucide-info" title="Info" />
      <UAlert color="success" variant="subtle" icon="i-lucide-circle-check" title="Success" />
      <UAlert color="warning" variant="subtle" icon="i-lucide-triangle-alert" title="Warning" />
      <UAlert color="error" variant="subtle" icon="i-lucide-circle-x" title="Error" />
    </div>
  </Example>

  <Example name="Dismissible">
    <UAlert
      class="w-full"
      color="neutral"
      variant="outline"
      icon="i-lucide-eye-off"
      title="Your profile is private"
      description="Only you and your mentors can see it."
      close
    />
  </Example>
</template>
