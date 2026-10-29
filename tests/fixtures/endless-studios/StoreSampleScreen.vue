<script setup lang="ts">
// A test screen whose commit and dispatch are answered by the sample's own mutations and actions.
import { useStore } from 'vuex'

const store = useStore()
store.commit('SET_NOTIFICATIONS', 3)
await store.dispatch('loadPrograms', ['Intro to Godot'])
</script>

<template>
  <p>Notifications: {{ $store.state.systemNotificationCount }}</p>
  <p>Programs: {{ store.state.user.individualPrograms.join(', ') }}</p>
  <p>Admin for: {{ store.state.user.adminForProgramsIdSet.length }}</p>
  <p>Getter: {{ useStore().getters.programCount }}</p>
</template>
