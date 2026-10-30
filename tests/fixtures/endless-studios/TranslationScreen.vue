<script setup lang="ts">
// A test screen for the app's message syntax: placeholders, plurals, literal text, a key with dots in it, a key
// only English has, `$te` and `$tm`.
const { t, te } = useI18n()
</script>

<template>
  <p>Named: {{ $t('learners_with_xp', { threshold: 100 }) }}</p>
  <p>One: {{ $t('learners_count', 1) }}</p>
  <p>Many: {{ $t('learners_count', 5) }}</p>
  <p>Literal: {{ t('username_cant_contain...') }}</p>
  <p>Fallback: {{ $t('users_description', 2) }}</p>
  <p>Known: {{ te('learners_count') }} {{ $te('no_such.key') }}</p>
  <p>Messages: {{ typeof $tm('learners_count') }}</p>
</template>
