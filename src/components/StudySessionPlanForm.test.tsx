import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StudySessionPlanForm } from './StudySessionPlanForm'
import type { Subject } from '../types/subject'
import type { Activity } from '../types/activity'
import { sessionWrite } from '../test/studySessionFixtures'

const subjects: Subject[] = [{ id: 1, name: 'Biología', difficulty: 'medium', color_base: 'green', color_shade: 300, status: 'active', created_at: '2030-01-01T00:00:00Z', updated_at: '2030-01-01T00:00:00Z' }, { id: 2, name: 'Historia', difficulty: 'easy', color_base: 'blue', color_shade: 300, status: 'active', created_at: '2030-01-01T00:00:00Z', updated_at: '2030-01-01T00:00:00Z' }]
const activities: Activity[] = [{ id: 7, title: 'Leer capítulo', subject_id: 1, deadline: sessionWrite.planned_start_at, original_deadline: sessionWrite.planned_start_at, deadline_revision: 0, priority: 'medium', status: 'pending', estimated_duration: 30, notes: null, created_at: sessionWrite.planned_start_at, updated_at: sessionWrite.planned_start_at }]
const setup = (props: Partial<React.ComponentProps<typeof StudySessionPlanForm>> = {}) => {
  const onSave = vi.fn(), onSubjectChange = vi.fn()
  render(<StudySessionPlanForm subjects={subjects} activities={activities} activitiesLoading={false} busy={false} error="" onSubjectChange={onSubjectChange} onSave={onSave} onCancel={vi.fn()} {...props} />)
  return { onSave, onSubjectChange }
}

describe('study session planning form', () => {
  it('creates a plan with a required subject and no optional activity', async () => {
    const { onSave } = setup()
    await userEvent.type(screen.getByLabelText('Fecha y hora planificadas'), '2030-01-15T10:00')
    await userEvent.click(screen.getByRole('button', { name: 'Crear sesión planificada' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ subject_id: 1, activity_id: null, planned_duration: 45 }))
    expect(Date.parse(onSave.mock.calls[0][0].planned_start_at)).toBe(Date.parse('2030-01-15T10:00'))
  })

  it('allows only activities belonging to the selected subject', async () => {
    const { onSave, onSubjectChange } = setup()
    await userEvent.selectOptions(screen.getByLabelText('Actividad (opcional)'), '7')
    await userEvent.type(screen.getByLabelText('Fecha y hora planificadas'), '2030-01-15T10:00')
    await userEvent.click(screen.getByRole('button', { name: 'Crear sesión planificada' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ activity_id: 7 }))
    await userEvent.selectOptions(screen.getByLabelText('Materia'), '2')
    expect(onSubjectChange).toHaveBeenCalledWith(2)
    expect(screen.getByLabelText('Actividad (opcional)')).toHaveValue('')
  })

  it('rejects durations outside the backend bounds before submitting', async () => {
    const { onSave } = setup()
    fireEvent.change(screen.getByLabelText('Fecha y hora planificadas'), { target: { value: '2030-01-15T10:00' } })
    fireEvent.change(screen.getByLabelText('Duración planificada (minutos)'), { target: { value: '181' } })
    await userEvent.click(screen.getByRole('button', { name: 'Crear sesión planificada' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('10 y 180')
    expect(onSave).not.toHaveBeenCalled()
  })
})
