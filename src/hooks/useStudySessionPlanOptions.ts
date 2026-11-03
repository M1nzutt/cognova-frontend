import { useCallback, useEffect, useState } from 'react'
import { useStudySessionServices } from './useStudySessionServices'
import { studySessionError } from '../utils/studySessionPresentation'
import type { Activity } from '../types/activity'
import type { Subject } from '../types/subject'

export function useStudySessionPlanOptions(initialSubjectId?: number) {
  const { loadSubjects, loadActivities } = useStudySessionServices()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? 0)
  const [loading, setLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(Boolean(initialSubjectId))
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => { if (initialSubjectId) setSubjectId(initialSubjectId) }, [initialSubjectId])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    loadSubjects(controller.signal).then(items => {
      if (!controller.signal.aborted) {
        setSubjects(items)
        setSubjectId(current => current || items.find(subject => subject.status === 'active')?.id || items[0]?.id || 0)
      }
    }).catch(reason => { if (!controller.signal.aborted) setError(studySessionError(reason)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [loadSubjects, revision])

  useEffect(() => {
    if (!subjectId) { setActivities([]); setActivitiesLoading(false); return }
    const controller = new AbortController()
    setActivities([])
    setActivitiesLoading(true)
    setError('')
    loadActivities(subjectId, controller.signal).then(items => { if (!controller.signal.aborted) setActivities(items) })
      .catch(reason => { if (!controller.signal.aborted) setError(studySessionError(reason)) })
      .finally(() => { if (!controller.signal.aborted) setActivitiesLoading(false) })
    return () => controller.abort()
  }, [loadActivities, revision, subjectId])

  const retry = useCallback(() => { setError(''); setLoading(true); setRevision(value => value + 1) }, [])
  const selectSubject = useCallback((id: number) => setSubjectId(id), [])
  return { subjects, activities, subjectId, loading, activitiesLoading, error, retry, selectSubject }
}
