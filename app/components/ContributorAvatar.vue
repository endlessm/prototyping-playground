<script setup lang="ts">
// A contributor's picture in a byline: their own image in `public/` if their
// profile names one, otherwise their GitHub photo, otherwise their initials,
// which also stand in when the image fails to load (offline, say).
const props = defineProps<{
  name: string
  github?: string
  avatar?: string
}>()
const base = useRuntimeConfig().app.baseURL
const GITHUB = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

const initials = computed(
  () =>
    props.name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?',
)
const src = computed(() => {
  if (props.avatar) return `${base}${props.avatar.replace(/^\/+/, '')}`
  const account = props.github?.trim()
  return account && GITHUB.test(account)
    ? `https://github.com/${encodeURIComponent(account)}.png?size=80`
    : undefined
})
</script>

<template>
  <UAvatar
    :key="src"
    :src="src"
    :text="initials"
    size="3xs"
    aria-hidden="true"
    referrerpolicy="no-referrer"
  />
</template>
