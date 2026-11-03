<!--
  The Endless Studios calendar's examples, written as screens write it: <UCalendar v-model="…">. They start empty,
  since this system doesn't list @internationalized/date for preset values. Each <Example name="…"> is one example
  on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const day = ref();
const range = ref();
</script>

<template>
  <Example name="Default">
    <UCalendar v-model="day" />
  </Example>

  <Example name="Range">
    <UCalendar v-model="range" range />
  </Example>

  <Example name="TwoMonths">
    <UCalendar range :number-of-months="2" />
  </Example>

  <Example name="InAPopover">
    <div class="h-[26rem] w-full">
      <UPopover>
        <UButton color="neutral" variant="outline" icon="i-lucide-calendar">Choose Dates</UButton>
        <template #content>
          <UCalendar v-model="range" range class="p-3" />
        </template>
      </UPopover>
    </div>
  </Example>
</template>
