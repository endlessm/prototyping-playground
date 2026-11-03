<!--
  The Endless Studios popover's examples, written as screens write it: <UPopover> around the element that opens
  it, with the panel in #content. Each example keeps room for its panel. Each <Example name="…"> is one example on
  the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const link = ref('');
const xp = [
  { skill: 'Level design', points: 120 },
  { skill: 'Storytelling', points: 80 },
  { skill: 'Playtesting', points: 40 },
];
</script>

<template>
  <Example name="Default">
    <div class="h-[26rem] w-full">
      <UPopover>
        <UButton color="neutral" variant="outline" icon="i-lucide-calendar">Choose Dates</UButton>
        <template #content>
          <UCalendar range class="p-3" />
        </template>
      </UPopover>
    </div>
  </Example>

  <Example name="Hover">
    <div class="h-48 w-full">
      <UPopover mode="hover" :content="{ side: 'bottom', align: 'start' }">
        <UBadge color="neutral" variant="soft">+ 240 XP</UBadge>
        <template #content>
          <div class="flex min-w-56 flex-col gap-2 p-3">
            <div v-for="item in xp" :key="item.skill" class="flex justify-between gap-8">
              <p class="text-sm text-default">{{ item.skill }}</p>
              <p class="text-sm font-semibold text-highlighted">{{ item.points }} XP</p>
            </div>
          </div>
        </template>
      </UPopover>
    </div>
  </Example>

  <Example name="LinkBox">
    <div class="h-40 w-full">
      <UPopover :ui="{ content: 'p-0.5' }">
        <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-link" aria-label="Link" />
        <template #content>
          <UInput v-model="link" type="url" variant="none" placeholder="Paste a link..." aria-label="Link address" autofocus class="w-72" />
        </template>
      </UPopover>
    </div>
  </Example>
</template>
