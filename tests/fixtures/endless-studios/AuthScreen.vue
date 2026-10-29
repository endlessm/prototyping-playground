<script setup lang="ts">
// A test screen that shows every role check the app makes, and asks to sign in, sign up and sign out.
const { $auth } = useNuxtApp()
const checks = [
  'loggedIn',
  'isAdmin',
  'isLeader',
  'isEditor',
  'isProgramAdmin',
  'isProgramManager',
  'isInstitutionAdmin',
  'isCohortAdmin',
  'isAdult',
  'isMinor',
] as const
const roles = checks.filter((check) => $auth[check])
await $auth.startLogin()
await $auth.startSignup()
await $auth.startLogout()
</script>

<template>
  <p>User: {{ $auth.user?.first_name ?? 'nobody' }}</p>
  <p>Roles: {{ roles.join(' ') || 'none' }}</p>
</template>
