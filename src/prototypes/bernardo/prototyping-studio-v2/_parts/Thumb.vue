<script setup lang="ts">
import Icon from './Icon.vue'
import type { ThumbKind } from './content'

// A miniature of an app screen: a sidebar and a page of one kind.
withDefaults(
  defineProps<{
    kind?: ThumbKind
    h?: number
    /** The app changed after this was pulled. */
    changed?: boolean
    /** The proposal's change: a highlighted row, or bigger covers. */
    highlight?: boolean
    /** No sample yet, so the screen can't render. */
    broken?: boolean
    empty?: boolean
    /** The app's newer header button. */
    extra?: boolean
  }>(),
  { kind: 'table', h: 120 },
)
</script>

<template>
  <div v-if="broken" class="broken" :style="{ height: `${h}px` }">
    <Icon name="info" :size="18" class="broken-icon" />
    <div class="broken-title">Couldn't show this screen</div>
    <div class="broken-hint">It needs a sample: which game?</div>
  </div>
  <div v-else class="thumb" :style="{ height: `${h}px` }">
    <div class="side">
      <div class="bar logo" />
      <div v-for="i in 5" :key="i" class="bar" :class="{ dark: i === 2 }" />
    </div>
    <div class="page">
      <div class="head">
        <div class="title" />
        <div class="grow" />
        <div v-if="extra" class="extra" />
      </div>

      <template v-if="kind === 'table' && !empty">
        <div class="row">
          <div v-for="i in 3" :key="i" class="box cell" />
        </div>
        <div v-if="highlight" class="flagged" />
        <div v-for="i in 4" :key="i" class="box line" />
      </template>
      <div v-else-if="kind === 'table'" class="empty">No learners yet · Invite</div>

      <div v-else-if="kind === 'cards'" class="cards">
        <div v-for="i in 6" :key="i" class="box card" :class="{ ring: highlight && i <= 3 }">
          <div class="cover" :class="{ big: highlight }" />
        </div>
      </div>

      <template v-else-if="kind === 'profile'">
        <div class="person">
          <div class="avatar" />
          <div class="name" />
        </div>
        <div class="stats">
          <div v-for="i in 4" :key="i" class="box stat" :class="{ ring: highlight }" />
        </div>
      </template>

      <template v-else-if="kind === 'form'">
        <div v-for="i in 3" :key="i" class="box input" />
        <div class="submit" />
      </template>

      <div v-else-if="kind === 'drawer'" class="split">
        <div class="rows">
          <div v-for="i in 4" :key="i" class="box line" />
        </div>
        <div class="drawer">
          <div v-for="i in 3" :key="i" class="bar" />
          <div class="drawer-action" />
        </div>
      </div>

      <template v-else-if="kind === 'dash'">
        <div class="box hero" />
        <div class="split">
          <div class="box grow" />
          <div class="box third" />
        </div>
      </template>
    </div>
    <div v-if="changed" class="changed">↻</div>
  </div>
</template>

<style scoped>
.broken {
  border-radius: 6px;
  border: 2px dashed var(--rose-200);
  background: rgb(255 241 242 / 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 12px;
}
.broken-icon {
  color: var(--rose-400);
}
.broken-title {
  font-size: 12px;
  color: var(--rose-800);
  margin-top: 4px;
}
.broken-hint {
  font-size: 11px;
  color: rgb(190 18 60 / 0.8);
}

.thumb {
  position: relative;
  border-radius: 6px;
  border: 1px solid var(--zinc-200);
  background: var(--slate-50);
  overflow: hidden;
  display: flex;
}
.side {
  width: 22%;
  background: #fff;
  border-right: 1px solid var(--zinc-200);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bar {
  height: 6px;
  border-radius: 4px;
  background: var(--zinc-200);
}
.bar.logo {
  width: 32px;
  background: var(--zinc-800);
}
.bar.dark {
  background: var(--zinc-800);
}
.page {
  flex: 1;
  min-width: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.head {
  display: flex;
  align-items: center;
  gap: 4px;
}
.title {
  height: 8px;
  width: 50%;
  border-radius: 4px;
  background: var(--zinc-700);
}
.grow {
  flex: 1;
}
.extra {
  height: 10px;
  width: 32px;
  border-radius: 4px;
  background: var(--amber-400);
}
.box {
  background: #fff;
  border: 1px solid var(--zinc-200);
  border-radius: 4px;
}
.ring {
  box-shadow: 0 0 0 2px var(--emerald-400);
}
.row {
  display: flex;
  gap: 4px;
}
.cell {
  height: 16px;
  flex: 1;
}
.flagged {
  height: 12px;
  border-radius: 4px;
  background: var(--violet-200);
  border: 1px solid var(--violet-300);
}
.line {
  height: 8px;
}
.empty {
  flex: 1;
  border: 1px dashed var(--zinc-300);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--zinc-500);
}
.cards {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.card {
  overflow: hidden;
}
.cover {
  height: 50%;
  background: var(--zinc-200);
}
.cover.big {
  height: 75%;
}
.person {
  display: flex;
  align-items: center;
  gap: 6px;
}
.avatar {
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: var(--zinc-300);
}
.name {
  height: 6px;
  width: 48px;
  border-radius: 4px;
  background: var(--zinc-300);
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
.stat {
  height: 20px;
}
.input {
  height: 12px;
  width: 66%;
}
.submit {
  height: 12px;
  width: 48px;
  border-radius: 4px;
  background: var(--zinc-800);
}
.split {
  flex: 1;
  display: flex;
  gap: 4px;
}
.rows {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.drawer {
  width: 40%;
  background: #fff;
  border: 1px solid var(--violet-300);
  border-radius: 4px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.drawer-action {
  height: 8px;
  width: 32px;
  border-radius: 4px;
  background: var(--zinc-800);
}
.hero {
  height: 32px;
}
.third {
  width: 33%;
}
.changed {
  position: absolute;
  top: 4px;
  right: 4px;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: var(--sky-500);
  color: #fff;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
