import { CalendarPage } from '../pages/CalendarPage'
import { ActivitiesPage } from '../pages/ActivitiesPage'
import { ActivityCreatePage } from '../pages/ActivityCreatePage'
import { ActivityDetailPage } from '../pages/ActivityDetailPage'
import { SubjectsPage } from '../pages/SubjectsPage'
import { SubjectCreatePage } from '../pages/SubjectCreatePage'
import { SubjectDetailPage } from '../pages/SubjectDetailPage'
import { StudySessionsPage } from '../pages/StudySessionsPage'
import { StudySessionCreatePage } from '../pages/StudySessionCreatePage'
import { StudySessionDetailPage } from '../pages/StudySessionDetailPage'
import { StudyPlansPage } from '../pages/StudyPlansPage'
import { StudyPlanCreatePage } from '../pages/StudyPlanCreatePage'
import { StudyPlanDetailPage } from '../pages/StudyPlanDetailPage'
import { StudyChallengeDetailPage } from '../pages/StudyChallengeDetailPage'
import { BehaviorAnalysisPage } from '../pages/BehaviorAnalysisPage'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AcademicProfilePage } from '../pages/AcademicProfilePage'
import { OnboardingRoute } from './OnboardingRoute'
import { CompletedRoute } from './CompletedRoute'
import { AppShell } from '../components/AppShell'
import { EntryShell } from '../components/EntryShell'
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<EntryShell />}>
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<OnboardingRoute />}>
            <Route path="onboarding/academic-profile" element={<AcademicProfilePage />} />
            <Route path="onboarding/questionnaire" element={<QuestionnairePage />} />
          </Route>
          <Route path="questionnaire" element={<Navigate to="/onboarding/questionnaire" replace />} />
        </Route>
      </Route>
      <Route element={<AppShell />}>
        <Route element={<ProtectedRoute />}>
          <Route element={<CompletedRoute />}>
            <Route path="app/calendar" element={<CalendarPage />} />
            <Route path="app/study-plans" element={<StudyPlansPage />} />
            <Route path="app/behavior" element={<BehaviorAnalysisPage />} />
            <Route path="app/study-plans/new" element={<StudyPlanCreatePage />} />
            <Route path="app/study-plans/:planId" element={<StudyPlanDetailPage />} />
            <Route path="app/study-plans/:planId/challenges/:challengeId" element={<StudyChallengeDetailPage />} />
            <Route path="app/sessions" element={<StudySessionsPage />} />
            <Route path="app/sessions/new" element={<StudySessionCreatePage />} />
            <Route path="app/sessions/:sessionId" element={<StudySessionDetailPage />} />
            <Route path="app/activities" element={<ActivitiesPage />} />
            <Route path="app/activities/new" element={<ActivityCreatePage />} />
            <Route path="app/activities/:activityId" element={<ActivityDetailPage />} />
            <Route path="app/subjects" element={<SubjectsPage />} />
            <Route path="app/subjects/archived" element={<SubjectsPage />} />
            <Route path="app/subjects/new" element={<SubjectCreatePage />} />
            <Route path="app/subjects/:subjectId" element={<SubjectDetailPage />} />
            <Route path="dashboard" element={<DashboardPendingPage />} />
            <Route path="app/questionnaire" element={<QuestionnairePage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
