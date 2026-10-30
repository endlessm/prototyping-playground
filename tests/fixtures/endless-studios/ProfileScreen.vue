<script setup lang="ts">
// A test screen: the copied profile card for the signed-in user, or the app's login action when signed out.
import UserProfileCard from '~/components/Profile/UserProfileCard.vue'

const { $auth } = useNuxtApp()
</script>

<template>
  <UserProfileCard v-if="$auth.loggedIn" :user="$auth.user" :can-edit="true" />
  <UButton v-else @click="$auth.requireLogin()">{{ $t('login') }}</UButton>
</template>
