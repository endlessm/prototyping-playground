<script setup lang="ts">
// A test screen for every way the app asks GraphQL: the composable with its options, the request plugin, a
// subscription and graphql-request's own client.
import { gql, GraphQLClient } from 'graphql-request'
import { QueryAuth } from '~/composables/useGraphQLQuery'

const PROGRAM = gql`
  query Program($id: Int!) {
    program(id: $id) {
      name
    }
  }
`
const { $graphqlRequest } = useNuxtApp()
const { data: program } = await useGraphQLQuery(PROGRAM, {
  variables: { id: 4 },
  auth: QueryAuth.Optional,
})
const { data: raw } = await useGraphQLQuery(PROGRAM, {
  variables: { id: 5 },
  flattenData: false,
  auth: QueryAuth.Optional,
})
const { data: shout } = await useGraphQLQuery(PROGRAM, {
  variables: { id: 6 },
  transform: (data: unknown) => (data as { name: string }).name.toUpperCase(),
  auth: QueryAuth.Optional,
})
const { data: skipped } = await useGraphQLQuery(PROGRAM, {
  variables: { id: 7 },
  skip: true,
  default: () => 'skipped',
})
const { data: member } = await useGraphQLQuery(PROGRAM, {
  variables: { id: 8 },
  default: () => 'members only',
})
const { data: guest } = await useGraphQLQuery(PROGRAM, {
  variables: { id: 9 },
  auth: QueryAuth.Anonymous,
  default: () => 'guests only',
})
const requested = await $graphqlRequest.query(PROGRAM, { id: 10 })
const mutated = await $graphqlRequest.mutate(
  gql`
    mutation Rename($id: Int!) {
      rename(id: $id)
    }
  `,
  { id: 11 },
)
$graphqlRequest.subscribe({
  query: gql`
    subscription Live {
      live
    }
  `,
})
await new GraphQLClient('https://example.org/graphql').request()
</script>

<template>
  <p>Program: {{ program?.name }}</p>
  <p>Raw: {{ raw.program?.name }}</p>
  <p>Transformed: {{ shout }}</p>
  <p>Skipped: {{ skipped }}</p>
  <p>Member: {{ member?.name ?? member }}</p>
  <p>Guest: {{ guest?.name ?? guest }}</p>
  <p>Requested: {{ requested.data.program?.name }}</p>
  <p>Mutated: {{ mutated.data?.rename }}</p>
</template>
