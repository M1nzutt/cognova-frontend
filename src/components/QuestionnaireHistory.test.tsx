import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QuestionnaireHistory } from './QuestionnaireHistory'
import { QuestionnaireService } from '../services/QuestionnaireService'
import { ApiClient } from '../api/client'
import { catalog, response } from '../test/questionnaireFixtures'
import { jsonResponse } from '../test/authFixtures'

const service=new QuestionnaireService(new ApiClient('/api/v1',()=> 'token',vi.fn()))
describe('revision history',()=>{
  it('loads older immutable revisions with the returned exclusive cursor',async()=>{
    const fetch=vi.fn().mockResolvedValueOnce(jsonResponse({items:[{...response,revision:2}],next_before_revision:2}))
      .mockResolvedValueOnce(jsonResponse({items:[response],next_before_revision:null}))
    vi.stubGlobal('fetch',fetch)
    render(<QuestionnaireHistory service={service} catalog={catalog} />)
    expect(screen.getByRole('status')).toHaveTextContent('Consultando')
    fireEvent.click(await screen.findByRole('button',{name:'Ver revisiones anteriores'}))
    expect(await screen.findByText(/Revisión 1 ·/)).toBeVisible()
    expect(screen.getByText(/Revisión 2 ·/)).toBeVisible()
    expect(fetch.mock.calls[1][0]).toContain('before_revision=2')
    expect(screen.queryByRole('button',{name:'Ver revisiones anteriores'})).not.toBeInTheDocument()
  })
  it('shows error, explicit retry and empty result',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(jsonResponse({items:[],next_before_revision:null})))
    render(<QuestionnaireHistory service={service} catalog={catalog} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('conectar')
    fireEvent.click(screen.getByRole('button',{name:'Reintentar historial'}))
    expect(await screen.findByText('Aún no hay revisiones guardadas.')).toBeVisible()
  })
})
