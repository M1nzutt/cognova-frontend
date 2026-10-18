import type { OnboardingStatus } from '../types/onboarding'

export function onboardingPath(step: OnboardingStatus['next_step']) {
  switch (step) {
    case 'academic_profile': return '/onboarding/academic-profile'
    case 'questionnaire': return '/onboarding/questionnaire'
    case 'complete': return '/dashboard'
  }
}
