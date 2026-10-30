// `useNuxtApp()` and the composables copied components call without importing them. Each reads the runtime that
// createStudiosApp provides to its Vue app, so each screen keeps its own locale, user and sample data.
import { inject, ref, type MaybeRefOrGetter, type Ref } from 'vue';
import type { Auth } from './auth';
import { sampleQuery, type GraphQL } from './graphql';
import type { I18n } from './i18n';
import type { Store } from './store';

export type NuxtAppStandIn = {
  $auth: Auth;
  $i18n: I18n;
  $store: Store;
  $graphqlRequest: GraphQL['request'];
  $dayjs: (date?: string | number | Date) => DayjsStandIn;
  $config: { public: Record<string, unknown> };
  graphql: GraphQL;
};

export const NUXT_APP_KEY = Symbol.for('endless-studios:nuxt-app');

export function useNuxtApp(): NuxtAppStandIn {
  const app = inject<NuxtAppStandIn | null>(NUXT_APP_KEY, null);
  if (!app) throw new Error('[Endless Studios] useNuxtApp() outside a screen created by createStudiosApp');
  return app;
}

export function useI18n() {
  return useNuxtApp().$i18n;
}

// Nuxt's `useState`: a ref shared by key within one screen, initialised on first use.
const states = new WeakMap<NuxtAppStandIn, Map<string, Ref<unknown>>>();

export function useState<T>(key: string, init?: () => T): Ref<T> {
  const app = useNuxtApp();
  if (!states.has(app)) states.set(app, new Map());
  const map = states.get(app)!;
  if (!map.has(key)) map.set(key, ref(init?.()));
  return map.get(key) as Ref<T>;
}

export function useGraphQLQuery(query: MaybeRefOrGetter<unknown>, options?: Parameters<typeof sampleQuery>[2]) {
  const app = useNuxtApp();
  return sampleQuery({ graphql: app.graphql, loggedIn: () => app.$auth.loggedIn }, query, options);
}

// `$dayjs` (dayjs-nuxt): the format tokens the app uses, in the screen's locale.
export type DayjsStandIn = ReturnType<ReturnType<typeof createDayjs>>;

export function createDayjs(locale: () => string) {
  const dayjs = (input: string | number | Date = new Date()) => {
    const date = new Date(input);
    const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale(), options).format(date);
    const ordinal = (day: number) => `${day}${[, 'st', 'nd', 'rd'][(day % 100 >> 3) ^ 1 && day % 10] || 'th'}`;
    const tokens: Record<string, () => string> = {
      YYYY: () => String(date.getFullYear()),
      YY: () => String(date.getFullYear()).slice(-2),
      MMMM: () => part({ month: 'long' }),
      MMM: () => part({ month: 'short' }),
      MM: () => String(date.getMonth() + 1).padStart(2, '0'),
      M: () => String(date.getMonth() + 1),
      Do: () => ordinal(date.getDate()),
      DD: () => String(date.getDate()).padStart(2, '0'),
      D: () => String(date.getDate()),
      HH: () => String(date.getHours()).padStart(2, '0'),
      hh: () => String(date.getHours() % 12 || 12).padStart(2, '0'),
      h: () => String(date.getHours() % 12 || 12),
      mm: () => String(date.getMinutes()).padStart(2, '0'),
      A: () => (date.getHours() < 12 ? 'AM' : 'PM'),
      LL: () => part({ dateStyle: 'long' }),
      ll: () => part({ dateStyle: 'medium' }),
    };
    const api = {
      format: (pattern = 'YYYY-MM-DDTHH:mm') =>
        pattern.replace(/\[([^\]]*)]|YYYY|YY|MMMM|MMM|MM|M|Do|DD|D|HH|hh|h|mm|A|LL|ll/g, (token, literal) => literal ?? tokens[token]()),
      // Always a number, as dayjs says it ("2 days ago", never "the day before yesterday").
      fromNow: () => {
        const seconds = (date.getTime() - Date.now()) / 1000;
        const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
        const [unit, size] = units.find(([, length]) => Math.abs(seconds) >= length) ?? ['second', 1];
        return new Intl.RelativeTimeFormat(locale(), { numeric: 'always' }).format(Math.round(seconds / size), unit);
      },
      diff: (other: string | number | Date) => date.getTime() - new Date(other).getTime(),
      isBefore: (other: string | number | Date) => date.getTime() < new Date(other).getTime(),
      isAfter: (other: string | number | Date) => date.getTime() > new Date(other).getTime(),
      toDate: () => date,
      valueOf: () => date.getTime(),
    };
    return api;
  };
  return dayjs;
}
