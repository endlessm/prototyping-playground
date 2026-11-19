<!-- @studio-id kgkz7va84spzkzpa -->
<script setup lang="ts">
import * as original from '../../../_map/illustrations'
import { mapRoles, type MapRoleKey } from '../../../_map/story'
import { COHORT, ORG_SHORT, roles, TEAM, type RoleKey } from '../../../_wire/world'
import * as detailed from '../../_ui/illustrations'

// Proposed. The Roles Map's illustrations beside their detailed versions, then the detailed ones at the sizes the Org
// Chart and the Teams empty state would show them. The two "In use" pieces are size checks, not those screens.
const roleOrder: MapRoleKey[] = [
  'endlessAdmin',
  'orgOwner',
  'orgManager',
  'orgReviewer',
  'teamOwner',
  'teamManager',
  'cohortOwner',
  'facilitator',
  'learner',
]

const groups = [
  {
    title: 'People',
    icons: roleOrder.map((key) => ({
      label: mapRoles[key].label,
      before: original.roleIllustrations[key],
      after: detailed.roleIllustrations[key],
    })),
  },
  {
    title: 'Places',
    icons: [
      ...(['Organization', 'Team', 'Cohort'] as const).map((kind) => ({
        label: kind,
        before: original.placeIllustrations[kind],
        after: detailed.placeIllustrations[kind],
      })),
      { label: 'Program', before: original.programIllustration, after: detailed.programIllustration },
    ],
  },
]

const position = (key: RoleKey) => ({ title: `${roles[key].label}s`, art: detailed.roleIllustrations[key] })

const chart = [
  { name: ORG_SHORT, level: 'Organization' as const, positions: (['orgOwner', 'orgManager', 'orgReviewer'] as const).map(position) },
  { name: TEAM, level: 'Team' as const, positions: (['teamOwner', 'teamManager'] as const).map(position) },
  { name: COHORT, level: 'Cohort' as const, positions: (['cohortOwner', 'facilitator'] as const).map(position) },
]

const crew = (['teamOwner', 'facilitator', 'teamManager', 'cohortOwner', 'learner'] as const).map(
  (key) => detailed.roleIllustrations[key],
)
</script>

<template>
  <div class="di-page">
    <header class="di-head">
      <h1 class="text-highlighted">Detailed icons</h1>
      <p class="text-muted">The Roles Map's set with more detail, for the Org Chart and the Teams empty state.</p>
    </header>

    <section v-for="group in groups" :key="group.title" class="di-group">
      <h2 class="text-highlighted">{{ group.title }}</h2>
      <ul class="di-grid">
        <li v-for="icon in group.icons" :key="icon.label" class="di-card">
          <p class="di-name text-highlighted">{{ icon.label }}</p>
          <div class="di-pair">
            <figure>
              <img :src="icon.before" alt="" width="96" height="96" />
              <figcaption class="text-dimmed">Before</figcaption>
            </figure>
            <figure>
              <img :src="icon.after" alt="" width="96" height="96" />
              <figcaption class="text-dimmed">After</figcaption>
            </figure>
            <div class="di-sizes">
              <img :src="icon.after" alt="" width="48" height="48" />
              <img :src="icon.after" alt="" width="32" height="32" />
              <img :src="icon.after" alt="" width="24" height="24" />
            </div>
          </div>
        </li>
      </ul>
    </section>

    <section class="di-group">
      <h2 class="text-highlighted">In use</h2>
      <div class="di-use">
        <div class="di-check">
          <p class="di-caption text-muted">Org Chart card: the place at 36 px, each position at 24 px</p>
          <div class="di-chart">
            <article v-for="place in chart" :key="place.name" class="di-place">
              <header>
                <img :src="detailed.placeIllustrations[place.level]" alt="" width="36" height="36" />
                <div>
                  <p class="di-place-name text-highlighted">{{ place.name }}</p>
                  <p class="di-place-level text-muted">{{ place.level }}</p>
                </div>
              </header>
              <p v-for="p in place.positions" :key="p.title" class="di-position text-muted">
                <img :src="p.art" alt="" width="24" height="24" />
                {{ p.title }}
              </p>
            </article>
          </div>
        </div>

        <div class="di-check">
          <p class="di-caption text-muted">Teams empty state: the Team at 60 px on its tile, people at 46 px</p>
          <div class="di-stage">
            <img v-for="(src, i) in crew.slice(0, 2)" :key="`l${i}`" :src="src" alt="" class="di-rider" :class="{ 'di-low': i === 0 }" />
            <span class="di-hub"><img :src="detailed.placeIllustrations.Team" alt="" /></span>
            <img v-for="(src, i) in crew.slice(2)" :key="`r${i}`" :src="src" alt="" class="di-rider" :class="{ 'di-low': i === 1 }" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.di-page {
  display: flex;
  flex-direction: column;
  gap: 40px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 40px 32px 64px;
}

.di-head h1 {
  font-size: 30px;
  font-weight: 600;
  line-height: 36px;
}

.di-head p {
  margin-top: 4px;
  font-size: 14px;
  line-height: 20px;
}

.di-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.di-group h2 {
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}

.di-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.di-card,
.di-check {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px 20px;
  border: 1px solid var(--ui-border);
  border-radius: 16px;
  background: #fff;
}

.di-name {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.di-page img {
  flex: none;
  max-width: none;
}

.di-pair {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.di-pair figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.di-pair figure img {
  width: 104px;
  height: 104px;
}

.di-pair figcaption {
  font-size: 12px;
  line-height: 16px;
}

.di-sizes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 48px;
  margin-left: auto;
}

.di-sizes img:nth-child(1) {
  width: 48px;
  height: 48px;
}

.di-sizes img:nth-child(2) {
  width: 32px;
  height: 32px;
}

.di-sizes img:nth-child(3) {
  width: 24px;
  height: 24px;
}

.di-place img {
  width: 36px;
  height: 36px;
}

.di-position img {
  width: 24px;
  height: 24px;
}

.di-use {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 16px;
}

.di-caption {
  font-size: 13px;
  line-height: 20px;
}

.di-chart {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.di-place {
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: 16px;
}

.di-place header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--ui-border);
}

.di-place-name {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.di-place-level {
  font-size: 12px;
  line-height: 16px;
}

.di-position {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}

.di-position + .di-position {
  border-top: 1px solid var(--ui-border);
}

.di-stage {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: 190px;
  border-radius: 12px;
  background:
    radial-gradient(closest-side at 30% 40%, rgb(101 86 240 / 0.16), transparent),
    radial-gradient(closest-side at 72% 55%, rgb(255 137 4 / 0.16), transparent);
}

.di-rider {
  width: 46px;
  height: 46px;
  border-radius: 9999px;
  box-shadow:
    0 0 0 3px #fff,
    0 10px 18px -8px rgb(15 12 36 / 0.4);
  translate: 0 -14px;
}

.di-rider.di-low {
  translate: 0 16px;
}

.di-hub {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 28px;
  background: #fff;
  box-shadow:
    0 1px 2px rgb(15 12 36 / 0.08),
    0 18px 36px -12px rgb(255 105 0 / 0.5),
    0 10px 24px -10px rgb(101 86 240 / 0.45);
}

.di-hub img {
  width: 62%;
  height: 62%;
}
</style>
