<script setup lang="ts">
// A test screen that navigates in every way the app does: each call is logged and the screen stays.
const router = useRouter()
const route = useRoute()
navigateTo('/programs/')
router.push({ path: '/profile/ana.learner/' })
</script>

<template>
  <p>Route: {{ route.path }}</p>
  <NuxtLink to="/explore/">Explore</NuxtLink>
</template>
