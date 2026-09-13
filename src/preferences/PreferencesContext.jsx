import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { preferenceStorage } from './preferenceStorage';
import { LANGUAGE_OPTIONS, translations } from './translations';
import { tokenStorage } from '../auth/tokenStorage';
import { profileApi } from '../api/profileApi';

const PreferencesContext = createContext(null);

const LOCALE_LANG = {
  en: 'en',
  fil: 'fil',
  ceb: 'ceb',
  ilo: 'ilo',
  hil: 'hil',
  war: 'war',
};

function resolveTheme(theme) {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
}

// Immediately apply saved theme on initial script parse so there is 0 delay
try {
  applyTheme(preferenceStorage.getTheme());
} catch {}

function applyLocale(locale) {
  document.documentElement.setAttribute('lang', LOCALE_LANG[locale] || 'en');
}

function interpolate(template, vars = {}) {
  if (!template) return template;
  return String(template).replace(/\{(\w+)\}/g, (_, key) => (
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{${key}}`
  ));
}

export function PreferencesProvider({ children }) {
  const [theme, setThemeState] = useState(() => preferenceStorage.getTheme());
  const [locale, setLocaleState] = useState(() => preferenceStorage.getLocale());

  useEffect(() => {
    applyTheme(theme);
    preferenceStorage.setTheme(theme);

    if (theme !== 'system') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  useEffect(() => {
    applyLocale(locale);
    preferenceStorage.setLocale(locale);
  }, [locale]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    preferenceStorage.setTheme(next);
    applyTheme(next);

    // Silently sync to backend user profile if authenticated
    try {
      if (tokenStorage.get()) {
        profileApi.update({ theme: next }).catch(() => {});
      }
    } catch {}
  }, []);

  const setLocale = useCallback((next) => {
    setLocaleState(next);
    preferenceStorage.setLocale(next);
    applyLocale(next);

    try {
      if (tokenStorage.get()) {
        profileApi.update({ language: next }).catch(() => {});
      }
    } catch {}
  }, []);

  const syncFromUser = useCallback((user) => {
    if (!user) return;
    // Only inherit backend user.theme if user has NOT explicitly stored one locally
    if (!preferenceStorage.hasExplicitTheme() && user.theme) {
      setThemeState(user.theme);
    }
    if (!preferenceStorage.hasExplicitLocale() && user.locale && translations[user.locale]) {
      setLocaleState(user.locale);
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const raw = translations[locale]?.[key] ?? translations.en[key] ?? key;
      return vars ? interpolate(raw, vars) : raw;
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      theme,
      locale,
      resolvedTheme: resolveTheme(theme),
      languages: LANGUAGE_OPTIONS,
      setTheme,
      setLocale,
      syncFromUser,
      t,
    }),
    [theme, locale, setTheme, setLocale, syncFromUser, t],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
}
