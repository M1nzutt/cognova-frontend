import { Navigate, Route, Routes } from 'react-router-dom'
import { AcademicProfilePage } from '../pages/AcademicProfilePage'
import { OnboardingRoute } from './OnboardingRoute'
import { CompletedRoute } from './CompletedRoute'
import { AppShell } from '../components/AppShell'
import { WelcomePage } from '../pages/WelcomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { DashboardPendingPage } from '../pages/DashboardPendingPage'
import { QuestionnairePage } from '../pages/QuestionnairePage'
import { ProtectedRoute } from './ProtectedRoute'
import { GuestRoute } from './GuestRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<WelcomePage />} />
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<CompletedRoute />}>
            <Route path="dashboard" element={<DashboardPendingPage />} />
            <Route path="app/questionnaire" element={<QuestionnairePage />} />
          </Route>
          <Route element={<OnboardingRoute />}>
            <Route path="onboarding/academic-profile" element={<AcademicProfilePage />} />
            <Route path="onboarding/questionnaire" element={<QuestionnairePage />} />
          </Route>
          <Route path="questionnaire" element={<Navigate to="/onboarding/questionnaire" replace />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
