export type ThemeName = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'denkspiele-theme'

function syncThemeColorMeta(): void {
  const meta = document.querySelector('meta[name=\"theme-color\"]')
  if (!(meta instanceof HTMLMetaElement)) return

  const background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  if (background.length > 0) meta.content = background
}

export function applyTheme(theme: ThemeName): void {
  const root = document.documentElement
  const isDark = theme === 'dark'
  root.classList.toggle('my-app-dark', isDark)
  root.classList.toggle('my-app-light', !isDark)
  syncThemeColorMeta()
}

export function readStoredTheme(): ThemeName | null {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : null
}

export function detectSystemTheme(): ThemeName {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
