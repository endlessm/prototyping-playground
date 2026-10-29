<!-- @studio-id hme0000000000a01 -->
<!-- @studio-state stmb00000000a001 Member -->
<!-- @studio-state stnw00000000a001 New user -->
<script setup lang="ts">
import { ref } from 'vue'
import {
  PrototypeLink,
  useIsPrototypeArtifact,
  usePrototypeArtifactHref,
  usePrototypeNavigate,
} from '#studio/prototype'

defineProps<{ name?: string }>()
const count = ref(0)
const href = usePrototypeArtifactHref()
const navigate = usePrototypeNavigate()
const here = useIsPrototypeArtifact('Home')
</script>

<script lang="ts">
export const states = [
  { title: 'Member', props: { name: 'Ana' } },
  { title: 'New user', props: { name: '' } },
]
</script>

<template>
  <main>
    <h1>{{ name ? 'Welcome back, ' + name : 'Welcome' }}</h1>
    <button type="button" @click="count++">Add</button>
    <p>Count {{ count }}</p>
    <p v-if="here">You are on Home</p>
    <p>Details lives at {{ href('flows/Details') }}</p>
    <PrototypeLink to="flows/Details">Details</PrototypeLink>
    <button type="button" @click="navigate('flows/Details')">
      Go to details
    </button>
    <a href="#bottom">Jump to the bottom</a>
    <a href="https://example.com/help">Help</a>
    <label>Notes <input type="text" /></label>
    <div style="height: 3000px"></div>
    <p id="bottom">Bottom of Home</p>
  </main>
</template>
