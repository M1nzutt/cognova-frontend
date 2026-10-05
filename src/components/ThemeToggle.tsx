import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button className="button" type="button" onClick={toggleTheme} aria-pressed={theme === 'dark'}>
      Modo oscuro <span aria-hidden="true">{theme === 'dark' ? '●' : '○'}</span>
    </button>
  )
}
