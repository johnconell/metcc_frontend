const THEME_KEY = 'app_theme';
const LOCALE_KEY = 'app_locale';
const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

export const preferenceStorage = {
  getTheme: () => localStorage.getItem(THEME_KEY) || 'system',
  setTheme: (theme) => localStorage.setItem(THEME_KEY, theme),
  getLocale: () => localStorage.getItem(LOCALE_KEY) || 'en',
  setLocale: (locale) => localStorage.setItem(LOCALE_KEY, locale),
  getSidebarCollapsed: () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true',
  setSidebarCollapsed: (collapsed) => localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed)),
};
