<script setup lang="ts">
import HomeBlock from '../../../../app/components/HomeBlock.vue'
import { newestFirst } from '../utils/gallery'
import PrototypeNewButton from './PrototypeNewButton.vue'
import PrototypeRow from './PrototypeRow.vue'

// Home's prototypes, archived ones left out. Locally, for a contributor:
// your three newest (or a button to start one), then the three newest by
// others, so none shows twice. On the deployed site, and for someone the
// studio doesn't know: the five newest, or that nothing is published yet.
// Each heading links to the gallery.
const { t } = useI18n()
const manifest = await useManifest()
const { me, known } = useMe()
const local = import.meta.dev

const live = computed(() =>
  manifest.value.prototypes
    .filter(({ status }) => status !== 'archived')
    .sort(newestFirst),
)
const yours = (owner: string | null, contributor: string) =>
  me.value.studioId ? owner === me.value.studioId : contributor === me.value.key
const mine = computed(() =>
  me.value.key
    ? live.value
        .filter(({ owner, contributor }) => yours(owner, contributor))
        .slice(0, 3)
    : [],
)
const latest = computed(() =>
  me.value.key
    ? live.value
        .filter(({ owner, contributor }) => !yours(owner, contributor))
        .slice(0, 3)
    : live.value.slice(0, 5),
)
</script>

<template>
  <!-- Locally, nothing until the dev server says who you are, so the
       blocks don't change under you. -->
  <template v-if="known">
    <HomeBlock
      v-if="!live.length && !(local && me.key)"
      :title="t('prototypes.home.prototypes')"
      to="/prototypes"
      :hint="t('prototypes.home.nothing')"
      empty
    />
    <template v-else>
      <HomeBlock
        v-if="me.key"
        :title="t('prototypes.home.yours')"
        to="/prototypes"
      >
        <ul v-if="mine.length">
          <PrototypeRow
            v-for="prototype in mine"
            :key="prototype.id"
            :prototype="prototype"
            :byline="false"
          />
        </ul>
        <div v-else class="py-1.5 pl-2">
          <PrototypeNewButton />
        </div>
      </HomeBlock>
      <HomeBlock
        v-if="latest.length"
        :title="t(me.key ? 'prototypes.home.team' : 'prototypes.home.latest')"
        to="/prototypes"
      >
        <ul>
          <PrototypeRow
            v-for="prototype in latest"
            :key="prototype.id"
            :prototype="prototype"
          />
        </ul>
      </HomeBlock>
    </template>
  </template>
</template>
