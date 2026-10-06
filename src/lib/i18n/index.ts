import i18next from 'i18next';
import siteConfig from '$lib/generated/site-config.json';
import en from './messages/en.json';
import ru from './messages/ru.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru }
} as const;

export type UiLocale = keyof typeof resources;
export type TranslationKey = keyof typeof en;
export type TranslationOptions = Record<string, string | number | boolean>;

const fallbackLocale: UiLocale =
  siteConfig.site.defaultLanguage in resources
    ? (siteConfig.site.defaultLanguage as UiLocale)
    : 'en';

void i18next.init({
  resources,
  lng: fallbackLocale,
  fallbackLng: fallbackLocale,
  supportedLngs: Object.keys(resources),
  keySeparator: false,
  nsSeparator: false,
  initAsync: false,
  interpolation: { escapeValue: false }
});

export function normalizeUiLocale(locale: string | null | undefined): UiLocale {
  return locale && locale in resources ? (locale as UiLocale) : fallbackLocale;
}

export function t(
  locale: string | null | undefined,
  key: TranslationKey,
  options: TranslationOptions = {}
): string {
  return String(i18next.t(key, { ...options, lng: normalizeUiLocale(locale) }));
}
