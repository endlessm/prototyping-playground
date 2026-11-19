<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import NavItem from './NavItem.vue'
import Pill from './Pill.vue'
import { N } from './content'
import { useWalkthrough } from './walkthrough'

// The proposed studio around a step: a rail with only global items, and the
// product's own navigation, where everything about the product lives.
const { step, go } = useWalkthrough()
const inPrototype = computed(() => ['canvas', 'update', 'handoff'].includes(step.value))
</script>

<template>
  <div class="frame">
    <div class="rail">
      <Icon name="menu" :size="18" />
      <Icon name="search" :size="18" />
      <div class="grow" />
      <Icon name="book-open" :size="18" />
      <Icon name="users" :size="18" />
      <Icon name="settings" :size="18" />
    </div>

    <nav class="product-nav" :aria-label="N.product">
      <button type="button" class="product">
        <span class="logo">∞</span>
        <span class="product-name">Endless Studios</span>
        <Icon name="chevron-down" :size="14" class="muted" />
      </button>
      <button type="button" class="source" @click="go('connect')">
        <Icon name="folder-git-2" :size="12" /> studio · dev · pulled 2 days ago
      </button>

      <NavItem icon="layout-grid" label="Home" :active="step === 'home'" @click="go('home')" />
      <NavItem
        icon="monitor-smartphone"
        :label="N.screens"
        :count="12"
        :active="step === 'screens' || step === 'screen'"
        @click="go('screens')"
      >
        <template #badge><Pill tone="sky">↻ 3</Pill></template>
      </NavItem>
      <NavItem
        icon="pen-tool"
        :label="N.prototypes"
        :count="9"
        :active="inPrototype"
        @click="go('canvas')"
      >
        <template #badge><Pill tone="sky">↻ 2</Pill></template>
      </NavItem>
      <NavItem icon="flask-conical" :label="N.lab" :count="3" :active="step === 'lab'" @click="go('lab')" />

      <div class="section">{{ N.system }}</div>
      <NavItem icon="shapes" label="Endless Studios UI">
        <template #badge><Pill>default</Pill></template>
      </NavItem>
      <NavItem label="Theme" :depth="1" />
      <NavItem label="Assets" :depth="1" />
      <NavItem label="Components" :depth="1" :count="41" />

      <div class="section">Knowledge</div>
      <NavItem icon="file-text" label="Context" :count="6" />
      <NavItem icon="wand-sparkles" label="Skills" :count="4" />

      <div class="grow" />
      <NavItem
        icon="settings"
        :label="`${N.source} & settings`"
        :active="step === 'connect'"
        @click="go('connect')"
      />
    </nav>

    <main :key="step" class="main"><slot /></main>
  </div>
</template>

<style scoped>
.frame {
  display: flex;
  border-radius: 12px;
  border: 1px solid var(--zinc-200);
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}
.rail {
  width: 48px;
  flex-shrink: 0;
  border-right: 1px solid var(--zinc-200);
  background: var(--zinc-50);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 16px;
  color: var(--zinc-600);
}
.grow {
  flex: 1;
}
.product-nav {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--zinc-200);
  background: #fff;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}
.product {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 6px;
}
.product:hover {
  background: var(--zinc-50);
}
.logo {
  height: 24px;
  width: 24px;
  border-radius: 6px;
  background: var(--zinc-900);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.product-name {
  flex: 1;
  text-align: left;
  font-weight: 600;
  font-size: 15px;
  color: var(--zinc-900);
}
.muted {
  color: var(--zinc-400);
}
.source {
  padding: 0 4px 8px;
  font-size: 12px;
  color: var(--zinc-500);
  display: flex;
  align-items: center;
  gap: 4px;
  text-align: left;
}
.section {
  margin: 12px 0 4px;
  padding: 0 8px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: var(--zinc-400);
}
.main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  position: relative;
}
</style>
