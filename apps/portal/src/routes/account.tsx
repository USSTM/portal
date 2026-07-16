import { createFileRoute } from '@tanstack/react-router'

import { getPortalShell } from '../auth/shell'
import { AccessDenied } from '../components/auth-state'

export const Route = createFileRoute('/account')({
  component: Account,
  loader: () => getPortalShell(),
})

function Account() {
  const shell = Route.useLoaderData()
  if (shell.kind === 'denied') return <AccessDenied />

  if (shell.kind === 'superuser') {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Account</p>
          <h1 className="text-3xl font-semibold tracking-tight">Superuser</h1>
        </div>
        <dl className="space-y-4 rounded-lg border bg-card p-5">
          <div>
            <dt className="text-sm text-muted-foreground">Verified email</dt>
            <dd>{shell.account.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Authority</dt>
            <dd>{shell.account.authorityDescription}</dd>
          </div>
        </dl>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Account</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {shell.account.displayName}
        </h1>
      </div>
      <dl className="space-y-4 rounded-lg border bg-card p-5">
        <div>
          <dt className="text-sm text-muted-foreground">Verified email</dt>
          <dd>{shell.account.email}</dd>
        </div>
        <div id="clubs">
          <dt className="text-sm text-muted-foreground">Active grants</dt>
          <dd>{shell.account.grants.join(', ')}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Accessible Clubs</dt>
          <dd>
            {shell.account.clubs.length > 0
              ? shell.account.clubs.map((club) => club.fullName).join(', ')
              : 'None'}
          </dd>
        </div>
        {shell.account.boardPosition ? (
          <div id="board-position">
            <dt className="text-sm text-muted-foreground">Board Position</dt>
            <dd>{shell.account.boardPosition}</dd>
          </div>
        ) : null}
      </dl>
    </main>
  )
}
