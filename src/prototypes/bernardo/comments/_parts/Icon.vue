<script setup lang="ts">
// Lucide icons as inline SVG: a prototype with no system has no icon set.
defineProps<{ name: string; size?: number }>()
</script>

<script lang="ts">
const PATHS = {
  message: [
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  ],
  'message-plus': [
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    '<path d="M12 7v6"/><path d="M9 10h6"/>',
  ],
  eye: [
    '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>',
    '<circle cx="12" cy="12" r="3"/>',
  ],
  'eye-off': [
    '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>',
    '<path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>',
    '<path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>',
    '<path d="m2 2 20 20"/>',
  ],
  panel: [
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>',
  ],
  copy: [
    '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>',
    '<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  ],
  check: ['<path d="M20 6 9 17l-5-5"/>'],
  'circle-check': [
    '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  ],
  x: ['<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'],
  more: [
    '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  ],
  send: ['<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>'],
  bot: [
    '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/>',
    '<path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  ],
  reopen: [
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  ],
  alert: [
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>',
    '<path d="M12 9v4"/><path d="M12 17h.01"/>',
  ],
  file: [
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>',
    '<path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  ],
  pointer: [
    '<path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>',
    '<path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M5 21a2 2 0 0 1-2-2"/>',
    '<path d="M9 3h1"/><path d="M9 21h2"/><path d="M14 3h1"/><path d="M3 9v1"/><path d="M21 9v2"/><path d="M3 14v1"/>',
  ],
  quote: [
    '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
    '<path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
  ],
} satisfies Record<string, string[]> as Record<string, string[]>
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size ?? 16"
    :height="size ?? 16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="PATHS[name].join('')"
  />
</template>
