<script setup lang="ts">
// A test screen with the app's paged list query: one page of sample items, then no more.
import { gql } from 'graphql-request'
import { useStreamingGraphQLQuery } from '~/composables/useStreamingGraphQLQuery.js'

const { items, hasMore, fetchNext } = useStreamingGraphQLQuery(
  gql`
    query Games($limit: Int, $offset: Int) {
      games(limit: $limit, offset: $offset) {
        id
        title
      }
    }
  `,
  {
    variables: { limit: 2 },
    cursorVariables: (offset: unknown) => ({ offset }),
    defaultCursor: 0,
  },
)
await fetchNext()
</script>

<template>
  <p>Games: {{ items.map((game) => game.title).join(', ') || 'none' }}</p>
  <p>More: {{ hasMore ? 'yes' : 'no' }}</p>
</template>
