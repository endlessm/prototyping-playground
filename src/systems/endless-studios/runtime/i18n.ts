// Stand-in for @nuxtjs/i18n (vue-i18n in composition mode): `$t` and `useI18n()` read the app's own locale files,
// copied unchanged to ../i18n/locales. As in the app's i18n.config.ts, English is the default and the fallback.
import { computed, ref, type Ref } from 'vue';
import en from '../i18n/locales/en.json';
import es from '../i18n/locales/es.json';
import { noticeOnce } from './notice';

type Messages = { [key: string]: string | Messages };

export const messages: Record<string, Messages> = { en, es };
export const locales = [
  { code: 'en', name: 'English', iso: 'en-US' },
  { code: 'es', name: 'Espanol', iso: 'es-ES' },
];
export const defaultLocale = 'en';
const fallbackLocale = 'en';

type Named = Record<string, unknown>;

export type I18n = {
  locale: Ref<string>;
  locales: Ref<typeof locales>;
  defaultLocale: string;
  fallbackLocale: Ref<string>;
  availableLocales: string[];
  t: (key: string, named?: Named | number | unknown[], plural?: number | Named) => string;
  te: (key: string, locale?: string) => boolean;
  tm: (key: string) => unknown;
  setLocale: (code: string) => Promise<void>;
};

// As in vue-i18n, a key with dots in it (`username_cant_contain...`) is found whole before it is read as a path.
function lookup(locale: string, key: string): unknown {
  const whole = messages[locale]?.[key];
  if (whole !== undefined) return whole;
  let node: unknown = messages[locale];
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Messages)[part];
  }
  return node;
}

// vue-i18n message syntax used by the app: {name} and {0} placeholders, {'literal'} text, and `a | b` plurals
// (two cases: one, other; three cases: zero, one, other).
function format(message: string, named: Named | unknown[], plural: number | undefined) {
  let text = message;
  const cases = message.split(/\s*\|\s*/);
  if (cases.length > 1) {
    const count = plural ?? Number((named as Named).count ?? (named as Named).n ?? 1);
    const index = cases.length === 2 ? (count === 1 ? 0 : 1) : Math.min(Math.abs(count), 2);
    text = cases[Math.min(index, cases.length - 1)];
  }
  return text.replace(/\{\s*(?:'([^']*)'|([\w.]+))\s*\}/g, (match, literal: string | undefined, name: string) => {
    if (literal !== undefined) return literal;
    const value = Array.isArray(named) ? named[Number(name)] : named[name];
    return value == null ? match : String(value);
  });
}

export function createI18n(initial = defaultLocale): I18n {
  if (!messages[initial]) noticeOnce(`locale:${initial}`, `no "${initial}" locale; available:`, Object.keys(messages).join(', '));
  const locale = ref(initial);
  const translate = (key: string, named: Named | number | unknown[] = {}, plural?: number | Named) => {
    let values: Named | unknown[] = typeof named === 'number' ? { n: named, count: named } : named;
    let count = typeof named === 'number' ? named : typeof plural === 'number' ? plural : undefined;
    if (plural && typeof plural === 'object') values = { ...plural, ...(values as Named) };
    if (count !== undefined && !Array.isArray(values)) values = { n: count, count, ...values };
    const message = [locale.value, fallbackLocale].map(code => lookup(code, key)).find(value => typeof value === 'string');
    if (typeof message !== 'string') {
      noticeOnce(`t:${locale.value}:${key}`, `missing translation "${key}" (${locale.value}); showing the key`);
      return key;
    }
    return format(message, values, count);
  };
  return {
    locale,
    locales: computed(() => locales),
    defaultLocale,
    fallbackLocale: ref(fallbackLocale),
    availableLocales: Object.keys(messages),
    t: translate,
    te: (key, code = locale.value) => typeof lookup(code, key) === 'string',
    tm: key => lookup(locale.value, key) ?? lookup(fallbackLocale, key) ?? {},
    setLocale: async code => {
      locale.value = code;
    },
  };
}
