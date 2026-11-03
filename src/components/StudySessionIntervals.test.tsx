import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StudySessionIntervals } from './StudySessionIntervals'
import { studySession } from '../test/studySessionFixtures'

describe('study session interval history', () => {
  it('shows separate executed intervals and marks an open interval', () => {
    render(<StudySessionIntervals session={{ ...studySession, intervals: [
      { id: 1, started_at: '2030-01-15T15:05:00Z', ended_at: '2030-01-15T15:20:00Z' },
      { id: 2, started_at: '2030-01-15T15:25:00Z', ended_at: null },
    ] }} />)
    expect(screen.getByRole('heading', { name: 'Intervalos de ejecución' })).toBeVisible()
    expect(screen.getByText('Tramo 1')).toBeVisible()
    expect(screen.getByText('Tramo 2')).toBeVisible()
    expect(screen.getByText('En curso')).toBeVisible()
  })

  it('omits the history section before the first start', () => {
    const { container } = render(<StudySessionIntervals session={{ ...studySession, start_at: null, intervals: [] }} />)
    expect(container).toBeEmptyDOMElement()
  })
})
