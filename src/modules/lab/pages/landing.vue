<script setup lang="ts">
// A component's own address, `/lab/<system id>/<slug>`, and its retired
// `/variants` open the Playground, keeping the query, so the tab bar marks
// where the bench is. A redirect in a guard never enters the history, and
// `replace` would also drop the page the visitor came from.
definePageMeta({
  middleware: async (to) => {
    const { componentLandingAddress } = await import('../utils/redirects')
    return navigateTo({
      path: componentLandingAddress(
        String(to.params.systemId),
        String(to.params.component),
      ),
      query: to.query,
      hash: to.hash,
    })
  },
})
</script>

<template>
  <div />
</template>
