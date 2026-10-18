export interface OnboardingStatus {
  status: 'incomplete' | 'complete'
  academic_profile_complete: boolean
  questionnaire_complete: boolean
  next_step: 'academic_profile' | 'questionnaire' | 'complete'
}

export interface AcademicProfileRequest {
  degree_program: string
  semester: number
}
