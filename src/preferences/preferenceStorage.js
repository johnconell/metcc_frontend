const THEME_KEY = 'app_theme';
const LOCALE_KEY = 'app_locale';
const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';
const SIDEBAR_SECTIONS_KEY = 'sidebar_sections';

export const preferenceStorage = {
  getTheme: () => localStorage.getItem(THEME_KEY) || 'system',
  setTheme: (theme) => localStorage.setItem(THEME_KEY, theme),
  getLocale: () => localStorage.getItem(LOCALE_KEY) || 'en',
  setLocale: (locale) => localStorage.setItem(LOCALE_KEY, locale),
  getSidebarCollapsed: () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true',
  setSidebarCollapsed: (collapsed) => localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed)),
  getSidebarSections: () => {
    try {
      const raw = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        management: parsed.management ?? false,
        results: parsed.results ?? false,
        system: parsed.system ?? false,
      };
    } catch {
      return { management: false, results: false, system: false };
    }
  },
  setSidebarSections: (sections) => localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify({
    management: sections.management ?? false,
    results: sections.results ?? false,
    system: sections.system ?? false,
  })),
};
