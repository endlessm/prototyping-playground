// A plain Vue app: the fixture systems need no plugins.
import { createApp, h, type Component } from 'vue'

export function createFixtureApp({
  component,
  props,
}: {
  component: Component
  props?: Record<string, unknown>
}) {
  return createApp({ render: () => h(component, { ...props }) })
}
