<script setup lang="ts">
// The app's page frame around a screen: StudioLayout.vue (components/App) inside layouts/new.vue, with the copied
// StudioSidebar, StudioTopBar and StudioFooter. StudioLayout itself isn't copied: it also mounts the app's global
// modals and onboarding (task, program, blog, system events), which pull in most of the app and stay closed here.
import StudioSidebar from '~/components/App/StudioSidebar.vue'
import StudioTopBar from '~/components/App/StudioTopBar.vue'
import StudioFooter from '~/components/App/StudioFooter.vue'
</script>

<template>
  <!-- layouts/new.vue sets bg-slate-50 on <body>; this wrapper stands in for it inside the preview document. -->
  <main class="flex flex-col bg-slate-50">
    <div class="flex">
      <StudioSidebar />

      <section class="flex flex-row relative min-h-screen w-full min-w-0">
        <section id="layout-main-content" class="w-full relative flex flex-col min-h-screen">
          <StudioTopBar />

          <section class="transition-all flex flex-1 flex-col">
            <div class="flex-1">
              <slot />
            </div>
            <StudioFooter />
          </section>
        </section>
      </section>
    </div>
  </main>
</template>
