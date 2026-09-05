import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AccessDenied, SignIn } from './auth-state.js'

describe('authentication sign in', () => {
  it('renders Google sign in button and office hours calendar link', () => {
    const page = renderToStaticMarkup(<SignIn />)

    expect(page).toContain('Sign in with Google')
    expect(page).toContain('View Office Hours Calendar')
    expect(page).toContain('/office-hours')
  })
})

describe('authentication denial', () => {
  it('does not reveal whether the email is provisioned', () => {
    const page = renderToStaticMarkup(<AccessDenied />)

    expect(page).toContain('Unable to sign in')
    expect(page).not.toMatch(/provisioned|member|deactivated/i)
  })
})
