<script setup lang="ts">
import { computed } from 'vue'
import { ORG } from '../../../../_wire/world'
import PeopleDirectory from '../../../_ui/PeopleDirectory.vue'
import { useOrgChart } from './district'

// The Org Chart's People tab: the kit's People directory over the whole district, where Place finds a Team with its
// Cohorts.
const { directory, root } = useOrgChart()
const people = computed(() =>
  directory.value.map((person) => ({ ...person, held: person.held.map((h) => ({ ...h, group: h.team })) })),
)
const groups = computed(() => root.children.map((team) => ({ name: team.name, description: 'With its Cohorts' })))
</script>

<template>
  <PeopleDirectory :people="people" :place="ORG" :groups="groups" />
</template>
