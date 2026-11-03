import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StudySessionTimer } from './StudySessionTimer'
import { studySession } from '../test/studySessionFixtures'

describe('study session timer display', () => {
  it('animates the open server interval without persisting a local timer', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.parse(studySession.start_at!) + 3000)
    render(<StudySessionTimer session={studySession} />)
    expect(screen.getByLabelText('Tiempo efectivo 0:03')).toBeVisible()
    expect(screen.getByText(/Estimación en curso/)).toBeVisible()
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(screen.getByLabelText('Tiempo efectivo 0:04')).toBeVisible()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('shows only server-confirmed duration after pausing', () => {
    render(<StudySessionTimer session={{ ...studySession, execution_state: 'paused', actual_duration: '93.500000' }} />)
    expect(screen.getByLabelText('Tiempo efectivo 1:33')).toBeVisible()
    expect(screen.getByText(/confirmado por el servidor/)).toBeVisible()
  })
})
