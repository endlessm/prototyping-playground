<script setup lang="ts">
import Btn from './Btn.vue'
import Icon from './Icon.vue'
import ProdTag from './ProdTag.vue'
import Thumb from './Thumb.vue'
import { N } from './content'
import { useWalkthrough } from './walkthrough'

// A prototype's canvas: the app's screen in blue with the APP mark, beside
// each person's views in their own colour.
const { go } = useWalkthrough()
</script>

<template>
  <div class="canvas">
    <div class="top">
      <div class="crumb">{{ N.prototypes }} ›</div>
      <div class="name">Cohort invite flow</div>
      <div class="grow" />
      <span class="person"><span class="dot bernardo" />Bernardo</span>
      <span class="person"><span class="dot ada" />Ada</span>
    </div>

    <div class="card" style="left: 24px; top: 70px">
      <div class="label"><ProdTag date="6 Nov" note="picture" />Cohort overview</div>
      <div class="body app">
        <Thumb kind="table" :h="160" />
        <div class="caption app-caption">A picture of the app's screen from when you started. Read-only. Live in v2.</div>
      </div>
    </div>

    <Icon name="arrow-right" :size="24" class="arrow" />

    <div class="card" style="left: 295px; top: 70px">
      <div class="label"><span class="dot bernardo" />Option A · invite banner</div>
      <div class="body bernardo-ring">
        <Thumb kind="table" :h="160" highlight />
        <div class="caption">{{ N.view }} · based on the app · 6 Nov</div>
      </div>
      <button type="button" class="drift" @click="go('update')">
        ↻ The app changed since you started · 2 updates <span class="link">Compare</span>
      </button>
    </div>

    <div class="card" style="left: 565px; top: 70px">
      <div class="label"><span class="dot ada" />Option B · invite drawer</div>
      <div class="body ada-ring">
        <Thumb kind="drawer" :h="160" />
        <div class="caption">{{ N.view }} · based on the app · 6 Nov</div>
      </div>
    </div>

    <div class="sticky" style="left: 300px; top: 345px; width: 210px">
      A keeps the table. Parents with missing consent move to the top.
    </div>
    <div class="sticky" style="left: 570px; top: 300px; width: 200px">
      B needs a new drawer component. Try it in the {{ N.lab }} first?
    </div>

    <div class="actions">
      <Btn><Icon name="plus" :size="14" /> Add a {{ N.screen.toLowerCase() }}</Btn>
      <Btn><Icon name="eye" :size="14" /> Compare with the app</Btn>
      <Btn primary @click="go('handoff')"><Icon name="link-2" :size="14" /> Share comparison</Btn>
    </div>
    <div class="system-note">
      <Icon name="shapes" :size="13" /> Design system: Button updated yesterday · already in your views
    </div>
  </div>
</template>

<style scoped>
.canvas {
  position: relative;
  height: 100%;
  min-height: 520px;
  min-width: 960px;
  background-color: #fff;
  background-image: radial-gradient(var(--zinc-200) 1px, transparent 1px);
  background-size: 18px 18px;
}
.top {
  position: absolute;
  left: 16px;
  top: 12px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.crumb {
  font-size: 13px;
  color: var(--zinc-500);
}
.name {
  font-size: 14px;
  font-weight: 600;
  color: var(--zinc-900);
}
.grow {
  flex: 1;
}
.person {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--zinc-600);
}
.dot {
  height: 10px;
  width: 10px;
  border-radius: 50%;
}
.dot.bernardo {
  background: var(--violet-500);
}
.dot.ada {
  background: var(--rose-500);
}
.card {
  position: absolute;
  width: 230px;
}
.label {
  font-size: 12px;
  color: var(--zinc-700);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.body {
  border-radius: 6px;
  background: #fff;
}
.body.app {
  box-shadow: 0 0 0 2px var(--sky-400);
}
.body.bernardo-ring {
  box-shadow: 0 0 0 2px var(--violet-400);
}
.body.ada-ring {
  box-shadow: 0 0 0 2px var(--rose-300);
}
.caption {
  font-size: 11px;
  color: var(--zinc-500);
  margin-top: 4px;
}
.app-caption {
  color: var(--sky-700);
}
.arrow {
  position: absolute;
  left: 262px;
  top: 150px;
  color: var(--zinc-400);
}
.drift {
  margin-top: 8px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid var(--sky-200);
  background: var(--sky-50);
  color: var(--sky-900);
  font-size: 12px;
  padding: 6px 8px;
  text-align: left;
}
.link {
  text-decoration: underline;
}
.sticky {
  position: absolute;
  border-radius: 4px;
  background: var(--yellow-100);
  border: 1px solid var(--yellow-300);
  padding: 8px;
  font-size: 12px;
  color: var(--zinc-700);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}
.actions {
  position: absolute;
  left: 16px;
  bottom: 12px;
  display: flex;
  gap: 8px;
}
.system-note {
  position: absolute;
  right: 16px;
  bottom: 12px;
  border-radius: 8px;
  border: 1px solid var(--zinc-200);
  background: #fff;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--zinc-600);
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
