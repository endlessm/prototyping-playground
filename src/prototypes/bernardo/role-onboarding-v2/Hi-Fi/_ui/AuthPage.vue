<script setup lang="ts">
import logo from '~/assets/images/logo-endless-navbar.svg'
import banner from './threadbare-banner.jpg'

// Account pages, standalone (no sidebar): the live sign-up's Threadbare banner beside one 400px column, as the
// Educator Onboarding Hi-Fi draws them.
</script>

<template>
  <div class="grid min-h-screen grid-cols-2 bg-default">
    <div class="relative m-4 overflow-hidden rounded-[32px]">
      <img :src="banner" alt="" class="absolute inset-0 size-full object-cover" />
    </div>
    <div class="flex flex-col justify-center p-12">
      <div class="mx-auto mb-10 flex w-full max-w-100 items-center justify-between text-xs">
        <img :src="logo" alt="Endless Studios" class="block h-7 w-auto" />
        <span class="text-dimmed"><b class="font-semibold text-default">English</b> · Español</span>
      </div>
      <div class="mx-auto flex w-full max-w-100 flex-col gap-5"><slot /></div>
    </div>
  </div>
</template>
