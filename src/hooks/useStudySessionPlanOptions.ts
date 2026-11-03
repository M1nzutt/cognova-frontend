import { useCallback, useEffect, useState } from 'react'
import { useStudySessionServices } from './useStudySessionServices'
import { studySessionError } from '../utils/studySessionPresentation'
import type { Activity } from '../types/activity'
import type { Subject } from '../types/subject'

interface SubjectSnapshot { revision: number; items: Subject[]; error: string }
interface ActivitySnapshot { revision: number; subjectId: number; items: Activity[]; error: string }

export function useStudySessionPlanOptions(initialSubjectId?: number) {
  const { loadSubjects, loadActivities } = useStudySessionServices()
  const [subjectSnapshot, setSubjectSnapshot] = useState<SubjectSnapshot | null>(null)
  const [activitySnapshot, setActivitySnapshot] = useState<ActivitySnapshot | null>(null)
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? 0)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    loadSubjects(controller.signal).then(items => {
      if (!controller.signal.aborted) {
        setSubjectSnapshot({ revision, items, error: '' })
        setSubjectId(current => current || items.find(subject => subject.status === 'active')?.id || items[0]?.id || 0)
      }
    }).catch(reason => { if (!controller.signal.aborted) setSubjectSnapshot({ revision, items: [], error: studySessionError(reason) }) })
    return () => controller.abort()
  }, [loadSubjects, revision])

  useEffect(() => {
    if (!subjectId) return
    const controller = new AbortController()
    loadActivities(subjectId, controller.signal).then(items => {
      if (!controller.signal.aborted) setActivitySnapshot({ revision, subjectId, items, error: '' })
    }).catch(reason => { if (!controller.signal.aborted) setActivitySnapshot({ revision, subjectId, items: [], error: studySessionError(reason) }) })
    return () => controller.abort()
  }, [loadActivities, revision, subjectId])

  const currentSubjects = subjectSnapshot?.revision === revision ? subjectSnapshot : null
  const currentActivities = activitySnapshot?.revision === revision && activitySnapshot.subjectId === subjectId ? activitySnapshot : null
  const retry = useCallback(() => setRevision(value => value + 1), [])
  const selectSubject = useCallback((id: number) => setSubjectId(id), [])
  return {
    subjects: currentSubjects?.items ?? [],
    activities: currentActivities?.items ?? [],
    subjectId,
    loading: currentSubjects === null,
    activitiesLoading: subjectId > 0 && currentActivities === null,
    error: currentSubjects?.error || currentActivities?.error || '',
    retry,
    selectSubject,
  }
}
