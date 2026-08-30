import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AccessDenied } from './auth-state.js'

describe('authentication denial', () => {
  it('does not reveal whether the email is provisioned', () => {
    const page = renderToStaticMarkup(<AccessDenied />)

    expect(page).toContain('Unable to sign in')
    expect(page).not.toMatch(/provisioned|member|deactivated/i)
  })
})
