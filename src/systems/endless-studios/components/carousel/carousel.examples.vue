<!--
  The Endless Studios carousel's examples, written as screens write it: <UCarousel v-slot="{ item }" :items="…">.
  Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import heroSignedIn from '~/assets/images/hero-signed-in.png';
import endstarBg from '~/assets/images/endstar-bg.webp';

const banners = [
  { id: 1, title: 'Build worlds in Endstar', background: endstarBg },
  { id: 2, title: 'Weave your story in Threadbare', background: heroSignedIn },
];

const projects = [
  { id: 1, title: 'Lantern Keeper', author: 'ana.souza', color: 'bg-orange-100' },
  { id: 2, title: 'Moss Runner', author: 'joao.lima', color: 'bg-cornflower-100' },
  { id: 3, title: 'Tide Pool', author: 'carla.reis', color: 'bg-sky-100' },
  { id: 4, title: 'Robo Garden', author: 'marco.dias', color: 'bg-lime-100' },
  { id: 5, title: 'Starlight Post', author: 'bia.costa', color: 'bg-amber-100' },
];
</script>

<template>
  <Example name="Hero">
    <UCarousel v-slot="{ item }" :items="banners" :ui="{ container: 'ms-0 gap-4', item: 'ps-0' }" class="w-full" arrows dots>
      <section class="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-3xl bg-black px-6">
        <img :src="item.background" :alt="item.title" class="absolute inset-0 h-full w-full object-cover" />
        <p class="relative z-10 text-center text-3xl font-semibold text-white">{{ item.title }}</p>
      </section>
    </UCarousel>
  </Example>

  <Example name="SeveralAtOnce">
    <UCarousel v-slot="{ item }" :items="projects" :ui="{ item: 'basis-1/2 sm:basis-1/3' }" class="w-full" arrows>
      <UCard variant="bordered" :ui="{ body: 'p-0 sm:p-0' }">
        <div class="h-28 rounded-t-2xl" :class="item.color" />
        <div class="p-4">
          <p class="text-sm font-semibold text-highlighted">{{ item.title }}</p>
          <p class="text-xs text-muted">by {{ item.author }}</p>
        </div>
      </UCard>
    </UCarousel>
  </Example>
</template>
