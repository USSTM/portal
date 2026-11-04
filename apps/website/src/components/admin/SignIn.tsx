import { headers } from 'next/headers'

import {
  environmentDependencies,
  readWebsiteSession,
  safeReturnTo,
} from '../../lib/content-manager-auth'

// Rendered above Payload's login form, which is hidden because the Content
// Managers collection has no local strategy. Payload shows this view only when
// no Content Manager is signed in, so a valid session here means its email has
// no Content Manager authority (or the Portal could not confirm it).
export async function SignIn({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const deniedEmail = await readDeniedEmail(await headers())
  const returnTo = safeReturnTo(searchParams?.redirect)

  if (deniedEmail) {
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <p>
          You are signed in as <strong>{deniedEmail}</strong>, which is not a
          Content Manager. Ask a Portal Administrator for Content Manager
          access, then sign in again.
        </p>
        <form
          action="/auth/logout?client=website&returnTo=/admin/login"
          method="post"
        >
          <button className="btn btn--style-secondary" type="submit">
            Sign out
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <p>Content Managers sign in with their USSTM Google account.</p>
      <a
        className="btn btn--style-primary"
        href={`/auth/sign-in?client=website&returnTo=${encodeURIComponent(returnTo)}`}
      >
        Sign in with Google
      </a>
    </div>
  )
}

async function readDeniedEmail(requestHeaders: Headers) {
  const token = readWebsiteSession(requestHeaders)
  if (!token) return undefined
  try {
    return (await environmentDependencies().verifyWebsiteSession(token)).email
  } catch {
    return undefined
  }
}
