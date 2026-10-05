import { Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { WelcomePage } from '../pages/WelcomePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<WelcomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
