<!--
  The Endless Studios dropdown menu's examples, written as screens write it: <UDropdownMenu :items="…"> around the
  button that opens it. Each example keeps room for its menu. Each <Example name="…"> is one example on the
  component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const rowActions = [
  [
    { label: 'Edit', icon: 'i-lucide-pencil' },
    { label: 'Duplicate', icon: 'i-lucide-copy' },
    { label: 'Copy Link', icon: 'i-lucide-link' },
  ],
  [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const }],
];

const account = [
  [{ label: 'Ana Souza', type: 'label' as const }],
  [
    { label: 'My Profile', icon: 'i-lucide-user' },
    { label: 'Settings', icon: 'i-lucide-settings' },
    { label: 'Help', icon: 'i-lucide-circle-help' },
  ],
  [{ label: 'Log Out', icon: 'i-lucide-log-out' }],
];
</script>

<template>
  <Example name="RowActions">
    <div class="flex h-56 w-full items-start justify-end">
      <UDropdownMenu :items="rowActions" :content="{ align: 'end' }">
        <UButton icon="i-lucide-ellipsis" color="neutral" variant="ghost" aria-label="More actions for Lantern Keeper" />
      </UDropdownMenu>
    </div>
  </Example>

  <Example name="InAListRow">
    <div class="h-56 w-full">
      <UCard variant="bordered">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-highlighted">Lantern Keeper</p>
            <p class="text-xs text-muted">Updated 2 days ago</p>
          </div>
          <UDropdownMenu :items="rowActions" :content="{ align: 'end' }">
            <UButton icon="i-lucide-ellipsis" color="neutral" variant="ghost" aria-label="More actions for Lantern Keeper" />
          </UDropdownMenu>
        </div>
      </UCard>
    </div>
  </Example>

  <Example name="AccountMenu">
    <div class="flex h-72 w-full items-end">
      <UDropdownMenu :items="account" :content="{ side: 'top', align: 'start', sideOffset: 8 }" :ui="{ content: 'w-56' }">
        <UButton color="neutral" variant="ghost" class="w-56" trailing-icon="i-lucide-chevrons-up-down">
          <UAvatar text="AS" size="xs" />
          Ana Souza
        </UButton>
      </UDropdownMenu>
    </div>
  </Example>
</template>
