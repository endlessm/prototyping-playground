// Every Vue app of __LABEL__: the preview document mounts each view with it.
// Add the system's plugins (Nuxt UI, i18n, a store) here as it grows.
import { createApp, h, type Component } from 'vue';

export function createSystemApp({
  component,
  props,
}: {
  component: Component;
  props?: Record<string, unknown>;
}) {
  return createApp({ render: () => h(component, { ...props }) });
}
