// The single entry point to the Endless Studios Vue runtime. The preview document and the system's tests create
// every app here, so they share one set of plugins and stand-ins.
import { createApp, createSSRApp, h, Suspense, type App, type Component } from 'vue';
import ui from '@nuxt/ui/vue-plugin';
import UApp from '@nuxt/ui/components/App.vue';
import { addCollection } from '@iconify/vue';
import lucide from '@iconify-json/lucide/icons.json';
import { createI18n, defaultLocale } from '../runtime/i18n';
import { NuxtLink } from '../runtime/navigation';
import { createDayjs, NUXT_APP_KEY, type NuxtAppStandIn } from '../runtime/nuxt-app';

addCollection(lucide);

/** What a screen sees of the app around it. Defaults: English. */
export type StudiosRuntimeOptions = {
  /** A locale code from the app's locale files: `en` (default) or `es`. */
  locale?: string;
};

export type StudiosAppOptions = StudiosRuntimeOptions & {
  component: Component;
  /** The component's props. Pass a reactive object to update them without recreating the app. */
  props?: Record<string, unknown>;
  /** Create an app for Vue's server renderer, as the tests do. */
  ssr?: boolean;
};

export type StudiosApp = App & { runtime: NuxtAppStandIn };

export function createStudiosApp({ component, props, ssr = false, locale = defaultLocale }: StudiosAppOptions): StudiosApp {
  const i18n = createI18n(locale);
  const runtime: NuxtAppStandIn = {
    $i18n: i18n,
    $dayjs: createDayjs(() => i18n.locale.value),
    $config: { public: {} },
  };

  // Suspense lets copied components that `await` in setup render.
  const screen = () => h(component, { ...props });
  const root = { render: () => h(UApp, null, () => h(Suspense, null, { default: screen })) };
  const app = (ssr ? createSSRApp(root) : createApp(root)) as StudiosApp;
  app.use(ui);
  app.component('NuxtLink', NuxtLink);
  app.provide(NUXT_APP_KEY, runtime);
  Object.assign(app.config.globalProperties, {
    $t: i18n.t,
    $te: i18n.te,
    $tm: i18n.tm,
    $i18n: i18n,
    $dayjs: runtime.$dayjs,
  });
  app.runtime = runtime;
  return app;
}
