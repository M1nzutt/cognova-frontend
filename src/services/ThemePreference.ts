import type { Theme } from '../types/theme'

export class ThemePreference {
  private readonly key = 'cognova.theme'

  read(): Theme {
    try {
      const saved = localStorage.getItem(this.key)
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      // Storage can be unavailable; the theme still works for this visit.
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  save(theme: Theme): void {
    try {
      localStorage.setItem(this.key, theme)
    } catch {
      // A blocked storage must not prevent using the interface.
    }
  }
}
