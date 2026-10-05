import { useEffect, useState } from 'react'
import { ThemePreference } from '../services/ThemePreference'

const preference = new ThemePreference()

export function useTheme() {
  const [theme, setTheme] = useState(() => preference.read())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    preference.save(theme)
  }, [theme])

  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light')
  return { theme, toggleTheme }
}
