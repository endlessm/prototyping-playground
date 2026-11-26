<script setup lang="ts">
import logo from '~/assets/images/logo-endless-navbar.svg'
import banner from './threadbare-banner.jpg'

// Account pages, standalone (no sidebar): the Threadbare banner beside the form panel. The logo and language switch
// sit in the panel's top corners, as on the live account pages, and the form stays one 400px column in its centre.
</script>

<template>
  <div class="grid min-h-screen grid-cols-2 bg-default">
    <div class="relative m-4 overflow-hidden rounded-[32px]">
      <img :src="banner" alt="" class="absolute inset-0 size-full object-cover" />
    </div>
    <div class="flex flex-col">
      <div class="flex h-19 flex-none items-center justify-between px-5">
        <img :src="logo" alt="Endless Studios" class="block h-7 w-auto" />
        <nav aria-label="Language" class="flex gap-6 text-sm text-default">
          <span aria-current="true" class="font-semibold text-primary">English</span>
          <span>Español</span>
        </nav>
      </div>
      <div class="flex flex-1 flex-col justify-center px-12 pb-12">
        <div class="mx-auto flex w-full max-w-100 flex-col gap-5"><slot /></div>
      </div>
    </div>
  </div>
</template>
