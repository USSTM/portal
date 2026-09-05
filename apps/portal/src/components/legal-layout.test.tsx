import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LegalLayout } from './legal-layout.js'
import type { PortalShell } from '../auth/shell.js'

async function renderWithRouter(component: React.ReactNode) {
  const rootRoute = createRootRoute({
    component: () => component,
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  return renderToStaticMarkup(<RouterProvider router={router} />)
}

describe('LegalLayout', () => {
  const anonymousShell: PortalShell = { kind: 'anonymous' }
  const memberShell: PortalShell = {
    kind: 'member',
    email: 'member@usstm.ca',
    capabilities: {
      clubAccess: true,
      boardMember: false,
      administrator: false,
      superuser: false,
    },
    account: {
      email: 'member@usstm.ca',
      displayName: 'Test Member',
      grants: ['Club Access'],
      clubs: [],
      boardPosition: null,
    },
  }

  it('renders public navigation and footer when unauthenticated', async () => {
    const markup = await renderWithRouter(
      <LegalLayout
        currentDocument="privacy"
        shell={anonymousShell}
        title="Privacy Policy"
        lastUpdated="September 4, 2026"
      >
        <p>Test Privacy Content</p>
      </LegalLayout>,
    )

    expect(markup).toContain('Privacy Policy')
    expect(markup).toContain('Terms of Service')
    expect(markup).toContain('Sign In')
    expect(markup).toContain('Test Privacy Content')
    expect(markup).toContain('Undergraduate Science Society of TMU')
  })

  it('renders within portal view when authenticated', async () => {
    const markup = await renderWithRouter(
      <LegalLayout
        currentDocument="terms"
        shell={memberShell}
        title="Terms of Service"
        lastUpdated="September 4, 2026"
      >
        <p>Test Terms Content</p>
      </LegalLayout>,
    )

    expect(markup).toContain('Terms of Service')
    expect(markup).toContain('Test Terms Content')
    expect(markup).toContain('Legal &amp; Governance')
  })
})
